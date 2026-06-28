# frozen_string_literal: true

module Chat
  # Recommends companies to a chat lead based on location (city/state/coverage),
  # segment, category, ratings and plan tier.
  #
  # Location priority (scores defined in SCORE_* constants):
  #   1. Exact city match (company.city == lead_city)              → +40
  #   2. Coverage city match (coverage_cities contains lead_city)  → +35
  #   3. Exact state match (company.state == lead_state)           → +20
  #   4. Coverage state match (coverage_states contains lead_state)→ +15
  #
  # Segment priority for solar vertical:
  #   - Prefer segment = 'installer'; fill up to MAX_RESULTS with other segments.
  #
  class CompanyRecommendationService
    MAX_RESULTS       = 5
    INSTALLER_MIN     = 3 # minimum installers before we pad with other segments

    SCORE_CITY_EXACT    = 40
    SCORE_CITY_COVERAGE = 35
    SCORE_STATE_EXACT   = 20
    SCORE_STATE_COVERAGE = 15
    SCORE_VERIFIED      = 15
    SCORE_RATING_HIGH   = 15   # avg >= 4.5
    SCORE_RATING_MED    = 10   # avg >= 4.0
    SCORE_REVIEWS_HIGH  = 15   # count >= 50
    SCORE_REVIEWS_MED   = 10   # count >= 10
    SCORE_PAID_PLAN     = 10
    SCORE_HAS_FAQS      = 5
    SCORE_HAS_MEDIA     = 5
    SCORE_HAS_WHATSAPP  = 5

    attr_reader :vertical, :answers, :session_id

    def initialize(vertical:, answers:, session_id: nil)
      @vertical   = vertical
      @answers    = answers || {}
      @session_id = session_id
    end

    def call
      recommendations = fetch_companies
      sanitized       = sanitize_results(recommendations)

      {
        recommendations: sanitized,
        fallback_reason: determine_fallback_reason(recommendations),
        total: sanitized.size
      }
    end

    private

    # ─── Individual location-match predicates ─────────────────────────────────

    def city_matches?(company, city)
      Locations::CoverageNormalizer.city_slug(company.city) == Locations::CoverageNormalizer.city_slug(city)
    end

    def state_matches?(company, state)
      Locations::CoverageNormalizer.normalize_state(company.state) == state
    end

    def coverage_city_matches?(company, city)
      company.coverage_city_list.any? do |coverage_city|
        Locations::CoverageNormalizer.city_slug(coverage_city) == Locations::CoverageNormalizer.city_slug(city)
      end
    end

    def coverage_state_matches?(company, state)
      company.coverage_state_list.include?(state)
    end

    # True when any location criterion matches.
    def company_supports_location?(company, city, state)
      return true if city.present? && company.serves_city?(city, state)
      return true if state.present? && company.serves_state?(state)

      false
    end

    # Numeric score for location quality (higher = better match).
    def location_match_score(company, city, state)
      score = 0

      if city.present?
        if city_matches?(company, city)
          score += SCORE_CITY_EXACT
        elsif coverage_city_matches?(company, city)
          score += SCORE_CITY_COVERAGE
        end
      end

      if state.present?
        if state_matches?(company, state)
          score += SCORE_STATE_EXACT
        elsif coverage_state_matches?(company, state)
          score += SCORE_STATE_COVERAGE
        end
      end

      score
    end

    # ─── Lead location extraction ─────────────────────────────────────────────

    def lead_city
      raw_city = answers['city'] || answers['location_city'] || answers[:city] || answers[:location_city]
      @lead_city ||= Locations::CoverageNormalizer.normalize_city(raw_city, state: lead_state) || raw_city.to_s.strip
    end

    def lead_state
      @lead_state ||= Locations::CoverageNormalizer.normalize_state(
        answers['state'] || answers['location_state'] || answers[:state] || answers[:location_state]
      )
    end

    # ─── Main fetch ───────────────────────────────────────────────────────────

    def fetch_companies
      city  = lead_city
      state = lead_state

      # Build a broad DB scope: active, correct vertical/segment, filtering by
      # state (seat OR coverage) when possible to avoid a full-table scan.
      scope = base_scope

      # Apply a broad state-level pre-filter in SQL when we have a state.
      # Coverage text fields are free-form, so we do city-level refinement in Ruby.
      scope = apply_state_prefilter(scope, state) if state.present?

      candidates = scope.to_a

      # Ruby-level location filter
      if city.present? || state.present?
        candidates = candidates.select { |c| company_supports_location?(c, city, state) }
      end

      # Segment priority for solar
      candidates = prioritize_segment(candidates)

      # Score and sort
      candidates
        .map { |c| [c, calculate_score(c, city, state)] }
        .sort_by { |_, score| -score }
        .first(MAX_RESULTS)
        .map(&:first)
    end

    def base_scope
      scope = Company.active.includes(:categories, :company_faqs)

      if vertical == 'solar'
        # For solar, consider all segments; segment priority is handled in Ruby.
      else
        # For mobility and others, keep filtering by category/segment as before.
      end
      scope
    end

    # Broad SQL pre-filter: company has seat in state OR coverage_states mentions it.
    # Uses ILIKE for case-insensitive match on the coverage text.
    def apply_state_prefilter(scope, state)
      scope.serving_state(state)
    end

    # Prioritize installers for solar; pad with others if not enough.
    def prioritize_segment(candidates)
      return candidates unless vertical == 'solar'

      installers = candidates.select { |c| c.segment == 'installer' }
      others     = candidates.reject { |c| c.segment == 'installer' }

      if installers.size >= INSTALLER_MIN
        installers
      else
        (installers + others).uniq
      end
    end

    # ─── Scoring ──────────────────────────────────────────────────────────────

    def calculate_score(company, city, state)
      score = 0

      # Location
      score += location_match_score(company, city, state)

      # Verification
      score += SCORE_VERIFIED if company.verified?

      # Rating (uses real column rating_avg)
      avg = company.rating_avg.to_f
      score += if avg >= 4.5
                 SCORE_RATING_HIGH
               elsif avg >= 4.0
                 SCORE_RATING_MED
               else
                 0
               end

      # Reviews volume (uses real column reviews_count)
      count = company.reviews_count.to_i
      score += if count >= 50
                 SCORE_REVIEWS_HIGH
               elsif count >= 10
                 SCORE_REVIEWS_MED
               else
                 0
               end

      # Plan quality (uses real model method has_paid_plan?)
      score += SCORE_PAID_PLAN if safe_has_paid_plan?(company)

      # Profile richness
      score += SCORE_HAS_FAQS if company.company_faqs.loaded? ? company.company_faqs.any? : company.company_faqs.exists?
      score += SCORE_HAS_MEDIA     if company.media_assets.attached?
      score += SCORE_HAS_WHATSAPP  if company.whatsapp.present?

      # Segment bonus for installer (core segment for solar)
      score += 5 if company.segment == 'installer'

      score
    end

    # Safely call has_paid_plan? — it exists in the model but rescue just in case.
    def safe_has_paid_plan?(company)
      company.has_paid_plan?
    rescue StandardError
      false
    end

    # ─── Serialisation ────────────────────────────────────────────────────────

    def sanitize_results(companies)
      companies.map do |company|
        {
          id: company.id,
          slug: company.slug,
          name: company.name,
          logo_url: company.logo_url,
          city: company.city,
          state: company.state,
          categories: company.categories.map(&:name),
          vertical: vertical,
          segment: company.segment,
          average_rating: company.rating_avg.to_f,
          reviews_count: company.reviews_count.to_i,
          verified: company.verified?,
          paid_plan: safe_has_paid_plan?(company),
          plan_tier: safe_plan_tier(company),
          profile_url: "/empresas/#{company.slug}",
          whatsapp_url: whatsapp_url_for(company),
          quote_enabled: true,
          comparison_enabled: true,
          short_reason: generate_recommendation_reason(company)
        }
      end
    end

    def safe_plan_tier(company)
      company.inferred_plan_tier
    rescue StandardError
      'free'
    end

    def whatsapp_url_for(company)
      return nil if company.whatsapp.blank?

      digits = company.whatsapp.to_s.gsub(/\D/, '')
      digits.present? ? "https://wa.me/55#{digits}" : nil
    end

    def generate_recommendation_reason(company)
      reasons = []

      city  = lead_city
      state = lead_state

      if city.present? && city_matches?(company, city)
        reasons << 'Atendimento na sua cidade'
      elsif city.present? && coverage_city_matches?(company, city)
        reasons << 'Cobre sua cidade'
      elsif state.present? && (state_matches?(company, state) || coverage_state_matches?(company, state))
        reasons << 'Atua no seu estado'
      end

      reasons << 'Empresa verificada'               if company.verified?
      reasons << 'Excelente avaliação'              if company.rating_avg.to_f >= 4.5
      reasons << 'Boa avaliação'                    if company.rating_avg.to_f >= 4.0 && company.rating_avg.to_f < 4.5
      reasons << 'Destaque regional'                if safe_has_paid_plan?(company)

      reasons.any? ? reasons.join(' · ') : 'Compatível com sua busca'
    end

    # ─── Fallback ─────────────────────────────────────────────────────────────

    def determine_fallback_reason(companies)
      return nil if companies.any?

      city  = answers['city']  || answers['location_city']
      state = answers['state'] || answers['location_state']

      if city.present?
        "Não encontrei empresas exatamente em #{city}, mas busquei opções no estado."
      elsif state.present?
        "Ainda não temos empresas cadastradas para esta busca em #{state}."
      else
        'Para buscar empresas mais compatíveis, preciso saber sua cidade e o tipo de serviço.'
      end
    end
  end
end
