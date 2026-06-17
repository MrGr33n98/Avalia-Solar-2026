class Milestone < ApplicationRecord
  belongs_to :payment_transaction, class_name: 'Transaction', foreign_key: 'transaction_id'

  validates :title, presence: true
  validates :percentage, presence: true, numericality: { greater_than: 0, less_than_or_equal_to: 100 }
  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :status, presence: true
end
