# frozen_string_literal: true

# Ledger is intentionally separate from analytics. Never bill based on a browser event.
class CompanyAiUsageEntry < ApplicationRecord
  belongs_to :company
  validates :request_id, presence: true, uniqueness: true
  validates :state, inclusion: { in: %w[reserved settled released] }
  validates :input_tokens, :output_tokens, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :cost_usd, numericality: { greater_than_or_equal_to: 0 }
end
