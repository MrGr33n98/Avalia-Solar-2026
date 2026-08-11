module Api
  module V1
    class WidgetDataController < BaseController
      # Public endpoint consumed by widget embeds.
      # Routes can send either :id (member route) or :company_id.
      def show
        company = Company.find_by(id: params[:company_id] || params[:id])
        return render json: { error: 'Company not found' }, status: :not_found unless company

        # Use stored trust score (unified calculation) with fallback to inline calculation
        trust_score = TrustScore::CalculationService.fetch_stored(company.id)
        trust_score = TrustScore::CalculationService.calculate_inline(company) if trust_score.zero?

        render json: {
          id: company.id,
          slug: company.slug,
          name: company.name,
          verified: company.verified?,
          trust_score: trust_score,
          rating_avg: company.reviews_count.to_i.positive? ? company.rating_avg : nil,
          reviews_count: company.reviews_count.to_i,
          verified_badge_image_url: company.verified_badge&.attached? ? url_for(company.verified_badge) : nil,
          public_profile_url: public_profile_url_for(company)
        }, status: :ok
      end

      private

      def public_profile_url_for(company)
        base = ENV.fetch('NEXT_PUBLIC_SITE_URL', 'https://www.avaliasolar.com.br').to_s.sub(%r{/*\z}, '')
        "#{base}/companies/#{company.slug || company.id}"
      end
    end
  end
end
