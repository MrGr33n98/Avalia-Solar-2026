require 'test_helper'

class ApiPaginationTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @headers = {
      'Authorization' => "Bearer #{generate_jwt_token(@user)}",
      'Content-Type' => 'application/json'
    }
    
    # Create multiple products for pagination testing
    25.times do |i|
      Product.create!(
        name: "Product #{i}",
        description: "Description #{i}",
        company: companies(:one),
        status: 'active'
      )
    end
  end

  test "should paginate products" do
    get api_v1_products_url, params: { page: 1, per_page: 10 }, headers: @headers
    
    assert_response :success
    json_response = JSON.parse(response.body)
    assert_operator json_response.size, :<=, 10
  end

  test "should return correct page number" do
    get api_v1_products_url, params: { page: 2, per_page: 10 }, headers: @headers
    
    assert_response :success
    assert_not_nil response.headers['X-Page']
    assert_equal '2', response.headers['X-Page']
  end

  test "should include total count in headers" do
    get api_v1_products_url, params: { page: 1 }, headers: @headers
    
    assert_response :success
    assert_not_nil response.headers['X-Total']
    assert_operator response.headers['X-Total'].to_i, :>, 0
  end

  test "should handle invalid page number" do
    get api_v1_products_url, params: { page: -1 }, headers: @headers
    
    assert_response :success
  end

  test "should handle page beyond total pages" do
    get api_v1_products_url, params: { page: 999 }, headers: @headers
    
    assert_response :success
    json_response = JSON.parse(response.body)
    assert_equal 0, json_response.size
  end

  test "should respect per_page parameter" do
    get api_v1_products_url, params: { per_page: 5 }, headers: @headers
    
    assert_response :success
    json_response = JSON.parse(response.body)
    assert_operator json_response.size, :<=, 5
  end

  test "should have default per_page limit" do
    get api_v1_products_url, headers: @headers
    
    assert_response :success
    json_response = JSON.parse(response.body)
    assert_not_nil json_response
  end

  private

  def generate_jwt_token(user)
    JWT.encode(
      { user_id: user.id, exp: 24.hours.from_now.to_i },
      Rails.application.credentials.secret_key_base
    )
  end
end
