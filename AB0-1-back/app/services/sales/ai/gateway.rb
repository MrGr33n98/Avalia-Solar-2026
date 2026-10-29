module Sales
  module Ai
    class Gateway
      class GenerationError < StandardError
        attr_reader :code, :http_status

        def initialize(message, code: 'AI_GENERATION_FAILED', http_status: :unprocessable_entity)
          super(message)
          @code = code
          @http_status = http_status
        end
      end

      def self.generate!(user:, tenant_scope:, params:)
        new(user: user, tenant_scope: tenant_scope, params: params).generate!
      end

      def initialize(user:, tenant_scope:, params:)
        @user = user
        @tenant_scope = tenant_scope
        @company_id = user.company_id
        @params = params.to_h.deep_symbolize_keys
      end

      def generate!
        feature = @params[:feature].to_s.strip
        action = @params[:action].to_s.strip.presence || feature
        idempotency_key = @params[:idempotency_key].to_s.strip.presence

        if idempotency_key.present?
          existing = find_idempotent_generation(idempotency_key)
          return format_response(existing) if existing.present?
        end

        setting = Sales::Ai::ModelProfileResolver.ensure_defaults_for_company!(@company_id)
        resolved_profile = Sales::Ai::ModelProfileResolver.new(setting: setting).resolve!(feature: feature)

        Sales::Ai::BudgetLimiter.check!(
          setting: setting,
          profile: resolved_profile[:profile],
          user: @user
        )

        context_result = Sales::Ai::ContextBuilder.new(
          tenant_scope: @tenant_scope,
          setting: setting,
          context_params: @params[:context] || {}
        ).build!

        @messages_cache = Sales::Ai::PromptRegistry.build_messages(
          feature: feature,
          action: action,
          instructions: @params[:instructions],
          draft: @params[:draft] || {},
          options: @params[:options] || {},
          context_payload: context_result[:context_payload],
          missing_fields: context_result[:missing_fields]
        )

        api_key = resolve_api_key(setting)
        client = build_client(api_key: api_key)

        llm_result, used_fallback = execute_with_fallback!(
          client: client,
          resolved_profile: resolved_profile
        )

        validation = Sales::Ai::OutputValidator.validate_and_normalize!(
          feature: feature,
          raw_content: llm_result[:content],
          context_payload: context_result[:context_payload],
          missing_fields: context_result[:missing_fields]
        )

        estimated_cost = Sales::Ai::ModelRegistry.estimate_cost_usd(
          model_id: llm_result[:resolved_model],
          prompt_tokens: llm_result[:prompt_tokens],
          completion_tokens: llm_result[:completion_tokens]
        )

        generation = Sales::AiGeneration.create!(
          company_id: @company_id,
          user_id: @user.id,
          feature: feature,
          action_name: action,
          provider: 'openrouter',
          requested_model: resolved_profile[:primary_model_id],
          resolved_model: llm_result[:resolved_model],
          fallback_model_used: used_fallback ? llm_result[:resolved_model] : nil,
          prompt_version: Sales::Ai::PromptRegistry::VERSION,
          status: used_fallback ? 'fallback_completed' : 'completed',
          idempotency_key: idempotency_key,
          context_refs: sanitize_context_refs(@params[:context]),
          sources_used: context_result[:sources_used],
          missing_fields: context_result[:missing_fields],
          warnings: validation[:warnings],
          output_json: validation[:result],
          prompt_tokens: llm_result[:prompt_tokens],
          completion_tokens: llm_result[:completion_tokens],
          estimated_cost_usd: estimated_cost,
          latency_ms: llm_result[:latency_ms]
        )

        track_telemetry(generation, status: generation.status)
        format_response(generation)
      rescue Sales::Ai::BudgetLimiter::QuotaExceededError => e
        record_failed_generation(feature: feature, action: action, code: e.code, message: e.message)
        raise GenerationError.new(e.message, code: e.code, http_status: e.http_status)
      rescue Sales::Ai::ContextBuilder::ForbiddenContextError => e
        raise GenerationError.new(e.message, code: 'AI_CONTEXT_FORBIDDEN', http_status: :forbidden)
      rescue Sales::Ai::ModelProfileResolver::ProfileNotFoundError => e
        raise GenerationError.new(e.message, code: 'AI_INVALID_FEATURE', http_status: :unprocessable_entity)
      rescue Sales::Ai::OutputValidator::InvalidOutputError => e
        record_failed_generation(feature: feature, action: action, code: 'AI_OUTPUT_INVALID', message: e.message)
        raise GenerationError.new(e.message, code: 'AI_OUTPUT_INVALID', http_status: :bad_gateway)
      rescue Sales::Ai::OpenRouterClient::ClientError => e
        record_failed_generation(feature: feature, action: action, code: e.code, message: e.message)
        raise GenerationError.new(e.message, code: e.code, http_status: e.http_status)
      end

      def self.format_generation(generation)
        {
          generation_id: "gen_#{generation.id}",
          id: generation.id,
          status: generation.status,
          feature: generation.feature,
          action: generation.action_name,
          provider: generation.provider,
          requested_model: generation.requested_model,
          resolved_model: generation.resolved_model,
          fallback_used: generation.fallback_model_used.present?,
          prompt_version: generation.prompt_version,
          usage: {
            prompt_tokens: generation.prompt_tokens,
            completion_tokens: generation.completion_tokens,
            estimated_cost_usd: generation.estimated_cost_usd.to_f.round(6),
            latency_ms: generation.latency_ms
          },
          sources_used: generation.sources_used || [],
          missing_fields: generation.missing_fields || [],
          warnings: generation.warnings || [],
          result: generation.output_json || {},
          user_decision: generation.user_decision,
          created_at: generation.created_at&.iso8601
        }
      end

      private

      def find_idempotent_generation(idempotency_key)
        Sales::AiGeneration.where(
          company_id: @company_id,
          user_id: @user.id,
          idempotency_key: idempotency_key,
          status: %w[completed fallback_completed]
        ).order(created_at: :desc).first
      end

      def resolve_api_key(setting)
        setting.openrouter_api_key.presence || ENV['SALES_OPENROUTER_API_KEY'].to_s.strip.presence
      end

      def build_client(api_key:)
        Sales::Ai::OpenRouterClient.new(api_key: api_key)
      end

      def execute_with_fallback!(client:, resolved_profile:)
        primary_model = resolved_profile[:primary_model_id]
        fallback_model = resolved_profile[:fallback_model_id]

        begin
          result = client.chat!(
            model_id: primary_model,
            messages: @messages_cache || build_current_messages,
            temperature: resolved_profile[:temperature],
            max_tokens: resolved_profile[:max_tokens],
            require_zdr: resolved_profile[:require_zdr]
          )
          [result, false]
        rescue Sales::Ai::OpenRouterClient::ClientError => e
          raise e unless e.retryable? && fallback_model.present? && fallback_model != primary_model

          fallback_result = client.chat!(
            model_id: fallback_model,
            messages: @messages_cache || build_current_messages,
            temperature: resolved_profile[:temperature],
            max_tokens: resolved_profile[:max_tokens],
            require_zdr: resolved_profile[:require_zdr]
          )
          [fallback_result, true]
        end
      end

      def build_current_messages
        context_result = Sales::Ai::ContextBuilder.new(
          tenant_scope: @tenant_scope,
          setting: Sales::AiSetting.for_company!(@company_id),
          context_params: @params[:context] || {}
        ).build!

        @messages_cache = Sales::Ai::PromptRegistry.build_messages(
          feature: @params[:feature].to_s.strip,
          action: @params[:action].to_s.strip.presence || @params[:feature].to_s.strip,
          instructions: @params[:instructions],
          draft: @params[:draft] || {},
          options: @params[:options] || {},
          context_payload: context_result[:context_payload],
          missing_fields: context_result[:missing_fields]
        )
      end

      def sanitize_context_refs(raw_context)
        return {} unless raw_context.is_a?(Hash)

        raw_context.slice(:contact_id, :account_id, :opportunity_id, :thread_id, :campaign_id, :template_id)
                   .transform_values { |v| v.present? ? v.to_i : nil }
                   .compact
      end

      def record_failed_generation(feature:, action:, code:, message:)
        return if feature.blank? || !Sales::AiModelProfile::FEATURES.include?(feature)

        Sales::AiGeneration.create(
          company_id: @company_id,
          user_id: @user.id,
          feature: feature,
          action_name: action.presence || feature,
          provider: 'openrouter',
          requested_model: 'openrouter/pending',
          prompt_version: Sales::Ai::PromptRegistry::VERSION,
          status: 'failed',
          context_refs: sanitize_context_refs(@params[:context]),
          error_code: code,
          error_message: message.to_s.truncate(240)
        )
      rescue StandardError
        nil
      end

      def track_telemetry(generation, status:)
        return unless defined?(Analytics::PostHogService)

        Analytics::PostHogService.capture(
          user_id: @user.id,
          event: 'crm_ai_generation_completed',
          properties: {
            company_id: @company_id,
            feature: generation.feature,
            action: generation.action_name,
            provider: 'openrouter',
            resolved_model: generation.resolved_model,
            fallback_used: generation.fallback_model_used.present?,
            status: status,
            prompt_tokens: generation.prompt_tokens,
            completion_tokens: generation.completion_tokens,
            estimated_cost_usd: generation.estimated_cost_usd.to_f,
            latency_ms: generation.latency_ms,
            warnings_count: Array(generation.warnings).size,
            missing_fields_count: Array(generation.missing_fields).size
          }
        )
      rescue StandardError
        nil
      end

      def format_response(generation)
        self.class.format_generation(generation)
      end
    end
  end
end
