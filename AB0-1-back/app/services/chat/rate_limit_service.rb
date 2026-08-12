# frozen_string_literal: true

module Chat
  class RateLimitService
    Result = Struct.new(:allowed, :code, :retry_after, keyword_init: true)

    def self.check(session:, ip:, user_id: nil)
      new(session: session, ip: ip, user_id: user_id).check
    end

    def initialize(session:, ip:, user_id: nil)
      @session, @ip, @user_id = session, (ip.presence || 'unknown'), user_id
    end

    def check
      return denied('SESSION_MESSAGE_LIMIT', 60) if @session.message_count.to_i >= env_int('CHAT_MAX_MESSAGES_PER_SESSION', 50)
      return denied('BURST_RATE_LIMITED', 10) if over_window?('burst', env_int('CHAT_RATE_LIMIT_BURST', 5), 10.seconds)
      return denied('RATE_LIMITED', 60) if over_window?('minute', env_int('CHAT_RATE_LIMIT_PER_MINUTE', 30), 1.minute)
      return denied('RATE_LIMITED', 3600) if over_window?('hour', env_int('CHAT_RATE_LIMIT_PER_HOUR', 300), 1.hour)
      return denied('SESSION_TOKEN_QUOTA', 3600) if over_session_tokens?
      return denied('USER_TOKEN_QUOTA', 86_400) if over_user_tokens?
      Result.new(allowed: true)
    end

    private

    def over_session_tokens?
      limit = ENV['CHAT_MAX_TOKENS_PER_SESSION'].to_i
      limit.positive? && @session.chat_messages.sum(:token_count).to_i >= limit
    end

    def over_user_tokens?
      limit = ENV['CHAT_MAX_TOKENS_PER_USER_DAY'].to_i
      return false unless @user_id.present? && limit.positive?
      used = ChatMessage.joins(:chat_session).where(chat_sessions: { user_id: @user_id })
        .where(created_at: Time.current.beginning_of_day..).sum(:token_count).to_i
      used >= limit
    end

    def over_window?(name, limit, ttl)
      key = "chat_rate:v2:#{name}:#{@ip}:#{@session.id}:#{Time.current.to_i / ttl.to_i}"
      Rails.cache.increment(key, 1, expires_in: ttl, raw: true).to_i > limit
    end

    def env_int(name, fallback)
      value = ENV[name].to_i
      value.positive? ? value : fallback
    end

    def denied(code, retry_after)
      Result.new(allowed: false, code: code, retry_after: retry_after)
    end
  end
end
