require 'test_helper'

module Api
  module V1
    class CompanyDashboardControllerTest < ActionDispatch::IntegrationTest
      setup do
        @company = companies(:one)
        @user = users(:one)
        @user.update(company: @company, role: 'company_admin')
        
        @headers = {
          'Authorization' => "Bearer #{generate_jwt_token(@user)}",
          'Content-Type' => 'application/json'
        }
      end

      test "should get company dashboard" do
        get api_v1_company_dashboard_url, headers: @headers
        assert_response :success
        
        json_response = JSON.parse(response.body)
        assert_not_nil json_response
      end

      test "should get company stats" do
        get api_v1_company_dashboard_stats_url, headers: @headers
        assert_response :success
        
        json_response = JSON.parse(response.body)
        assert_not_nil json_response['campaigns_count']
      end

      test "should get company campaigns" do
        get api_v1_company_dashboard_campaigns_url, headers: @headers
        assert_response :success
        
        json_response = JSON.parse(response.body)
        assert json_response.is_a?(Array)
      end

      test "should require authentication" do
        get api_v1_company_dashboard_url
        assert_response :unauthorized
      end

      test "should require company admin role" do
        @user.update(role: 'user')
        
        get api_v1_company_dashboard_url, headers: @headers
        assert_response :forbidden
      end

      test "should get company products" do
        get api_v1_company_dashboard_products_url, headers: @headers
        assert_response :success
      end

      test "should get company analytics" do
        get api_v1_company_dashboard_analytics_url, headers: @headers
        assert_response :success
        
        json_response = JSON.parse(response.body)
        assert_not_nil json_response
      end

      private

      def generate_jwt_token(user)
        JWT.encode({ user_id: user.id, exp: 24.hours.from_now.to_i }, Rails.application.credentials.secret_key_base)
      end
    end
  end
end
