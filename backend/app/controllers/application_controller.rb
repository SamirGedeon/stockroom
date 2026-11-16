class ApplicationController < ActionController::API
  before_action :authenticate!
  rescue_from ActiveRecord::RecordNotFound, with: -> { render json: { errors: ["Resource not found"] }, status: 404 }
  rescue_from ActiveRecord::RecordInvalid, with: ->(e) { render json: { errors: e.record.errors.full_messages }, status: 422 }
  rescue_from ActionController::ParameterMissing, with: ->(e) { render json: { errors: [e.message] }, status: 400 }
  rescue_from InvalidInput, with: ->(e) { render json: { errors: [e.message] }, status: 422 }
  rescue_from RequestConflict, with: ->(e) { render json: { errors: [e.message] }, status: 409 }
  rescue_from ActiveRecord::RecordNotUnique, with: -> { render json: { errors: ["A record with these details already exists. Refresh and try again."] }, status: 409 }
  private
  def authenticate!
    value = request.authorization.to_s.delete_prefix("Bearer ")
    @session = Session.includes(:user).where("expires_at > ?", Time.current).find_by(token_digest: Digest::SHA256.hexdigest(value)) if value.present?
    render json: { errors: ["Please sign in again"] }, status: 401 unless @session
  end
  def current_user = @session.user
  def current_account = current_user.account
  def require_owner!
    render json: { errors: ["Only owners can manage the catalog"] }, status: 403 unless current_user.role == "owner"
  end
  def require_operator!
    render json: { errors: ["Read-only users cannot move stock"] }, status: 403 if current_user.role == "viewer"
  end
  def page
    value = Integer(params.fetch(:page, 1).to_s, exception: false)
    raise InvalidInput, "page must be between 1 and 10000" unless value && (1..10000).cover?(value)
    value
  end
  def products_scope
    scope = current_account.products.includes(:supplier)
    scope = scope.where("name ILIKE :q OR sku ILIKE :q", q: "%#{Product.sanitize_sql_like(params[:q].to_s[0,100])}%") if params[:q].present?
    case params[:stock]
    when nil, "", "all" then nil
    when "low" then scope = scope.where("on_hand <= reorder_point")
    when "empty" then scope = scope.where(on_hand: 0)
    when "healthy" then scope = scope.where("on_hand > reorder_point")
    else raise InvalidInput, "Unknown stock filter"
    end
    if params[:supplier_id].present?
      supplier = current_account.suppliers.find(params[:supplier_id])
      scope = scope.where(supplier: supplier)
    end
    scope.order(:name, :id)
  end
end
