# frozen_string_literal: true

require 'openssl'

module Mcp
  # Atomic Redis-backed quotas for the external MCP endpoint.
  # Identity values never appear directly in Redis keys or logs.
  # Fail CLOSED when Redis is unavailable; do not fall back to per-process
  # memory counters that allow bypassing limits across application replicas.
  class RemoteQuotaPolicy
    SCRIPT = <<~LUA.freeze
      local v = redis.call('INCRBY', KEYS[1], tonumber(ARGV[1]))
      if v == tonumber(ARGV[1]) then
        redis.call('EXPIRE', KEYS[1], tonumber(ARGV[2]))
      end
      return v
    LUA

    # Conservative staging limits. Production policy requires load testing.
    LIMITS = {
      preview: { identity: 20, client: 20, ip: 60, day: 200 },
      oauth: { identity: 30, client: 60, ip: 120, day: 500 },
      private: { identity: 20, client: 40, ip: 80, day: 300, tenant: 100 }
    }.freeze
    MAX_ID_BYTES = 256

    class Failure < StandardError
      attr_reader :type, :retry_after

      def initialize(type, retry_after: nil)
        @type = type
        @retry_after = retry_after
        super(type.to_s)
      end
    end

    def initialize(identity:, client_id:, remote_ip:, mode:, tenant_id: nil)
      @identity = identity
      @client_id = client_id
      @remote_ip = remote_ip
      @mode = mode.to_sym
      @tenant_id = tenant_id
    end

    def enforce!
      raise Failure, :unavailable unless enabled?

      limits = LIMITS[@mode]
      raise Failure, :unavailable if limits.nil?
      raise Failure, :unavailable unless [@identity, @client_id, @remote_ip].all? do |v|
        v.is_a?(String) && v.present? && v.bytesize <= MAX_ID_BYTES
      end

      stamp = Time.current.utc.to_i
      minute = stamp / 60
      day = stamp / 86_400
      checks = [
        [:identity, @identity, minute, 120, 60],
        [:client, @client_id, minute, 120, 60],
        [:ip, @remote_ip, minute, 120, 60],
        [:day, @client_id, day, 90_000, 86_400]
      ]

      Sidekiq.redis do |redis|
        checks.each do |dimension, value, bucket, ttl, retry_after|
          key = "mcp:quota:v1:#{@mode}:#{dimension}:#{bucket}:#{digest(value)}"
          count = redis.call('EVAL', SCRIPT, 1, key, 1, ttl).to_i
          raise Failure.new(:unavailable) if count < 1
          raise Failure.new(:rate_limited, retry_after: retry_after) if count > limits.fetch(dimension)
        end
      end
      true
    rescue Failure
      raise
    rescue StandardError
      raise Failure, :unavailable
    end

    # Called only after CompanyMember + Pundit + entitlement have established
    # a canonical company_id. Never trust arbitrary tenant IDs from MCP args.
    # Separate counter avoids double-counting user/client/IP limits.
    def enforce_tenant!
      raise Failure, :unavailable unless @mode == :private && enabled?
      raise Failure, :unavailable unless @tenant_id.is_a?(String) &&
                                        @tenant_id.match?(/\A[1-9][0-9]{0,18}\z/)

      minute = Time.current.utc.to_i / 60
      key = "mcp:quota:v1:private:tenant:#{minute}:#{digest(@tenant_id)}"
      count = Sidekiq.redis { |redis| redis.call('EVAL', SCRIPT, 1, key, 1, 120).to_i }
      raise Failure, :unavailable if count < 1
      raise Failure.new(:rate_limited, retry_after: 60) if count > LIMITS.fetch(:private).fetch(:tenant)

      true
    rescue Failure
      raise
    rescue StandardError
      raise Failure, :unavailable
    end

    private

    def enabled?
      if @mode == :private
        ENV['MCP_PRIVATE_REMOTE_POLICY_ENABLED'] == 'true'
      else
        ENV['MCP_REMOTE_POLICY_ENABLED'] == 'true'
      end
    end

    def digest(value)
      OpenSSL::HMAC.hexdigest('SHA256', Rails.application.secret_key_base, value)
    end
  end
end
