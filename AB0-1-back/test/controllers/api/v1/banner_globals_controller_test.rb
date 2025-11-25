require 'test_helper'

module Api
  module V1
    class BannerGlobalsControllerTest < ActionDispatch::IntegrationTest
      setup do
        @user = users(:one)
        @headers = {
          'Authorization' => "Bearer #{generate_jwt_token(@user)}",
          'Content-Type' => 'application/json'
        }
      end

      test "should get global banners" do
        get api_v1_banner_globals_url, headers: @headers
        assert_response :success
        
        json_response = JSON.parse(response.body)
        assert json_response.is_a?(Array)
      end

      test "should get active global banners only" do
        get api_v1_banner_globals_url, params: { active: true }, headers: @headers
        assert_response :success
        
        json_response = JSON.parse(response.body)
        json_response.each do |banner|
          assert banner['active']
        end
      end

      test "should get banners by position" do
        get api_v1_banner_globals_url, params: { position: 'header' }, headers: @headers
        assert_response :success
      end

      test "should allow public access to global banners" do
        get api_v1_banner_globals_url
        assert_response :success
      end

      private

      def generate_jwt_token(user)
        JWT.encode({ user_id: user.id, exp: 24.hours.from_now.to_i }, Rails.application.credentials.secret_key_base)
      end
    end
  end
end
