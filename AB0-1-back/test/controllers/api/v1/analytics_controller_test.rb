require 'test_helper'

module Api
  module V1
    class AnalyticsControllerTest < ActionDispatch::IntegrationTest
      setup do
        @user = users(:one)
        @headers = {
          'Authorization' => "Bearer #{generate_jwt_token(@user)}",
          'Content-Type' => 'application/json'
        }
      end

      test "should get user stats" do
        get api_v1_analytics_user_stats_url, headers: @headers
        assert_response :success
        assert_not_nil JSON.parse(response.body)
      end

      test "should get content engagement" do
        get api_v1_analytics_content_engagement_url, headers: @headers
        assert_response :success
      end

      test "should require authentication" do
        get api_v1_analytics_user_stats_url
        assert_response :unauthorized
      end

      private

      def generate_jwt_token(user)
        JWT.encode({ user_id: user.id, exp: 24.hours.from_now.to_i }, Rails.application.credentials.secret_key_base)
      end
    end
  end
end
