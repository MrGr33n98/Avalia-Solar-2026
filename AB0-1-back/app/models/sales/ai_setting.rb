# frozen_string_literal: true

module Sales
  class AiSetting < ApplicationRecord
    self.table_name = 'sales_ai_settings'

    KEY_STATUSES = %w[unconfigured active valid invalid revoked error].freeze
    DEFAULT_ALLOWED_CONTEXT_FIELDS = %w[
      contact_basic
      account_basic
      opportunity_summary
      recent_activities
      thread_messages
    ].freeze

    belongs_to :company
    has_many :model_profiles, class_name: 'Sales::AiModelProfile', foreign_key: :company_id, primary_key: :company_id

    validates :company_id, presence: true, uniqueness: true
    validates :openrouter_key_status, inclusion: { in: KEY_STATUSES }
    validates :monthly_budget_usd, numericality: { greater_than_or_equal_to: 0 }
    validates :daily_user_limit, numericality: { only_integer: true, greater_than: 0 }

    def self.for_company!(company_id)
      find_or_create_by!(company_id: company_id) do |setting|
        setting.provider = 'openrouter'
        setting.enabled = ENV.fetch('SALES_CRM_AI_STUDIO_DEFAULT', 'true') == 'true'
        setting.monthly_budget_usd = 50.0
        setting.daily_user_limit = 100
        setting.fallback_enabled = true
        setting.require_zdr = false
        setting.allowed_models = Sales::Ai::ModelRegistry.default_allowed_model_ids
        setting.allowed_context_fields = DEFAULT_ALLOWED_CONTEXT_FIELDS
        setting.policies = {
          'human_in_the_loop' => true,
          'allow_auto_send' => false
        }
      end
    end

    def rotate_openrouter_key!(raw_key, actor_user: nil)
      clean = raw_key.to_s.strip
      raise ArgumentError, 'Chave OpenRouter não pode ficar em branco' if clean.blank?

      update!(
        openrouter_api_key_ciphertext: Sales::Ai::CredentialVault.encrypt(clean),
        openrouter_masked_key: Sales::Ai::CredentialVault.mask(clean),
        openrouter_key_status: 'active',
        openrouter_key_rotated_at: Time.current,
        openrouter_last_error: nil,
        updated_by_user_id: actor_user&.id
      )
    end

    def revoke_openrouter_key!(actor_user: nil)
      update!(
        openrouter_api_key_ciphertext: nil,
        openrouter_masked_key: nil,
        openrouter_key_status: 'revoked',
        openrouter_key_rotated_at: Time.current,
        openrouter_last_error: nil,
        updated_by_user_id: actor_user&.id
      )
    end

    def openrouter_api_key
      Sales::Ai::CredentialVault.decrypt(openrouter_api_key_ciphertext)
    end

    def openrouter_configured?
      openrouter_api_key_ciphertext.present?
    end

    def allowed_models_list
      Array(allowed_models).presence || Sales::Ai::ModelRegistry.default_allowed_model_ids
    end

    def allowed_context_fields_list
      Array(allowed_context_fields).presence || DEFAULT_ALLOWED_CONTEXT_FIELDS
    end
  end
end
