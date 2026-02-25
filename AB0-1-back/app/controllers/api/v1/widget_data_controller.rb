module Api
  module V1
    class WidgetDataController < BaseController
      # Public endpoint consumed by widget embeds.
      # Routes can send either :id (member route) or :company_id.
      def show
        company = Company.find_by(id: params[:company_id] || params[:id])
        return render json: { error: 'Company not found' }, status: :not_found unless company

        render json: {
          id: company.id,
          slug: company.slug,
          name: company.name,
          verified: company.verified?,
          trust_score: calculate_trust_score(company),
          rating_avg: company.rating_avg || 0,
          reviews_count: company.reviews_count || 0,
          verified_badge_image_url: company.verified_badge&.attached? ? url_for(company.verified_badge) : nil,
          public_profile_url: public_profile_url_for(company)
        }, status: :ok
      end

      private

      def calculate_trust_score(company)
        base_score = 50
        base_score += 20 if company.verified?
        base_score += (company.rating_avg.to_f / 5) * 20 if company.rating_avg.present?
        base_score += [company.reviews_count.to_f / 100 * 10, 10].min if company.reviews_count.present?
        [base_score.round, 100].min
      end

      def public_profile_url_for(company)
        base = ENV.fetch('NEXT_PUBLIC_SITE_URL', 'https://www.avaliasolar.com.br').to_s.sub(%r{/*\z}, '')
        "#{base}/companies/#{company.slug || company.id}"
      end
    end
  end
end
