module Api
  class SuppliersController < ApplicationController
    before_action :require_owner!, only: :create
    def index
      render json: current_account.suppliers.order(:name)
    end
    def create
      render json: current_account.suppliers.create!(params.require(:supplier).permit(:name, :email, :phone)), status: 201
    end
  end
end
