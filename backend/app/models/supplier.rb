class Supplier < ApplicationRecord
  belongs_to :account
  has_many :products, dependent: :restrict_with_error
  validates :name, presence: true, length: { maximum: 100 }, uniqueness: { scope: :account_id }
  validates :email, presence: true, length: { maximum: 254 }, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :phone, length: { maximum: 30 }
  def as_json(options = {}) = super(only: %i[id name email phone])
end
