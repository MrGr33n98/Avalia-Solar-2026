module Api
  module V1
    class WidgetDataController < ApplicationController
      skip_before_action :authenticate_request!, only: [:show]

      # GET /api/v1/widget_data/:company_id
      def show
        company = Company.find_by(id: params[:company_id])
        
        if company.nil?
          render json: { error: 'Company not found' }, status: :not_found
          return
        end

        widget_data = {
          id: company.id,
          name: company.name,
          verified: company.verified?,
          trust_score: calculate_trust_score(company),
          rating_avg: company.rating_avg || 0,
          reviews_count: company.reviews_count || 0,
          verified_badge_image_url: company.verified_badge&.attached? ? url_for(company.verified_badge) : nil,
          public_profile_url: company_url(company, host: ENV['NEXT_PUBLIC_API_BASE_URL'])
        }

        render json: widget_data, status: :ok
      end

      private

      def calculate_trust_score(company)
        # Fórmula simples: baseada em verificação, reviews e rating
        base_score = 50
        base_score += 20 if company.verified?
        base_score += (company.rating_avg.to_f / 5) * 20 if company.rating_avg.present?
        base_score += [company.reviews_count.to_f / 100 * 10, 10].min if company.reviews_count.present?
        
        [base_score.round, 100].min
      end
    end
  end
end
