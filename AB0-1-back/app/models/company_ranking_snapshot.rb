# frozen_string_literal: true

class CompanyRankingSnapshot < ApplicationRecord
  DEFINITION_VERSION = 'organic-performance-v1'.freeze

  belongs_to :company

  validates :scope_type, inclusion: { in: %w[global category] }
  validates :definition_version, :score, :rank_position, :population_size, :percentile, :computed_at, presence: true
  validates :rank_position, :population_size, numericality: { greater_than: 0, only_integer: true }

  scope :for_scope, ->(scope_type, scope_id = nil) { where(scope_type: scope_type, scope_id: scope_id) }
  scope :latest_first, -> { order(computed_at: :desc) }
end
