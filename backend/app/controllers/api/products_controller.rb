module Api
  class ProductsController < ApplicationController
    before_action :require_owner!, only: :create
    def index
      scope = products_scope
      render json: { products: scope.limit(20).offset((page - 1) * 20), total: scope.count, page: page, per_page: 20 }
    end
    def show
      product = current_account.products.includes(:supplier).find(params[:id])
      render json: { product: product, movements: product.movements.includes(:actor, :product).order(created_at: :desc, id: :desc).limit(50) }
    end
    def create
      data = params.require(:product).permit(:name, :sku, :location, :reorder_point, :unit_cost_cents, :supplier_id).to_h
      id = data.delete("supplier_id")
      data["supplier"] = current_account.suppliers.find(id) if id.present?
      product = current_account.with_lock do
        raise InvalidInput, "A workspace supports up to 1000 products" if current_account.products.count >= 1000
        current_account.products.create!(data.merge(on_hand: 0))
      end
      render json: product, status: 201
    end
  end
end
