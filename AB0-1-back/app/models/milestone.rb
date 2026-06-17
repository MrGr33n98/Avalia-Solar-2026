class Milestone < ApplicationRecord
  belongs_to :transaction

  validates :title, presence: true
  validates :percentage, presence: true, numericality: { greater_than: 0, less_than_or_equal_to: 100 }
  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :status, presence: true
end
