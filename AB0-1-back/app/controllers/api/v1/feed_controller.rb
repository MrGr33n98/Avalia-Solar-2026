# frozen_string_literal: true

module Api
  module V1
    class FeedController < BaseController
      skip_before_action :authenticate_user!, only: [:index], raise: false

      def index
        authorize :feed, :index?

        result = Feed::Query.new(
          user: current_user,
          view: params[:view] || 'for_you',
          cursor: params[:cursor],
          limit: params[:limit]
        ).call

        serialized_data = Feed::Serializer.new(result[:items], current_user: current_user).serialize

        render json: {
          data: serialized_data,
          meta: {
            next_cursor: result[:next_cursor],
            has_more: result[:has_more]
          }
        }
      end
    end
  end
end
