# frozen_string_literal: true

module Sales
  module Ai
    class ModelRegistry
      CATALOG = [
        {
          id: 'openai/gpt-4o-mini',
          label: 'GPT-4o Mini (OpenAI via OpenRouter)',
          provider_family: 'openai',
          tier: 'fast',
          context_window: 128_000,
          prompt_cost_per_1m_usd: 0.15,
          completion_cost_per_1m_usd: 0.60,
          supports_json: true,
          zdr_compatible: true,
          recommended_for: %w[email_first_touch email_rewrite subject_options inbox_reply inbox_summary]
        },
        {
          id: 'openai/gpt-4o',
          label: 'GPT-4o (OpenAI via OpenRouter)',
          provider_family: 'openai',
          tier: 'flagship',
          context_window: 128_000,
          prompt_cost_per_1m_usd: 2.50,
          completion_cost_per_1m_usd: 10.00,
          supports_json: true,
          zdr_compatible: true,
          recommended_for: %w[template_create campaign_preflight sequence_planner opportunity_recap]
        },
        {
          id: 'anthropic/claude-3.5-haiku',
          label: 'Claude 3.5 Haiku (Anthropic via OpenRouter)',
          provider_family: 'anthropic',
          tier: 'fast',
          context_window: 200_000,
          prompt_cost_per_1m_usd: 0.80,
          completion_cost_per_1m_usd: 4.00,
          supports_json: true,
          zdr_compatible: true,
          recommended_for: %w[email_first_touch email_rewrite inbox_reply account_briefing person_briefing]
        },
        {
          id: 'anthropic/claude-3.5-sonnet',
          label: 'Claude 3.5 Sonnet (Anthropic via OpenRouter)',
          provider_family: 'anthropic',
          tier: 'flagship',
          context_window: 200_000,
          prompt_cost_per_1m_usd: 3.00,
          completion_cost_per_1m_usd: 15.00,
          supports_json: true,
          zdr_compatible: true,
          recommended_for: %w[template_create template_block_edit campaign_preflight sequence_planner]
        },
        {
          id: 'google/gemini-2.0-flash-001',
          label: 'Gemini 2.0 Flash (Google via OpenRouter)',
          provider_family: 'google',
          tier: 'economy',
          context_window: 1_000_000,
          prompt_cost_per_1m_usd: 0.10,
          completion_cost_per_1m_usd: 0.40,
          supports_json: true,
          zdr_compatible: false,
          recommended_for: %w[subject_options inbox_summary opportunity_recap account_briefing]
        },
        {
          id: 'deepseek/deepseek-chat',
          label: 'DeepSeek V3 Chat (via OpenRouter)',
          provider_family: 'deepseek',
          tier: 'economy',
          context_window: 64_000,
          prompt_cost_per_1m_usd: 0.14,
          completion_cost_per_1m_usd: 0.28,
          supports_json: true,
          zdr_compatible: false,
          recommended_for: %w[email_first_touch email_rewrite subject_options]
        }
      ].freeze

      DEFAULT_PROFILES = {
        'email_first_touch' => { primary_model_id: 'openai/gpt-4o-mini', fallback_model_id: 'anthropic/claude-3.5-haiku', temperature: 0.3, max_tokens: 900, quota_daily: 200 },
        'email_rewrite' => { primary_model_id: 'openai/gpt-4o-mini', fallback_model_id: 'anthropic/claude-3.5-haiku', temperature: 0.25, max_tokens: 800, quota_daily: 200 },
        'subject_options' => { primary_model_id: 'openai/gpt-4o-mini', fallback_model_id: 'google/gemini-2.0-flash-001', temperature: 0.45, max_tokens: 450, quota_daily: 250 },
        'template_create' => { primary_model_id: 'openai/gpt-4o', fallback_model_id: 'anthropic/claude-3.5-sonnet', temperature: 0.35, max_tokens: 1600, quota_daily: 100 },
        'template_block_edit' => { primary_model_id: 'openai/gpt-4o-mini', fallback_model_id: 'anthropic/claude-3.5-haiku', temperature: 0.3, max_tokens: 900, quota_daily: 150 },
        'inbox_summary' => { primary_model_id: 'openai/gpt-4o-mini', fallback_model_id: 'google/gemini-2.0-flash-001', temperature: 0.2, max_tokens: 700, quota_daily: 200 },
        'inbox_reply' => { primary_model_id: 'openai/gpt-4o-mini', fallback_model_id: 'anthropic/claude-3.5-haiku', temperature: 0.3, max_tokens: 850, quota_daily: 200 },
        'person_briefing' => { primary_model_id: 'openai/gpt-4o-mini', fallback_model_id: 'anthropic/claude-3.5-haiku', temperature: 0.2, max_tokens: 800, quota_daily: 150 },
        'account_briefing' => { primary_model_id: 'openai/gpt-4o-mini', fallback_model_id: 'anthropic/claude-3.5-haiku', temperature: 0.2, max_tokens: 900, quota_daily: 150 },
        'opportunity_recap' => { primary_model_id: 'openai/gpt-4o-mini', fallback_model_id: 'anthropic/claude-3.5-haiku', temperature: 0.2, max_tokens: 900, quota_daily: 150 },
        'opportunity_next_step' => { primary_model_id: 'openai/gpt-4o-mini', fallback_model_id: 'anthropic/claude-3.5-haiku', temperature: 0.2, max_tokens: 700, quota_daily: 150 },
        'sequence_planner' => { primary_model_id: 'openai/gpt-4o', fallback_model_id: 'anthropic/claude-3.5-sonnet', temperature: 0.35, max_tokens: 1800, quota_daily: 80 },
        'campaign_preflight' => { primary_model_id: 'openai/gpt-4o-mini', fallback_model_id: 'anthropic/claude-3.5-haiku', temperature: 0.15, max_tokens: 900, quota_daily: 120 },
        'call_script' => { primary_model_id: 'openai/gpt-4o-mini', fallback_model_id: 'anthropic/claude-3.5-haiku', temperature: 0.25, max_tokens: 800, quota_daily: 120 }
      }.freeze

      def self.all_models
        CATALOG
      end

      def self.find_model(model_id)
        CATALOG.find { |m| m[:id] == model_id.to_s.strip }
      end

      def self.valid_model_id?(model_id)
        find_model(model_id).present?
      end

      def self.default_allowed_model_ids
        CATALOG.map { |m| m[:id] }
      end

      def self.estimate_cost_usd(model_id:, prompt_tokens:, completion_tokens:)
        model = find_model(model_id) || CATALOG.first
        in_cost = (prompt_tokens.to_i / 1_000_000.0) * model[:prompt_cost_per_1m_usd].to_f
        out_cost = (completion_tokens.to_i / 1_000_000.0) * model[:completion_cost_per_1m_usd].to_f
        (in_cost + out_cost).round(6)
      end
    end
  end
end
