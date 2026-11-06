# frozen_string_literal: true

module Api
  module V1
    class RecommendationsController < BaseController
      skip_before_action :authenticate_user!, raise: false
      skip_before_action :authenticate_api_user, raise: false

      def index
        permitted_params = filter_params
        limit = parse_limit(permitted_params[:limit])
        request_id = request.request_id.presence || SecureRandom.uuid

        context = Recommendation::ContextBuilder.call(
          request: request,
          params: permitted_params,
          current_user: current_user_or_nil
        )


        # Never cache a payload containing plan-dependent CTAs. Cached recommendation
        # IDs may be added separately once hydrated from fresh Company records.
        # Request context can also depend on cookies, authentication and edge geo.
        response.headers['Cache-Control'] = 'private, no-store, max-age=0'
        results = Recommendation::Engine.call(context: context, limit: limit)
        render json: RecommendationSerializer.render(
          results: results,
          context: context,
          request_id: request_id
        )
      end

      private

      def filter_params
        params.permit(
          :city,
          :state,
          :category_slug,
          :category_id,
          :segment,
          :limit,
          :exclude_company_id,
          :context_company_id
        )
      end

      def parse_limit(val)
        parsed = val.to_i
        parsed > 0 ? parsed.clamp(1, 20) : 8
      end

      def current_user_or_nil
        current_user rescue nil
      end
    end
  end
end
