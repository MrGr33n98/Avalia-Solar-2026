# frozen_string_literal: true

module Sales
  class AiGeneration < ApplicationRecord
    self.table_name = 'sales_ai_generations'

    STATUSES = %w[pending completed fallback_completed failed].freeze
    USER_DECISIONS = %w[accepted edited rejected].freeze

    belongs_to :company
    belongs_to :user

    validates :company_id, :user_id, :feature, :action_name, :requested_model, presence: true
    validates :status, inclusion: { in: STATUSES }
    validates :user_decision, inclusion: { in: USER_DECISIONS }, allow_nil: true

    scope :for_company, ->(company_id) { where(company_id: company_id) }
    scope :by_feature, ->(feature) { where(feature: feature) }
    scope :current_month, -> { where(created_at: Time.current.beginning_of_month..Time.current.end_of_month) }
    scope :today, -> { where(created_at: Time.current.beginning_of_day..Time.current.end_of_day) }
  end
end
