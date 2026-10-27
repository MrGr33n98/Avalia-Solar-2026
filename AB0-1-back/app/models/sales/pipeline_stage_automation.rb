# frozen_string_literal: true

module Sales
  class PipelineStageAutomation < ApplicationRecord
    self.table_name = 'sales_pipeline_stage_automations'

    TRIGGER_TYPES = %w[on_enter].freeze

    belongs_to :company
    belongs_to :stage, class_name: 'Sales::Stage', foreign_key: :sales_stage_id
    belongs_to :sequence, class_name: 'Sales::EmailSequence', foreign_key: :sales_email_sequence_id

    validates :trigger_type, inclusion: { in: TRIGGER_TYPES }
    validates :sales_email_sequence_id, uniqueness: { scope: %i[sales_stage_id company_id] }

    scope :active, -> { where(active: true) }
    scope :on_enter, -> { where(trigger_type: 'on_enter') }
  end
end
