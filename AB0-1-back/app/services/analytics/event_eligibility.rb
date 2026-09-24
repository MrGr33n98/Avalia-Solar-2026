# frozen_string_literal: true

require 'uri'

module Analytics
  class EventEligibility
    NON_COMMERCIAL_PATHS = %w[/auth /logout /dashboard /admin /api /health /_next].freeze
    NON_COMMERCIAL_SURFACES = %w[app admin auth system].freeze
    AUTH_HOSTS = %w[accounts.google.com appleid.apple.com login.microsoftonline.com auth.avaliasolar.com.br].freeze
    INTERNAL_HOSTS = %w[avaliasolar.com.br www.avaliasolar.com.br app.avaliasolar.com.br crm.avaliasolar.com.br].freeze

    Result = Struct.new(:eligible, :context, :reason, :category, :diagnostic_only, keyword_init: true) do
      def eligible?
        eligible == true
      end
    end

    def self.call(event_or_metadata, context: :acquisition)
      new(event_or_metadata, context: context).call
    end

    def initialize(event_or_metadata, context: :acquisition)
      @context = context.to_sym
      @metadata = extract_metadata(event_or_metadata)
      @event = event_or_metadata if event_or_metadata.respond_to?(:event_type)
    end

    def call
      case @context
      when :acquisition
        evaluate_acquisition
      when :organic_engagement
        evaluate_organic_engagement
      else
        Result.new(eligible: false, context: @context, reason: :unknown_context, category: :error, diagnostic_only: true)
      end
    end

    def self.sql_predicate(context: :organic_engagement, json_column: 'payload', is_pg: true)
      case context.to_sym
      when :organic_engagement
        if is_pg
          <<~SQL.squish
            NOT (
              (COALESCE(#{json_column}->>'is_internal', 'false') = 'true') OR
              (COALESCE(#{json_column}->>'is_employee', 'false') = 'true') OR
              (COALESCE(#{json_column}->>'is_admin', 'false') = 'true') OR
              (LOWER(COALESCE(#{json_column}->>'surface', '')) IN ('app', 'admin', 'auth', 'system'))
            )
          SQL
        else
          <<~SQL.squish
            NOT (
              (COALESCE(json_extract(#{json_column}, '$.is_internal'), 'false') = 'true') OR
              (COALESCE(json_extract(#{json_column}, '$.is_employee'), 'false') = 'true') OR
              (COALESCE(json_extract(#{json_column}, '$.is_admin'), 'false') = 'true') OR
              (LOWER(COALESCE(json_extract(#{json_column}, '$.surface'), '')) IN ('app', 'admin', 'auth', 'system'))
            )
          SQL
        end
      when :acquisition
        if is_pg
          <<~SQL.squish
            NOT (
              (COALESCE(#{json_column}->>'is_internal', 'false') = 'true') OR
              (COALESCE(#{json_column}->>'is_employee', 'false') = 'true') OR
              (COALESCE(#{json_column}->>'is_admin', 'false') = 'true') OR
              (LOWER(COALESCE(#{json_column}->>'surface', '')) IN ('app', 'admin', 'auth', 'system')) OR
              (COALESCE(#{json_column}->>'referrer_host', '') IN ('avaliasolar.com.br', 'www.avaliasolar.com.br', 'app.avaliasolar.com.br', 'crm.avaliasolar.com.br', 'accounts.google.com', 'appleid.apple.com', 'login.microsoftonline.com', 'auth.avaliasolar.com.br'))
            )
          SQL
        else
          <<~SQL.squish
            NOT (
              (COALESCE(json_extract(#{json_column}, '$.is_internal'), 'false') = 'true') OR
              (COALESCE(json_extract(#{json_column}, '$.is_employee'), 'false') = 'true') OR
              (COALESCE(json_extract(#{json_column}, '$.is_admin'), 'false') = 'true') OR
              (LOWER(COALESCE(json_extract(#{json_column}, '$.surface'), '')) IN ('app', 'admin', 'auth', 'system'))
            )
          SQL
        end
      end
    end

    private

    def evaluate_acquisition
      # 1. Atores internos
      return excluded(:internal_actor, :actor) if @metadata['is_internal'].to_s == 'true'
      return excluded(:employee, :actor) if @metadata['is_employee'].to_s == 'true'
      return excluded(:admin, :actor) if @metadata['is_admin'].to_s == 'true'

      # 2. Superfícies técnicas
      surface = @metadata['surface'].to_s.downcase
      return excluded(:technical_surface, :surface) if NON_COMMERCIAL_SURFACES.include?(surface)

      # 3. Rotas técnicas
      path = clean_path(@metadata['landing_path'] || @metadata['page_path'] || @metadata['path'])
      if path.present? && NON_COMMERCIAL_PATHS.any? { |prefix| path == prefix || path.start_with?("#{prefix}/") }
        return excluded(:technical_path, :path)
      end

      # 4. Classificação de tráfego de aquisição
      classification = Analytics::AttributionClassifier.call(@metadata)
      channel_group = classification[:channel_group].to_s

      if channel_group == 'Internal'
        return excluded(:internal_referrer, :attribution)
      end

      if channel_group == 'System/Auth'
        return excluded(:system_auth, :attribution)
      end

      # 5. Check direto de referrer host
      referrer_host = normalize_host(@metadata['referrer_host'] || @metadata['referrer'])
      if referrer_host.present?
        return excluded(:internal_referrer, :attribution) if internal_host?(referrer_host)
        return excluded(:system_auth, :attribution) if auth_host?(referrer_host)
      end

      eligible
    end

    def evaluate_organic_engagement
      # 1. Atores internos: EXCLUÍDOS
      return excluded(:internal_actor, :actor) if @metadata['is_internal'].to_s == 'true'
      return excluded(:employee, :actor) if @metadata['is_employee'].to_s == 'true'
      return excluded(:admin, :actor) if @metadata['is_admin'].to_s == 'true'

      # 2. Superfícies técnicas: EXCLUÍDAS
      surface = @metadata['surface'].to_s.downcase
      return excluded(:technical_surface, :surface) if NON_COMMERCIAL_SURFACES.include?(surface)

      # 3. Rotas técnicas: EXCLUÍDAS
      path = clean_path(@metadata['landing_path'] || @metadata['page_path'] || @metadata['path'])
      if path.present? && NON_COMMERCIAL_PATHS.any? { |prefix| path == prefix || path.start_with?("#{prefix}/") }
        return excluded(:technical_path, :path)
      end

      # DISTINÇÃO CRÍTICA:
      # Um usuário público navegando na plataforma pública (ex: de avaliasolar.com.br para /companies/weg)
      # NÃO é ator interno. É engajamento orgânico 100% legítimo.
      eligible
    end

    def extract_metadata(obj)
      if obj.respond_to?(:metadata) && obj.metadata.is_a?(Hash)
        meta = obj.metadata.stringify_keys
        ctx = obj.respond_to?(:context) && obj.context.is_a?(Hash) ? obj.context.stringify_keys : {}
        ctx.merge(meta)
      elsif obj.is_a?(Hash)
        obj.stringify_keys
      else
        {}
      end
    end

    def excluded(reason, category)
      Result.new(
        eligible: false,
        context: @context,
        reason: reason,
        category: category,
        diagnostic_only: true
      )
    end

    def eligible
      Result.new(
        eligible: true,
        context: @context,
        reason: :eligible,
        category: :valid,
        diagnostic_only: false
      )
    end

    def clean_path(path)
      value = path.to_s.split(/[?#]/).first.to_s
      value.start_with?('/') ? value : nil
    end

    def normalize_host(value)
      raw = value.to_s.strip
      return nil if raw.blank?
      host = URI.parse(raw.match?(%r{\Ahttps?://}i) ? raw : "https://#{raw}").host
      host.to_s.downcase.sub(/\Awww\./, '').presence
    rescue URI::InvalidURIError
      nil
    end

    def internal_host?(host)
      INTERNAL_HOSTS.any? { |h| host == h || host.end_with?(".#{h}") }
    end

    def auth_host?(host)
      AUTH_HOSTS.any? { |h| host == h || host.end_with?(".#{h}") }
    end
  end
end
