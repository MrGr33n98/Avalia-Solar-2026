# frozen_string_literal: true

module Sales
  class PipelineDailySnapshot < ApplicationRecord
    self.table_name = 'sales_pipeline_daily_snapshots'

    belongs_to :sales_pipeline, class_name: 'Sales::Pipeline'
    belongs_to :company, optional: true
    belongs_to :owner, class_name: 'User', optional: true
    belongs_to :source, class_name: 'Sales::Source', optional: true

    validates :snapshot_date, :captured_at, :definition_version, presence: true
    validates :open_count, numericality: { greater_than_or_equal_to: 0 }
    validates :open_value_cents, numericality: { greater_than_or_equal_to: 0 }

    scope :for_date_range, ->(from, to) { where(snapshot_date: from..to) }
    scope :for_pipeline, ->(pipeline_id) { where(sales_pipeline_id: pipeline_id) if pipeline_id.present? }
    scope :for_owner, ->(owner_id) { where(owner_id: owner_id) if owner_id.present? }
    scope :for_company, ->(company_id) { where(company_id: company_id) if company_id.present? }
    scope :chronological, -> { order(:snapshot_date) }
  end
end
