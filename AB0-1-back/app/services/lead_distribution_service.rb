class LeadDistributionService
  def initialize(lead, preferred_company_id: nil)
    @lead = lead
    @preferred_company_id = preferred_company_id
  end

  def call
    companies = select_companies
    persist!(companies)
    companies
  end

  private

  attr_reader :lead, :preferred_company_id

  def select_companies
    selected = []
    preferred = preferred_company

    selected = add_candidates(
      selected,
      require_verified: true,
      require_state: true,
      require_city: true,
      preferred: preferred
    )

    selected = add_candidates(
      selected,
      require_verified: false,
      require_state: true,
      require_city: true,
      preferred: preferred
    )

    if lead.city.present?
      selected = add_candidates(
        selected,
        require_verified: false,
        require_state: true,
        require_city: false,
        preferred: preferred
      )
    end

    if lead.state.present?
      selected = add_candidates(
        selected,
        require_verified: false,
        require_state: false,
        require_city: false,
        preferred: preferred
      )
    end

    selected.first(3)
  end

  def add_candidates(selected, require_verified:, require_state:, require_city:, preferred:)
    return selected if selected.size >= 3

    candidates = filter_companies(
      require_verified: require_verified,
      require_state: require_state,
      require_city: require_city
    )

    candidates = prioritize_preferred(candidates, preferred, require_state: require_state, require_city: require_city)

    candidates.each do |company|
      next if selected.include?(company)

      selected << company
      break if selected.size >= 3
    end

    selected
  end

  def preferred_company
    return nil if preferred_company_id.blank?

    Company.find_by(id: preferred_company_id, status: 'active')
  end

  def filter_companies(require_verified:, require_state:, require_city:)
    scope = Company.where(status: 'active', active_admin: true)
    scope = scope.where(verified: true) if require_verified

    scope
      .to_a
      .select { |company| matches_location?(company, require_state: require_state, require_city: require_city) }
      .sort_by { |company| sort_key(company) }
  end

  def prioritize_preferred(candidates, preferred, require_state:, require_city:)
    return candidates if preferred.blank?
    return candidates unless matches_location?(preferred, require_state: require_state, require_city: require_city)

    ([preferred] + candidates.reject { |company| company.id == preferred.id })
  end

  def matches_location?(company, require_state:, require_city:)
    state = lead.state.to_s.strip.upcase
    city = lead.city.to_s.strip.downcase

    return false if require_state && state.present? && !state_match?(company, state)

    return false if require_city && city.present? && !city_match?(company, city)

    true
  end

  def state_match?(company, state)
    return true if company.state.to_s.strip.upcase == state

    parse_list(company.coverage_states, upcase: true).include?(state)
  end

  def city_match?(company, city)
    return true if company.city.to_s.strip.downcase == city

    parse_list(company.coverage_cities, downcase: true).include?(city)
  end

  def parse_list(raw, upcase: false, downcase: false)
    return [] if raw.blank?

    normalized = raw.to_s.strip
    items =
      if normalized.start_with?('[')
        JSON.parse(normalized)
      else
        normalized.split(/[;,|]/)
      end

    items = Array(items).map { |value| value.to_s.strip }.reject(&:blank?)
    items = items.map(&:upcase) if upcase
    items = items.map(&:downcase) if downcase
    items
  rescue JSON::ParserError
    normalized.split(/[;,|]/).map { |value| value.to_s.strip }.reject(&:blank?)
  end

  def sort_key(company)
    [
      company.sponsored? ? 0 : 1,
      -company.priority_score.to_i,
      company.featured? ? 0 : 1,
      -company.rating_avg.to_f,
      -company.reviews_count.to_i,
      -company.rating_count.to_i
    ]
  end

  def plan_active?(company)
    return false unless company.respond_to?(:plan_status)

    company.plan_status.to_s == 'active'
  end

  def persist!(companies)
    LeadDistribution.transaction do
      lead.lead_distributions.destroy_all
      companies.each do |company|
        lead.lead_distributions.create!(
          company: company,
          status: 'queued',
          assigned_at: Time.current
        )
      end
    end
  end
end
