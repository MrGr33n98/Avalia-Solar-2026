# frozen_string_literal: true

module Api
  module V1
    module Sales
      module Ai
        class SettingsController < BaseController
          before_action :require_crm_admin!, only: %i[update]

          # GET /api/v1/sales/ai/settings
          def show
            company_id = current_company_id
            return unless company_id

            setting = ::Sales::Ai::ModelProfileResolver.ensure_defaults_for_company!(company_id)
            profiles = ::Sales::AiModelProfile.where(company_id: company_id).order(:feature)

            render json: {
              settings: serialize_setting(setting),
              model_profiles: profiles.map { |p| serialize_profile(p) },
              catalog: ::Sales::Ai::ModelRegistry.all_models,
              available_features: ::Sales::AiModelProfile::FEATURES,
              can_edit: crm_admin?
            }
          end

          # PATCH /api/v1/sales/ai/settings
          def update
            company_id = current_company_id
            return unless company_id

            setting = ::Sales::Ai::ModelProfileResolver.ensure_defaults_for_company!(company_id)

            ActiveRecord::Base.transaction do
              update_setting_attributes!(setting)
              update_profiles!(company_id) if params[:model_profiles].is_a?(Array)
            end

            profiles = ::Sales::AiModelProfile.where(company_id: company_id).order(:feature)

            render json: {
              message: 'Configurações do CRM AI Studio salvas com sucesso.',
              settings: serialize_setting(setting.reload),
              model_profiles: profiles.map { |p| serialize_profile(p) }
            }
          rescue ActiveRecord::RecordInvalid => e
            render_error_response(
              message: e.record.errors.full_messages.to_sentence,
              status: :unprocessable_entity,
              code: 'AI_SETTINGS_INVALID'
            )
          end

          private

          def update_setting_attributes!(setting)
            raw = params[:settings].is_a?(ActionController::Parameters) ? params[:settings] : params
            attrs = {}

            attrs[:enabled] = ActiveModel::Type::Boolean.new.cast(raw[:enabled]) unless raw[:enabled].nil?
            attrs[:fallback_enabled] = ActiveModel::Type::Boolean.new.cast(raw[:fallback_enabled]) unless raw[:fallback_enabled].nil?
            attrs[:require_zdr] = ActiveModel::Type::Boolean.new.cast(raw[:require_zdr]) unless raw[:require_zdr].nil?
            attrs[:monthly_budget_usd] = raw[:monthly_budget_usd].to_d if raw[:monthly_budget_usd].present?
            attrs[:daily_user_limit] = raw[:daily_user_limit].to_i if raw[:daily_user_limit].present?

            if raw[:allowed_models].is_a?(Array)
              valid_ids = raw[:allowed_models].map(&:to_s).select { |id| ::Sales::Ai::ModelRegistry.valid_model_id?(id) }
              attrs[:allowed_models] = valid_ids.uniq if valid_ids.any?
            end

            if raw[:allowed_context_fields].is_a?(Array)
              valid_fields = raw[:allowed_context_fields].map(&:to_s) & ::Sales::AiSetting::DEFAULT_ALLOWED_CONTEXT_FIELDS
              attrs[:allowed_context_fields] = valid_fields.uniq
            end

            attrs[:updated_by_user_id] = current_user.id
            setting.update!(attrs)
          end

          def update_profiles!(company_id)
            params[:model_profiles].each do |raw_profile|
              next unless raw_profile.respond_to?(:[])

              feature = raw_profile[:feature].to_s
              next unless ::Sales::AiModelProfile::FEATURES.include?(feature)

              profile = ::Sales::AiModelProfile.find_or_initialize_by(company_id: company_id, feature: feature)
              profile.primary_model_id = raw_profile[:primary_model_id].to_s if raw_profile[:primary_model_id].present?
              if raw_profile.key?(:fallback_model_id)
                profile.fallback_model_id = raw_profile[:fallback_model_id].to_s.presence
              end
              profile.temperature = raw_profile[:temperature].to_d if raw_profile[:temperature].present?
              profile.max_tokens = raw_profile[:max_tokens].to_i if raw_profile[:max_tokens].present?
              profile.quota_daily = raw_profile[:quota_daily].to_i if raw_profile[:quota_daily].present?
              profile.enabled = ActiveModel::Type::Boolean.new.cast(raw_profile[:enabled]) unless raw_profile[:enabled].nil?
              profile.save!
            end
          end

          def serialize_setting(setting)
            {
              id: setting.id,
              company_id: setting.company_id,
              provider: setting.provider,
              enabled: setting.enabled?,
              openrouter_configured: setting.openrouter_configured?,
              openrouter_masked_key: setting.openrouter_masked_key,
              openrouter_key_status: setting.openrouter_key_status,
              openrouter_last_tested_at: setting.openrouter_last_tested_at&.iso8601,
              openrouter_last_latency_ms: setting.openrouter_last_latency_ms,
              openrouter_last_error: setting.openrouter_last_error,
              monthly_budget_usd: setting.monthly_budget_usd.to_f,
              daily_user_limit: setting.daily_user_limit,
              fallback_enabled: setting.fallback_enabled?,
              require_zdr: setting.require_zdr?,
              allowed_models: setting.allowed_models_list,
              allowed_context_fields: setting.allowed_context_fields_list,
              updated_at: setting.updated_at&.iso8601
            }
          end

          def serialize_profile(profile)
            {
              id: profile.id,
              feature: profile.feature,
              primary_model_id: profile.primary_model_id,
              fallback_model_id: profile.fallback_model_id,
              temperature: profile.temperature.to_f,
              max_tokens: profile.max_tokens,
              enabled: profile.enabled?,
              quota_daily: profile.quota_daily,
              updated_at: profile.updated_at&.iso8601
            }
          end
        end
      end
    end
  end
end

