module Api
  module V1
    class TrustController < BaseController
      before_action :authenticate_api_key!

      # GET /api/v1/trust/profile
      def profile
        render json: {
          company: {
            name: @current_company.name,
            verified: @current_company.respond_to?(:verified?) ? @current_company.verified? : true,
            trust_score: @current_company.trust_score || 0,
            rating_avg: @current_company.respond_to?(:rating_avg) ? @current_company.rating_avg : 4.5,
            reviews_count: @current_company.respond_to?(:reviews_count) ? @current_company.reviews_count : 10,
            badges: [] # To be implemented
          },
          metrics: {
            response_time_sla: '2h',
            roi_accuracy_index: 0.98
          }
        }
      end

      # GET /api/v1/trust/widgets/config
      def widgets_config
        render json: {
          widget_type: 'badge',
          theme: 'light',
          position: 'bottom-right',
          api_key: params[:api_key],
          installer_id: @current_company.id
        }
      end

      private

      def authenticate_api_key!
        api_key = request.headers['X-Api-Key'] || params[:api_key]
        @current_company = Company.find_by(api_key: api_key)

        return if @current_company

        render json: { error: 'Unauthorized: Invalid API Key' }, status: :unauthorized
      end
    end
  end
end
