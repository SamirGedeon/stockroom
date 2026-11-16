require "csv"
module Api
  class ReportsController < ApplicationController
    def summary
      products = current_account.products
      recent = current_account.movements.where(created_at: 30.days.ago..Time.current).group(:kind).sum(:quantity)
      render json: { products: products.count, units: products.sum(:on_hand), low_stock: products.where("on_hand <= reorder_point").count, empty: products.where(on_hand: 0).count, inventory_value_cents: products.sum("on_hand::bigint * unit_cost_cents").to_i, incoming_30d: recent.fetch("in", 0), outgoing_30d: recent.fetch("out", 0) }
    end
    def export
      csv = CSV.generate do |row|
        row << %w[sku name location supplier on_hand reorder_point unit_cost_brl]
        products_scope.each do |p|
          row << [safe_cell(p.sku), safe_cell(p.name), safe_cell(p.location.to_s), safe_cell(p.supplier&.name.to_s), p.on_hand, p.reorder_point, "#{p.unit_cost_cents / 100}.#{(p.unit_cost_cents % 100).to_s.rjust(2, '0')}"]
        end
      end
      send_data csv, type: "text/csv; charset=utf-8", disposition: "attachment", filename: "stockroom-inventory.csv"
    end
    private
    def safe_cell(value)
      value.match?(/\A\s*[=+@-]/) || value.start_with?("\t", "\r", "\n") ? "'#{value}" : value
    end
  end
end
