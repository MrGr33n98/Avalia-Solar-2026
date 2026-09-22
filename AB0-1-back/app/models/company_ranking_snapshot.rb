# frozen_string_literal: true

class CompanyRankingSnapshot < ApplicationRecord
  DEFINITION_VERSION = 'organic-performance-v2'.freeze

  belongs_to :company

  validates :scope_type, inclusion: { in: %w[global category] }
  validates :definition_version, :score, :rank_position, :population_size, :percentile, :snapshot_date, :computed_at, presence: true
  validates :rank_position, :population_size, numericality: { greater_than: 0, only_integer: true }
  validates :snapshot_date, uniqueness: { scope: %i[company_id scope_type scope_id definition_version] }

  scope :for_scope, ->(scope_type, scope_id = nil) { where(scope_type: scope_type, scope_id: scope_id) }
  scope :latest_first, -> { order(snapshot_date: :desc, computed_at: :desc) }
end
