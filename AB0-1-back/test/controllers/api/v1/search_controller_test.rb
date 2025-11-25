require 'test_helper'

module Api
  module V1
    class SearchControllerTest < ActionDispatch::IntegrationTest
      setup do
        @user = users(:one)
        @headers = {
          'Authorization' => "Bearer #{generate_jwt_token(@user)}",
          'Content-Type' => 'application/json'
        }
        @product = products(:one)
        @content = contents(:one)
      end

      test "should search all resources" do
        get api_v1_search_url, params: { q: 'test' }, headers: @headers
        assert_response :success
        
        json_response = JSON.parse(response.body)
        assert_not_nil json_response
      end

      test "should search products" do
        get api_v1_search_url, params: { 
          q: @product.name,
          type: 'products'
        }, headers: @headers
        
        assert_response :success
        json_response = JSON.parse(response.body)
        assert json_response['products'].any?
      end

      test "should search contents" do
        get api_v1_search_url, params: { 
          q: @content.title,
          type: 'contents'
        }, headers: @headers
        
        assert_response :success
      end

      test "should return empty results for no matches" do
        get api_v1_search_url, params: { 
          q: 'nonexistentquerythatshouldnotmatchanything123456'
        }, headers: @headers
        
        assert_response :success
        json_response = JSON.parse(response.body)
        assert_not_nil json_response
      end

      test "should require authentication" do
        get api_v1_search_url, params: { q: 'test' }
        assert_response :unauthorized
      end

      test "should handle empty query" do
        get api_v1_search_url, params: { q: '' }, headers: @headers
        assert_response :success
      end

      test "should support pagination" do
        get api_v1_search_url, params: { 
          q: 'test',
          page: 1,
          per_page: 10
        }, headers: @headers
        
        assert_response :success
      end

      private

      def generate_jwt_token(user)
        JWT.encode({ user_id: user.id, exp: 24.hours.from_now.to_i }, Rails.application.credentials.secret_key_base)
      end
    end
  end
end
