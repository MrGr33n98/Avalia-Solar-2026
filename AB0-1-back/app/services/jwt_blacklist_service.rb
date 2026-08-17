# frozen_string_literal: true

# Service for managing JWT token revocation via Redis blacklist
# TASK: P0 - Implementar revogação de JWT via Redis (Logout real)
#
# Usage:
#   JwtBlacklistService.revoke_token(token)
#   JwtBlacklistService.revoked?(token)
#   JwtBlacklistService.revoke_all_user_tokens(user_id)
#
class JwtBlacklistService
  REDIS_PREFIX = 'jwt:blacklist:'
  USER_PREFIX = 'jwt:user:revoked:'

  class << self
    # Revoke a single JWT token
    # @param token [String] The JWT token to revoke
    # @param exp [Time, Integer] Optional expiration time
    # @return [Boolean] true if revoked successfully
    def revoke_token(token, exp: nil)
      return false unless redis_available?

      jti = extract_jti(token)
      return false unless jti

      ttl = calculate_ttl(token, exp)
      return false if ttl <= 0

      RedisHelper.with_redis do |redis|
        redis.setex("#{REDIS_PREFIX}#{jti}", ttl, '1')
      end

      Rails.logger.info("[JWT:Blacklist] Token revoked: jti=#{jti[0..8]}... ttl=#{ttl}s")
      true
    rescue StandardError => e
      Rails.logger.error("[JWT:Blacklist] Revoke error: #{e.message}")
      Sentry.capture_exception(e) if defined?(Sentry)
      false
    end

    # Check if a token has been revoked
    # @param token [String] The JWT token to check
    # @return [Boolean] true if token is revoked
    def revoked?(token)
      return false unless redis_available?

      jti = extract_jti(token)
      return false unless jti

      result = RedisHelper.with_redis do |redis|
        redis.exists?("#{REDIS_PREFIX}#{jti}") == 1
      end

      result || false
    rescue StandardError => e
      Rails.logger.error("[JWT:Blacklist] Check revoked error: #{e.message}")
      false
    end

    # Atomically consume a token during refresh rotation.
    # Only the first concurrent request may claim the refresh token.
    # @param token [String] The refresh token to consume
    # @return [Boolean] true when this request claimed the token
    def claim_token(token)
      return false unless redis_available?

      jti = extract_jti(token)
      return false unless jti

      ttl = calculate_ttl(token)
      return false if ttl <= 0

      result = RedisHelper.with_redis do |redis|
        redis.set("#{REDIS_PREFIX}#{jti}", '1', nx: true, ex: ttl)
      end

      result == 'OK'
    rescue StandardError => e
      Rails.logger.error("[JWT:Blacklist] Claim error: #{e.message}")
      Sentry.capture_exception(e) if defined?(Sentry)
      false
    end

    # Revoke all tokens for a user
    # @param user_id [Integer] The user ID
    # @return [Boolean] true if revoked successfully
    def revoke_all_user_tokens(user_id)
      return false unless redis_available?

      timestamp = Time.current.to_i

      RedisHelper.with_redis do |redis|
        redis.setex("#{USER_PREFIX}#{user_id}", 30.days.to_i, timestamp.to_s)
      end

      Rails.logger.info("[JWT:Blacklist] All tokens revoked for user_id=#{user_id} at=#{timestamp}")
      true
    rescue StandardError => e
      Rails.logger.error("[JWT:Blacklist] Revoke all error: #{e.message}")
      Sentry.capture_exception(e) if defined?(Sentry)
      false
    end

    # Get the timestamp when all user tokens were revoked
    # @param user_id [Integer] The user ID
    # @return [Time, nil] The revocation timestamp or nil
    def user_tokens_revoked_at(user_id)
      return nil unless redis_available?

      RedisHelper.with_redis do |redis|
        timestamp_str = redis.get("#{USER_PREFIX}#{user_id}")
        timestamp_str ? Time.at(timestamp_str.to_i) : nil
      end
    rescue StandardError => e
      Rails.logger.error("[JWT:Blacklist] Get revoked_at error: #{e.message}")
      nil
    end

    # Get statistics about blacklisted tokens
    # @return [Hash] Statistics hash
    def stats
      return { available: false } unless redis_available?

      RedisHelper.with_redis do |redis|
        token_keys = redis.keys("#{REDIS_PREFIX}*")
        user_keys = redis.keys("#{USER_PREFIX}*")

        {
          available: true,
          blacklisted_tokens: token_keys.size,
          users_with_revoked_tokens: user_keys.size,
          total_keys: token_keys.size + user_keys.size
        }
      end
    rescue StandardError => e
      Rails.logger.error("[JWT:Blacklist] Stats error: #{e.message}")
      { available: false, error: e.message }
    end

    private

    # Check if Redis is available
    # @return [Boolean]
    def redis_available?
      defined?(REDIS) && REDIS && !REDIS.is_a?(NullRedis)
    end

    # Extract JTI (JWT ID) from token
    # If JTI is not present, generate a deterministic one from token hash
    # @param token [String] The JWT token
    # @return [String, nil] The JTI or nil if token is invalid
    def extract_jti(token)
      payload = JWT.decode(token, Rails.application.secret_key_base, true, algorithm: 'HS256').first
      payload['jti'] || payload[:jti] || generate_jti_from_token(token)
    rescue JWT::DecodeError => e
      # Fallback to insecure decode if signature fails (just to extract JTI for blacklist check)
      begin
        payload = JWT.decode(token, nil, false).first
        payload['jti'] || payload[:jti] || generate_jti_from_token(token)
      rescue StandardError
        Rails.logger.warn("[JWT:Blacklist] Invalid token format: #{e.message}")
        nil
      end
    end

    # Generate a deterministic JTI from token hash
    # @param token [String] The JWT token
    # @return [String] A deterministic identifier
    def generate_jti_from_token(token)
      Digest::SHA256.hexdigest(token)[0..15]
    end

    # Calculate TTL (Time To Live) for blacklist entry
    # @param token [String] The JWT token
    # @param exp [Time, Integer, nil] Optional expiration time
    # @return [Integer] TTL in seconds
    def calculate_ttl(token, exp = nil)
      if exp
        exp_time = exp.is_a?(Time) ? exp.to_i : exp.to_i
        return [exp_time - Time.current.to_i, 0].max
      end

      begin
        payload = JWT.decode(token, Rails.application.secret_key_base, true, algorithm: 'HS256').first
      rescue JWT::DecodeError
        payload = JWT.decode(token, nil, false).first
      end

      exp_claim = payload['exp'] || payload[:exp]

      if exp_claim
        [exp_claim.to_i - Time.current.to_i, 0].max
      else
        # Default to 24 hours if no expiration found
        24.hours.to_i
      end
    rescue StandardError
      # If we can't decode at all, use default TTL
      24.hours.to_i
    end
  end
end
