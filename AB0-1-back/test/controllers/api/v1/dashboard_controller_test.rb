require 'test_helper'

module Api
  module V1
    class DashboardControllerTest < ActionDispatch::IntegrationTest
      setup do
        @user = users(:one)
        @headers = {
          'Authorization' => "Bearer #{generate_jwt_token(@user)}",
          'Content-Type' => 'application/json'
        }
      end

      test "should get dashboard data" do
        get api_v1_dashboard_url, headers: @headers
        assert_response :success
        
        json_response = JSON.parse(response.body)
        assert_not_nil json_response
      end

      test "should get user dashboard stats" do
        get api_v1_dashboard_stats_url, headers: @headers
        assert_response :success
      end

      test "should require authentication for dashboard" do
        get api_v1_dashboard_url
        assert_response :unauthorized
      end

      test "should get recent activities" do
        get api_v1_dashboard_activities_url, headers: @headers
        assert_response :success
        
        json_response = JSON.parse(response.body)
        assert json_response.is_a?(Array)
      end

      private

      def generate_jwt_token(user)
        JWT.encode({ user_id: user.id, exp: 24.hours.from_now.to_i }, Rails.application.credentials.secret_key_base)
      end
    end
  end
end
