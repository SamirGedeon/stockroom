class Movement < ApplicationRecord
  belongs_to :account
  belongs_to :product
  belongs_to :actor, class_name: "User"
  validates :kind, inclusion: { in: %w[in out] }
  validates :quantity, numericality: { only_integer: true, greater_than: 0, less_than_or_equal_to: 1_000_000 }
  validates :balance_after, numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 1_000_000 }
  validates :reference, presence: true, length: { maximum: 160 }
  validates :idempotency_key, format: { with: /\A[A-Za-z0-9][A-Za-z0-9._:-]{7,99}\z/ }, uniqueness: { scope: :account_id }
  def readonly? = persisted?
  def as_json(options = {})
    super(only: %i[id product_id kind quantity balance_after reference created_at]).merge(product_name: product.name, product_sku: product.sku, actor_name: actor.name)
  end
end
