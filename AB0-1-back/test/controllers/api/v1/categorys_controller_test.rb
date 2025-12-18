require 'test_helper'

class Api::V1::CategorysControllerTest < ActionDispatch::IntegrationTest
  setup do
    @category = Category.create!(
      name: 'Painéis Solares',
      seo_url: 'paineis-solares',
      seo_title: 'Painéis Solares',
      status: 'active',
      kind: 'product'
    )
    
    @company = Company.create!(
      name: 'Test Company',
      description: 'Test Description',
      status: 'active',
      verified: true
    )
    @category.companies << @company
  end

  test "should get index with companies" do
    get api_v1_categories_url
    assert_response :success
    json_response = JSON.parse(response.body)
    assert_not_nil json_response
    assert_kind_of Array, json_response
  end

  test "should get category companies by id" do
    get companies_api_v1_category_url(@category)
    assert_response :success
    json_response = JSON.parse(response.body)
    assert_kind_of Array, json_response
    assert_equal 1, json_response.length
    
    company = json_response.first
    assert_includes company.keys, 'banner_url'
    assert_includes company.keys, 'logo_url'
  end

  test "should get category companies with image fields" do
    get companies_api_v1_category_url(@category)
    assert_response :success
    
    json_response = JSON.parse(response.body)
    company_data = json_response.first
    
    # Verify image fields exist even if null
    assert company_data.key?('banner_url')
    assert company_data.key?('logo_url')
  end
end
