module Api
  class MovementsController < ApplicationController
    before_action :require_operator!, only: :create
    def index
      scope = current_account.movements.includes(:product, :actor)
      scope = scope.where(product: current_account.products.find(params[:product_id])) if params[:product_id].present?
      if params[:kind].present?
        raise InvalidInput, "kind must be in or out" unless %w[in out].include?(params[:kind])
        scope = scope.where(kind: params[:kind])
      end
      render json: { movements: scope.order(created_at: :desc, id: :desc).limit(20).offset((page - 1) * 20), total: scope.count, page: page, per_page: 20 }
    end
    def create
      product = current_account.products.find(params[:product_id])
      data = params.require(:movement).permit(:kind, :quantity, :reference).to_h.symbolize_keys
      result = StockMove.call(product, current_user, data, request.headers["Idempotency-Key"])
      render json: result, status: result[:replayed] ? 200 : 201
    end
  end
end
