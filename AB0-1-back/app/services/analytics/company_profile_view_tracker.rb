# frozen_string_literal: true

module Analytics
  # Registra visualizações únicas do perfil público de uma empresa.
  #
  # Regras de exclusão:
  #   - Bots e crawlers (User-Agent)
  #   - Owner / collaborator da própria empresa logado
  #   - Fingerprint duplicado nas últimas 24h (índice único parcial no banco)
  #   - Chamada não deve quebrar o caller em nenhuma circunstância
  #
  # Uso:
  #   Analytics::CompanyProfileViewTracker.track(
  #     company_id:   company.id,
  #     request:      request,
  #     current_user: current_user   # opcional
  #   )
  class CompanyProfileViewTracker
    CACHE_KEY_PREFIX = 'company_profile_views'.freeze
    CACHE_TTL        = 5.minutes

    Result = Struct.new(:tracked, :reason, keyword_init: true)

    # @param company_id  [Integer]
    # @param request     [ActionDispatch::Request]
    # @param current_user [User, nil]
    def self.track(company_id:, request:, current_user: nil)
      new(company_id: company_id, request: request, current_user: current_user).track
    rescue StandardError => e
      Rails.logger.error("[CompanyProfileViewTracker] Unexpected error: #{e.class} — #{e.message}")
      Result.new(tracked: false, reason: 'unexpected_error')
    end

    def initialize(company_id:, request:, current_user: nil)
      @company_id   = company_id
      @request      = request
      @current_user = current_user
    end

    def track
      return skip('bot_user_agent')        if bot?
      return skip('owner_or_collaborator') if company_member?

      ip_hash          = CompanyProfileView.hash_value(client_ip)
      user_agent_hash  = CompanyProfileView.hash_value(user_agent)
      fingerprint      = build_fingerprint(ip_hash, user_agent_hash)

      insert_view(ip_hash, user_agent_hash, fingerprint)
    end

    private

    attr_reader :company_id, :request, :current_user

    # ── Filtros ──────────────────────────────────────────────────────────────

    def bot?
      CompanyProfileView.bot_user_agent?(user_agent)
    end

    def company_member?
      return false if current_user.nil?

      # Verifica se o usuário é owner ou collaborator desta empresa
      current_user.company_members
                  .where(company_id: company_id, role: %w[owner admin collaborator])
                  .exists?
    rescue StandardError
      false
    end

    # ── Inserção ─────────────────────────────────────────────────────────────

    def insert_view(ip_hash, user_agent_hash, fingerprint)
      CompanyProfileView.insert(
        {
          company_id:          company_id,
          session_fingerprint: fingerprint,
          ip_hash:             ip_hash,
          user_agent_hash:     user_agent_hash,
          viewed_at:           Time.current,
          created_at:          Time.current,
          updated_at:          Time.current
        },
        unique_by: :idx_unique_view_per_fingerprint_24h,
        returning: false
      )

      invalidate_cache
      fire_posthog_event(fingerprint)

      Result.new(tracked: true, reason: 'ok')
    rescue ActiveRecord::RecordNotUnique
      Result.new(tracked: false, reason: 'duplicate_fingerprint_24h')
    rescue StandardError => e
      Rails.logger.warn("[CompanyProfileViewTracker] Insert failed: #{e.message}")
      Result.new(tracked: false, reason: 'insert_error')
    end

    # ── Cache ─────────────────────────────────────────────────────────────────

    def invalidate_cache
      Rails.cache.delete("#{CACHE_KEY_PREFIX}:#{company_id}")
    end

    # ── PostHog ──────────────────────────────────────────────────────────────

    def fire_posthog_event(fingerprint)
      company = Company.find_by(id: company_id)
      return unless company

      Analytics::PostHogService.capture(
        'company_profile_view',
        {
          company_id:   company_id,
          company_name: company.name,
          source:       'company_profile_page',
          device:       detect_device,
          location:     [company.city, company.state].compact.join(', '),
          user_type:    current_user ? 'logged' : 'anonymous',
          referrer:     request.referer
        },
        distinct_id: "anon_#{fingerprint}"
      )
    rescue StandardError => e
      Rails.logger.warn("[CompanyProfileViewTracker] PostHog error: #{e.message}")
    end

    # ── Helpers ───────────────────────────────────────────────────────────────

    def skip(reason)
      Result.new(tracked: false, reason: reason)
    end

    def client_ip
      request.remote_ip
    end

    def user_agent
      request.user_agent.to_s
    end

    def build_fingerprint(ip_hash, user_agent_hash)
      raw = "#{ip_hash}-#{user_agent_hash}-#{company_id}"
      CompanyProfileView.hash_value(raw)
    end

    def detect_device
      ua = user_agent.downcase
      return 'mobile'  if ua.match?(/mobile|android|iphone/)
      return 'tablet'  if ua.match?(/tablet|ipad/)

      'desktop'
    end
  end
end
