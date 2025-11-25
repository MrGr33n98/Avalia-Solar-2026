require 'test_helper'

class ApiAuthenticationTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
  end

  test "should authenticate with valid JWT token" do
    token = generate_jwt_token(@user)
    
    get api_v1_users_url, headers: {
      'Authorization' => "Bearer #{token}",
      'Content-Type' => 'application/json'
    }
    
    assert_response :success
  end

  test "should reject invalid JWT token" do
    get api_v1_users_url, headers: {
      'Authorization' => 'Bearer invalid_token',
      'Content-Type' => 'application/json'
    }
    
    assert_response :unauthorized
  end

  test "should reject expired JWT token" do
    token = JWT.encode(
      { user_id: @user.id, exp: 1.hour.ago.to_i },
      Rails.application.credentials.secret_key_base
    )
    
    get api_v1_users_url, headers: {
      'Authorization' => "Bearer #{token}",
      'Content-Type' => 'application/json'
    }
    
    assert_response :unauthorized
  end

  test "should reject request without token" do
    get api_v1_users_url, headers: {
      'Content-Type' => 'application/json'
    }
    
    assert_response :unauthorized
  end

  test "should handle malformed authorization header" do
    get api_v1_users_url, headers: {
      'Authorization' => 'InvalidFormat',
      'Content-Type' => 'application/json'
    }
    
    assert_response :unauthorized
  end

  test "should refresh valid token" do
    token = generate_jwt_token(@user)
    
    post api_v1_auth_refresh_url, headers: {
      'Authorization' => "Bearer #{token}",
      'Content-Type' => 'application/json'
    }
    
    assert_response :success
    json_response = JSON.parse(response.body)
    assert_not_nil json_response['token']
  end

  test "should logout and invalidate token" do
    token = generate_jwt_token(@user)
    
    delete api_v1_auth_logout_url, headers: {
      'Authorization' => "Bearer #{token}",
      'Content-Type' => 'application/json'
    }
    
    assert_response :success
  end

  private

  def generate_jwt_token(user)
    JWT.encode(
      { user_id: user.id, exp: 24.hours.from_now.to_i },
      Rails.application.credentials.secret_key_base
    )
  end
end
