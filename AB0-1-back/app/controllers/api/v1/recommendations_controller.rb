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

        results = Recommendation::Engine.call(context: context, limit: limit)

        payload = RecommendationSerializer.render(
          results: results,
          context: context,
          request_id: request_id
        )

        render json: payload
      end

      private

      def filter_params
        params.permit(:city, :state, :category_slug, :segment, :limit)
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
