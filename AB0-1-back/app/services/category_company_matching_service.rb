class CategoryCompanyMatchingService
  VERSION = 'matching_v1'
  WEIGHTS = {
    regional_coverage: 25,
    solution_support: 25,
    project_experience: 15,
    verification: 10,
    rating_quality: 10,
    review_confidence: 5,
    service_match: 5,
    response_time: 5
  }.freeze

  Result = Struct.new(:company, :score, :score_band, :reason_codes, :reason_labels, :sponsored, keyword_init: true)

  def initialize(category:, context: {})
    @category = category
    @context = context.to_h.symbolize_keys
  end

  def call
    companies = @category.companies.where(status: 'active').includes(:company_category_capabilities)
    organic, sponsored = companies.partition { |company| !company.sponsored }
    {
      query_id: SecureRandom.uuid,
      matches: organic.sort_by { |company| -score_for(company) }.map { |company| result_for(company, false) },
      sponsored: sponsored.sort_by { |company| -sponsored_priority(company) }.map { |company| result_for(company, true) },
      meta: { version: VERSION, total: companies.size }
    }
  end

  private

  def result_for(company, sponsored)
    score = score_for(company)
    Result.new(
      company: company,
      score: score,
      score_band: score_band(score),
      reason_codes: reasons_for(company),
      reason_labels: reason_labels(reasons_for(company)),
      sponsored: sponsored
    )
  end

  def score_for(company)
    WEIGHTS.sum { |criterion, weight| criterion_value(company, criterion) ? weight : 0 }
  end

  def criterion_value(company, criterion)
    case criterion
    when :regional_coverage then location_match?(company)
    when :solution_support then solution_capability?(company)
    when :project_experience then project_experience?(company)
    when :verification then company.verified?
    when :rating_quality then company.rating_avg.to_f >= 4.0 && company.rating_count.to_i.positive?
    when :review_confidence then company.rating_count.to_i >= 10
    when :service_match then service_match?(company)
    when :response_time then company.respond_to?(:response_time_sla) && company.response_time_sla.present?
    end
  end

  def location_match?(company)
    state = @context.dig(:location, :state).to_s.upcase
    city = @context.dig(:location, :city).to_s.downcase
    return false if state.blank? && city.blank?

    company.state.to_s.upcase == state || Array(company.coverage_states).map(&:to_s).map(&:upcase).include?(state) || company.city.to_s.downcase == city
  end

  def solution_capability?(company)
    slug = @context[:solution_type].to_s
    return false if slug.blank?

    company.company_category_capabilities.any? do |capability|
      capability.category_solution_type&.slug == slug && capability.verified != false
    end
  end

  def project_experience?(company)
    Array(company.project_types).any? { |type| type.to_s.downcase == @context[:application].to_s.downcase }
  end

  def service_match?(company)
    requested = Array(@context[:services]).map(&:to_s)
    requested.empty? || requested.any? { |service| Array(company.services_offered).map(&:to_s).include?(service) }
  end

  def reasons_for(company)
    WEIGHTS.keys.select { |criterion| criterion_value(company, criterion) }.map { |criterion| criterion.to_s.upcase }
  end

  def reason_labels(codes)
    codes.map { |code| code.downcase.tr('_', ' ').capitalize }
  end

  def score_band(score)
    return 'alta' if score >= 75
    return 'media' if score >= 45

    'inicial'
  end

  def sponsored_priority(company)
    company.respond_to?(:priority_score) ? company.priority_score.to_f : 0
  end
end
