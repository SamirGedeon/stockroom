class Account < ApplicationRecord
  has_many :users, dependent: :restrict_with_error
  has_many :suppliers, dependent: :restrict_with_error
  has_many :products, dependent: :restrict_with_error
  has_many :movements, dependent: :restrict_with_error
  validates :name, presence: true
end
