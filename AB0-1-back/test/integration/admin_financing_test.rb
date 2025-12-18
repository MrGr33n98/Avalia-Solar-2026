require 'test_helper'

class AdminFinancingTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  setup do
    @admin = AdminUser.create!(email: 'admin_test@example.com', password: 'password', password_confirmation: 'password')
    sign_in @admin
  end

  test "can access financing dashboard" do
    get "/financiamentos/dashboard"
    assert_response :success
    assert_select "h2", "Dashboard"
  end

  test "can access financing configurations" do
    get "/financiamentos/financing_configurations"
    assert_response :success
    assert_select "h2", "Parâmetros Globais"
  end

  test "can access financing options" do
    get "/financiamentos/financing_options"
    assert_response :success
    assert_select "h2", "Opções de Financiamento"
  end

  test "non-admin cannot access financing dashboard" do
    sign_out @admin
    get "/financiamentos/dashboard"
    assert_response :redirect
  end
end
