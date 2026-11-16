class Product < ApplicationRecord
  belongs_to :account
  belongs_to :supplier, optional: true
  has_many :movements, dependent: :restrict_with_error
  normalizes :sku, with: ->(value) { value.strip.upcase }
  validates :sku, format: { with: /\A[A-Z0-9][A-Z0-9._-]{0,39}\z/ }, uniqueness: { scope: :account_id }
  validates :name, presence: true, length: { maximum: 120 }
  validates :location, length: { maximum: 60 }
  validates :on_hand, :reorder_point, :unit_cost_cents, numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 1_000_000 }
  validate { errors.add(:supplier, "must belong to this workspace") if supplier && supplier.account_id != account_id }
  def as_json(options = {})
    super(only: %i[id sku name location on_hand reorder_point unit_cost_cents supplier_id created_at]).merge(supplier_name: supplier&.name, low_stock: on_hand <= reorder_point)
  end
end
