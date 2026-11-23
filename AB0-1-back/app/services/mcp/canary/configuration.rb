# frozen_string_literal: true

module Mcp
  module Canary
    # Configuration for the opt-in production canary and staging preview.
    # Empty allowlists, inconsistent environment profiles or an invalid phase
    # intentionally make the guard unavailable (fail closed).
    module Configuration
      CANONICAL_PRODUCTION_RESOURCE = 'https://api.avaliasolar.com.br/mcp'
      CANONICAL_PRODUCTION_ISSUER   = 'https://api.avaliasolar.com.br'
      CANONICAL_PRODUCTION_HOST     = 'api.avaliasolar.com.br'

      CANONICAL_STAGING_RESOURCE    = 'https://mcp-staging.avaliasolar.com.br/mcp'
      CANONICAL_STAGING_ISSUER      = 'https://mcp-staging.avaliasolar.com.br'
      CANONICAL_STAGING_HOST        = 'mcp-staging.avaliasolar.com.br'

      # Backwards-compatible aliases for production constants
      CANONICAL_RESOURCE = CANONICAL_PRODUCTION_RESOURCE
      CANONICAL_ISSUER   = CANONICAL_PRODUCTION_ISSUER

      DISCOVERY_PHASE = 'discovery'
      READ_ONLY_PHASE = 'read_only'
      VALID_PHASES = [DISCOVERY_PHASE, READ_ONLY_PHASE].freeze
      PUBLIC_TOOLS = %w[
        list_integrators
        show_integrator_profile
        list_solar_categories
        get_integrator_reputation
        compare_integrators
      ].freeze

      module_function

      def staging_mode?
        ENV['MCP_STAGING_MODE'] == 'true'
      end

      def staging_consistent?
        staging_mode? &&
          ENV['MCP_OAUTH_RESOURCE'] == CANONICAL_STAGING_RESOURCE &&
          ENV['MCP_OAUTH_ISSUER'] == CANONICAL_STAGING_ISSUER &&
          allowed_hosts.include?(CANONICAL_STAGING_HOST)
      end

      def production_consistent?
        !staging_mode? &&
          ENV['MCP_OAUTH_RESOURCE'] == CANONICAL_PRODUCTION_RESOURCE &&
          ENV['MCP_OAUTH_ISSUER'] == CANONICAL_PRODUCTION_ISSUER &&
          allowed_hosts.include?(CANONICAL_PRODUCTION_HOST)
      end

      def profile
        if staging_mode?
          staging_consistent? ? :staging : :invalid
        else
          production_consistent? ? :production : :invalid
        end
      end

      def canonical_resource
        case profile
        when :staging then CANONICAL_STAGING_RESOURCE
        when :production then CANONICAL_PRODUCTION_RESOURCE
        end
      end

      def canonical_issuer
        case profile
        when :staging then CANONICAL_STAGING_ISSUER
        when :production then CANONICAL_PRODUCTION_ISSUER
        end
      end

      def canonical_host
        case profile
        when :staging then CANONICAL_STAGING_HOST
        when :production then CANONICAL_PRODUCTION_HOST
        end
      end

      def allowed_hosts
        csv_values('MCP_REMOTE_ALLOWED_HOSTS')
      end

      def allowed_origins
        csv_values('MCP_REMOTE_ALLOWED_ORIGINS')
      end

      def host_allowed?(host)
        canonical_host.present? && host == canonical_host && allowed_hosts.include?(host)
      end

      def origin_allowed?(origin)
        origin.blank? || allowed_origins.include?(origin)
      end

      def enabled?
        ENV['MCP_CANARY_ENABLED'] == 'true'
      end

      def required?
        Rails.env.production? && ENV['MCP_REMOTE_PRODUCTION_ENABLED'] == 'true' &&
          ENV['MCP_REMOTE_TRANSPORT_ENABLED'] == 'true'
      end

      def enforced?
        enabled? || required?
      end

      def phase
        ENV.fetch('MCP_CANARY_PHASE', 'disabled').to_s
      end

      def phase_valid?
        VALID_PHASES.include?(phase)
      end

      def discovery_enabled?
        configured? && VALID_PHASES.include?(phase)
      end

      def execution_enabled?
        configured? && phase == READ_ONLY_PHASE && ENV['MCP_PUBLIC_TOOLS_EXECUTION_ENABLED'] == 'true'
      end

      def resource_exact?
        canonical_resource.present? && ENV['MCP_OAUTH_RESOURCE'] == canonical_resource
      end

      def issuer_exact?
        canonical_issuer.present? && ENV['MCP_OAUTH_ISSUER'] == canonical_issuer
      end

      def opaque_tokens?
        ENV.fetch('MCP_OAUTH_TOKEN_FORMAT', 'opaque') == 'opaque'
      end

      def allowlisted_client_ids
        csv_values('MCP_CANARY_ALLOWED_CLIENT_IDS')
      end

      def allowlisted_subjects
        csv_values('MCP_CANARY_ALLOWED_SUBJECTS')
      end

      def allowlists_configured?
        allowlisted_client_ids.any? && allowlisted_subjects.any?
      end

      def client_allowed?(client_id)
        client_id.is_a?(String) && allowlisted_client_ids.include?(client_id)
      end

      def subject_allowed?(subject)
        subject.is_a?(String) && allowlisted_subjects.include?(subject)
      end

      def configured?
        return false if profile == :invalid

        enabled? && phase_valid? && canonical_binding? && runtime_gates? && allowlists_configured?
      end

      def canonical_binding?
        resource_exact? && issuer_exact? && opaque_tokens?
      end

      def runtime_gates?
        production_approved? && ENV['MCP_REMOTE_TRANSPORT_ENABLED'] == 'true' &&
          ENV['MCP_REMOTE_AUTH_MODE'] == 'oauth' && ENV['MCP_REMOTE_OAUTH_ENABLED'] == 'true' &&
          ENV['MCP_REMOTE_POLICY_ENABLED'] == 'true'
      end

      def production_approved?
        if profile == :staging
          staging_mode?
        else
          !Rails.env.production? || ENV['MCP_REMOTE_PRODUCTION_ENABLED'] == 'true'
        end
      end

      def csv_values(key)
        ENV[key].to_s.split(',').map(&:strip).reject(&:empty?).uniq
      end
      private_class_method :csv_values
    end
  end
end
