# frozen_string_literal: true

module Sales
  class AiModelProfile < ApplicationRecord
    self.table_name = 'sales_ai_model_profiles'

    FEATURES = %w[
      email_first_touch
      email_rewrite
      subject_options
      template_create
      template_block_edit
      inbox_summary
      inbox_reply
      person_briefing
      account_briefing
      opportunity_recap
      opportunity_next_step
      sequence_planner
      campaign_preflight
      call_script
      whatsapp_followup
      call_organizer
      proposal_defense
      daily_digest
    ].freeze

    belongs_to :company

    validates :company_id, presence: true
    validates :feature, presence: true, inclusion: { in: FEATURES }, uniqueness: { scope: :company_id }
    validates :primary_model_id, presence: true
    validates :temperature, numericality: { greater_than_or_equal_to: 0.0, less_than_or_equal_to: 2.0 }
    validates :max_tokens, numericality: { only_integer: true, greater_than: 50, less_than_or_equal_to: 8000 }
    validates :quota_daily, numericality: { only_integer: true, greater_than: 0 }

    validate :validate_models_in_registry

    private

    def validate_models_in_registry
      unless Sales::Ai::ModelRegistry.valid_model_id?(primary_model_id)
        errors.add(:primary_model_id, "não pertence ao catálogo autorizado do OpenRouter (#{primary_model_id})")
      end

      return if fallback_model_id.blank?

      unless Sales::Ai::ModelRegistry.valid_model_id?(fallback_model_id)
        errors.add(:fallback_model_id, "não pertence ao catálogo autorizado do OpenRouter (#{fallback_model_id})")
      end
    end
  end
end
