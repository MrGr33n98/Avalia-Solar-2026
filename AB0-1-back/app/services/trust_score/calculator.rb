# frozen_string_literal: true

module TrustScore
  class Calculator
    def initialize(company)
      @company = company
    end

    def call
      Definition.calculate(
        verified: @company.verified?,
        rating_avg: attribute(:rating_avg),
        reviews_count: attribute(:reviews_count),
        profile_views_count: attribute(:profile_views_count),
        cta_clicks_count: attribute(:cta_clicks_count),
        leads_count: attribute(:leads_count)
      )
    end

    private

    def attribute(name)
      @company.respond_to?(name) ? @company.public_send(name).to_f : 0.0
    end
  end
end
