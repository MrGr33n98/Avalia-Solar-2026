module Leads
  class LeadMatchingService
    MAX_DISTRIBUTIONS = [Integer(ENV.fetch('LEAD_MAX_DISTRIBUTIONS', '3'), exception: false).to_i, 1].max

    def self.call(lead, preferred_company_id: nil)
      new(lead, preferred_company_id: preferred_company_id).call
    end

    def initialize(lead, preferred_company_id: nil)
      @lead = lead
      @preferred_company_id = preferred_company_id
    end

    def call
      candidates = eligible_companies
      scored = candidates.map { |company| [company, score(company)] }
      scored.sort_by { |company, match_score| [-match_score, -company.rating_avg.to_f, company.id] }.first(MAX_DISTRIBUTIONS).map do |company, match_score|
        { company: company, match_score: match_score, match_reasons: reasons(company) }
      end
    end

    private

    def eligible_companies
      scope = Company.where(status: 'active', active_admin: true)
      scope = scope.where.not(id: @lead.lead_distributions.select(:company_id)) if @lead.persisted?
      scope.includes(:categories, :company_category_capabilities, :company_service_areas, :plan).to_a.select do |company|
        category_eligible?(company) && location_eligible?(company) && lead_feature_enabled?(company)
      end
    end

    def category_eligible?(company)
      return true if @lead.category_id.blank?

      company.categories.any? { |category| category.id == @lead.category_id } ||
        company.company_category_capabilities.any? { |capability| capability.category_id == @lead.category_id }
    end

    def location_eligible?(company)
      return true if @lead.city.blank? && @lead.state.blank?
      return company.serves_city?(@lead.city, @lead.state) if @lead.city.present?

      company.serves_state?(@lead.state)
    end

    def lead_feature_enabled?(company)
      company.quote_feature_enabled?
    end

    def score(company)
      value = 0
      value += 40 if @preferred_company_id.to_i == company.id
      value += 25 if company.verified?
      value += 20 if @lead.city.present? && company.serves_city?(@lead.city, @lead.state)
      value += 10 if @lead.state.present? && company.serves_state?(@lead.state)
      value += [company.rating_avg.to_f * 2, 10].min
      value.to_i
    end

    def reasons(company)
      reasons = []
      reasons << 'preferred_company' if @preferred_company_id.to_i == company.id
      reasons << 'verified' if company.verified?
      reasons << 'city_coverage' if @lead.city.present? && company.serves_city?(@lead.city, @lead.state)
      reasons << 'state_coverage' if @lead.state.present? && company.serves_state?(@lead.state)
      reasons
    end
  end
end
