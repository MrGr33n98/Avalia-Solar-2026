# frozen_string_literal: true

module Api
  module V1
    class FeedController < BaseController
      skip_before_action :authenticate_user!, only: [:index], raise: false

      def index
        started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
        authorize :feed, :index?

        result = Feed::Query.new(
          user: current_user,
          view: params[:view] || 'for_you',
          content_type: params[:type],
          cursor: params[:cursor],
          limit: params[:limit]
        ).call

        serialized_data = Feed::Serializer.new(result[:items], current_user: current_user, view: params[:view]).serialize

        trending_topics = Feed::TrendingTopics.call
        suggestions = Feed::Suggestions.call(user: current_user)
        render json: {
          data: serialized_data,
          meta: {
            next_cursor: result[:next_cursor],
            has_more: result[:has_more],
            trending_topics: trending_topics
          }.merge(suggestions)
        }
      ensure
        duration_ms = started_at ? ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1000).round(2) : nil
        Rails.logger.info(
          event: 'feed_request', request_id: request.request_id, view: params[:view] || 'for_you',
          content_type: params[:type], candidate_count: result&.dig(:items)&.size.to_i,
          response_item_count: serialized_data&.size.to_i, has_more: result&.dig(:has_more), duration_ms: duration_ms
        )
      end
    end
  end
end
