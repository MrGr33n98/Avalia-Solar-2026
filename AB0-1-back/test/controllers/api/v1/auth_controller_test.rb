require 'test_helper'

module Api
  module V1
    class AuthControllerTest < ActionDispatch::IntegrationTest
      setup do
        @user = users(:one)
      end

      test "should login with valid credentials" do
        post api_v1_auth_login_url, params: {
          email: @user.email,
          password: 'password123'
        }, as: :json

        assert_response :success
        json_response = JSON.parse(response.body)
        assert_not_nil json_response['token']
        assert_equal @user.email, json_response['user']['email']
      end

      test "should not login with invalid credentials" do
        post api_v1_auth_login_url, params: {
          email: @user.email,
          password: 'wrongpassword'
        }, as: :json

        assert_response :unauthorized
      end

      test "should not login with missing email" do
        post api_v1_auth_login_url, params: {
          password: 'password123'
        }, as: :json

        assert_response :unprocessable_entity
      end

      test "should register new user" do
        assert_difference('User.count', 1) do
          post api_v1_auth_register_url, params: {
            user: {
              email: 'newuser@example.com',
              password: 'password123',
              password_confirmation: 'password123',
              name: 'New User'
            }
          }, as: :json
        end

        assert_response :created
        json_response = JSON.parse(response.body)
        assert_not_nil json_response['token']
        assert_equal 'newuser@example.com', json_response['user']['email']
      end

      test "should not register user with invalid data" do
        assert_no_difference('User.count') do
          post api_v1_auth_register_url, params: {
            user: {
              email: 'invalid',
              password: '123'
            }
          }, as: :json
        end

        assert_response :unprocessable_entity
      end

      test "should logout user" do
        @headers = {
          'Authorization' => "Bearer #{generate_jwt_token(@user)}",
          'Content-Type' => 'application/json'
        }

        delete api_v1_auth_logout_url, headers: @headers
        assert_response :success
      end

      test "should refresh token" do
        token = generate_jwt_token(@user)
        @headers = {
          'Authorization' => "Bearer #{token}",
          'Content-Type' => 'application/json'
        }

        post api_v1_auth_refresh_url, headers: @headers
        assert_response :success
        json_response = JSON.parse(response.body)
        assert_not_nil json_response['token']
      end

      private

      def generate_jwt_token(user)
        JWT.encode({ user_id: user.id, exp: 24.hours.from_now.to_i }, Rails.application.credentials.secret_key_base)
      end
    end
  end
end
