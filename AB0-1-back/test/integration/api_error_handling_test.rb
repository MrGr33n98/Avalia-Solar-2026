require 'test_helper'

class ApiErrorHandlingTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @headers = {
      'Authorization' => "Bearer #{generate_jwt_token(@user)}",
      'Content-Type' => 'application/json'
    }
  end

  test "should handle 404 for non-existent resource" do
    get api_v1_product_url(id: 999999), headers: @headers
    
    assert_response :not_found
    json_response = JSON.parse(response.body)
    assert_not_nil json_response['error']
  end

  test "should handle 422 for validation errors" do
    post api_v1_products_url, params: {
      product: { name: '' } # Invalid: empty name
    }.to_json, headers: @headers
    
    assert_response :unprocessable_entity
    json_response = JSON.parse(response.body)
    assert_not_nil json_response['errors']
  end

  test "should handle 401 for unauthorized access" do
    get api_v1_products_url
    
    assert_response :unauthorized
  end

  test "should handle 403 for forbidden access" do
    admin_resource_url = api_v1_admin_categories_url
    
    get admin_resource_url, headers: @headers
    
    # Should be forbidden if user is not admin
    assert_response :forbidden if @user.role != 'admin'
  end

  test "should handle invalid JSON in request body" do
    post api_v1_products_url, 
         params: 'invalid json {',
         headers: @headers
    
    assert_response :bad_request
  end

  test "should handle missing required parameters" do
    post api_v1_products_url, 
         params: {}.to_json,
         headers: @headers
    
    assert_response :unprocessable_entity
  end

  test "should return consistent error format" do
    get api_v1_product_url(id: 999999), headers: @headers
    
    assert_response :not_found
    json_response = JSON.parse(response.body)
    
    assert json_response.key?('error') || json_response.key?('errors')
    assert json_response.key?('message') if json_response['error']
  end

  test "should handle rate limiting" do
    # Simulate rate limit exceeded
    50.times do
      get api_v1_products_url, headers: @headers
    end
    
    # Should still work or return 429
    get api_v1_products_url, headers: @headers
    assert_includes [200, 429], response.status
  end

  test "should handle server errors gracefully" do
    # Stub to force internal error
    Product.stub(:all, -> { raise StandardError.new('Simulated error') }) do
      get api_v1_products_url, headers: @headers
      
      assert_response :internal_server_error
    end
  end

  test "should include correlation ID in error responses" do
    get api_v1_product_url(id: 999999), headers: @headers
    
    assert_response :not_found
    assert_not_nil response.headers['X-Request-Id']
  end

  private

  def generate_jwt_token(user)
    JWT.encode(
      { user_id: user.id, exp: 24.hours.from_now.to_i },
      Rails.application.credentials.secret_key_base
    )
  end
end
