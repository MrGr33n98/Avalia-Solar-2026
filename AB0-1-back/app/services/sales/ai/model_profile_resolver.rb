# frozen_string_literal: true

module Sales
  module Ai
    class ModelProfileResolver
      class ProfileNotFoundError < StandardError; end

      def self.ensure_defaults_for_company!(company_id)
        setting = Sales::AiSetting.for_company!(company_id)
        existing_features = Sales::AiModelProfile.where(company_id: company_id).pluck(:feature)

        ModelRegistry::DEFAULT_PROFILES.each do |feature, defaults|
          next if existing_features.include?(feature)

          Sales::AiModelProfile.create!(
            company_id: company_id,
            feature: feature,
            primary_model_id: defaults[:primary_model_id],
            fallback_model_id: defaults[:fallback_model_id],
            temperature: defaults[:temperature],
            max_tokens: defaults[:max_tokens],
            quota_daily: defaults[:quota_daily],
            enabled: true
          )
        end

        setting
      end

      def initialize(setting:)
        @setting = setting
      end

      def resolve!(feature:)
        normalized_feature = feature.to_s.strip
        unless Sales::AiModelProfile::FEATURES.include?(normalized_feature)
          raise ProfileNotFoundError, "Tarefa de IA '#{normalized_feature}' não reconhecida pelo CRM AI Studio."
        end

        profile = Sales::AiModelProfile.find_by(company_id: @setting.company_id, feature: normalized_feature)
        if profile.nil?
          self.class.ensure_defaults_for_company!(@setting.company_id)
          profile = Sales::AiModelProfile.find_by(company_id: @setting.company_id, feature: normalized_feature)
        end

        if profile.nil? || !profile.enabled?
          raise ProfileNotFoundError, "A tarefa de IA '#{normalized_feature}' está desabilitada nas configurações desta empresa."
        end

        primary_id = select_permitted_model(profile.primary_model_id)
        fallback_id = @setting.fallback_enabled? ? select_permitted_model(profile.fallback_model_id) : nil

        {
          profile: profile,
          primary_model_id: primary_id,
          fallback_model_id: fallback_id,
          temperature: profile.temperature.to_f,
          max_tokens: profile.max_tokens.to_i,
          require_zdr: @setting.require_zdr?
        }
      end

      private

      def select_permitted_model(candidate_id)
        return nil if candidate_id.blank?

        allowed = @setting.allowed_models_list
        model_meta = ModelRegistry.find_model(candidate_id)

        if model_meta && allowed.include?(candidate_id) && (!@setting.require_zdr? || model_meta[:zdr_compatible])
          return candidate_id
        end

        # Fallback to first ZDR-compatible allowed model
        fallback_meta = ModelRegistry.all_models.find do |m|
          allowed.include?(m[:id]) && (!@setting.require_zdr? || m[:zdr_compatible])
        end

        fallback_meta ? fallback_meta[:id] : 'openai/gpt-4o-mini'
      end
    end
  end
end
