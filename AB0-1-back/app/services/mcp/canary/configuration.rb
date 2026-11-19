# frozen_string_literal: true

module Mcp
  module Canary
    # Configuration for the opt-in production canary. Empty allowlists and an
    # invalid phase intentionally make the guard unavailable (fail closed).
    module Configuration
      CANONICAL_RESOURCE = 'https://api.avaliasolar.com.br/mcp'
      CANONICAL_ISSUER = 'https://api.avaliasolar.com.br'
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

      def enabled?
        ENV['MCP_CANARY_ENABLED'] == 'true'
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
        ENV['MCP_OAUTH_RESOURCE'] == CANONICAL_RESOURCE
      end

      def issuer_exact?
        ENV['MCP_OAUTH_ISSUER'] == CANONICAL_ISSUER
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
        !Rails.env.production? || ENV['MCP_REMOTE_PRODUCTION_ENABLED'] == 'true'
      end

      def csv_values(key)
        ENV[key].to_s.split(',').map(&:strip).reject(&:empty?).uniq
      end
      private_class_method :csv_values
    end
  end
end
