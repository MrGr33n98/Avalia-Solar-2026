class Transaction < ApplicationRecord
  belongs_to :user
  belongs_to :company
  has_many :milestones, dependent: :destroy

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :status, presence: true
end
