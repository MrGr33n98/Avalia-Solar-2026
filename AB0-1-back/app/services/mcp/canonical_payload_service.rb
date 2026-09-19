# frozen_string_literal: true

require 'digest'
require 'json'

module Mcp
  class CanonicalPayloadService
    VERSION = 1

    class << self
      # Computa o payload canônico e seu digest SHA-256
      def generate_digest(agent_id:, tool_name:, risk_tier:, arguments: {}, requester_user_id: nil, tenant_id: nil)
        canonical_struct = build_canonical_payload(
          agent_id: agent_id,
          tool_name: tool_name,
          risk_tier: risk_tier,
          arguments: arguments,
          requester_user_id: requester_user_id,
          tenant_id: tenant_id
        )

        canonical_str = to_canonical_json(canonical_struct)
        Digest::SHA256.hexdigest(canonical_str)
      end

      # Constrói o hash canônico normalizado
      def build_canonical_payload(agent_id:, tool_name:, risk_tier:, arguments: {}, requester_user_id: nil, tenant_id: nil)
        {
          'agent_id' => agent_id.to_s,
          'arguments' => canonicalize_value(arguments || {}),
          'requester_user_id' => requester_user_id.present? ? requester_user_id.to_i : nil,
          'risk_tier' => risk_tier.to_s.downcase,
          'tenant_id' => tenant_id.present? ? tenant_id.to_i : nil,
          'tool_name' => tool_name.to_s,
          'version' => VERSION
        }
      end

      # Serializa deterministamente para JSON com chaves ordenadas
      def to_canonical_json(value)
        canonicalized = canonicalize_value(value)
        JSON.generate(canonicalized)
      end

      # Valida com comparação em tempo constante
      def secure_verify?(expected_digest:, agent_id:, tool_name:, risk_tier:, arguments: {}, requester_user_id: nil, tenant_id: nil)
        return false if expected_digest.blank?

        computed = generate_digest(
          agent_id: agent_id,
          tool_name: tool_name,
          risk_tier: risk_tier,
          arguments: arguments,
          requester_user_id: requester_user_id,
          tenant_id: tenant_id
        )

        ActiveSupport::SecurityUtils.secure_compare(computed, expected_digest)
      end

      # Normaliza recursivamente valores:
      # - Hashes: chaves convertidas para string e ordenadas lexicograficamente
      # - Arrays: ordem preservada, elementos recursivamente canonicalizados
      # - Tipos primitivos permitidos: String (UTF-8), Numeric, Boolean, Nil, Date/Time (ISO8601)
      # - Rejeita tipos não serializáveis / arbitrários com erro explícito
      def canonicalize_value(obj)
        case obj
        when Hash, ActionController::Parameters
          raw_hash = obj.respond_to?(:to_unsafe_h) ? obj.to_unsafe_h : (obj.respond_to?(:to_h) ? obj.to_h : obj)
          sorted_hash = {}
          raw_hash.keys.map(&:to_s).sort.each do |key|
            val = raw_hash.key?(key) ? raw_hash[key] : raw_hash[key.to_sym]
            sorted_hash[key] = canonicalize_value(val)
          end
          sorted_hash
        when Array, Set
          obj.map { |item| canonicalize_value(item) }
        when String
          obj.encode('UTF-8', invalid: :replace, undef: :replace, replace: '')
        when Symbol
          obj.to_s.encode('UTF-8')
        when Integer, Float, BigDecimal
          obj
        when TrueClass, FalseClass, NilClass
          obj
        when Time, DateTime, ActiveSupport::TimeWithZone, Date
          obj.iso8601
        else
          raise ::Mcp::Error.new(
            code: 'invalid_payload_type',
            message: "Tipo não serializável para canonicalização segura de payload: #{obj.class.name}",
            status: :bad_request
          )
        end
      end
    end
  end
end
