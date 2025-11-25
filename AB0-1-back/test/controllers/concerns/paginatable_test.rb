# frozen_string_literal: true

require 'test_helper'

class PaginatableTest < ActionDispatch::IntegrationTest
  # TASK-017: Test pagination functionality
  
  setup do
    # Create test data
    @categories = []
    30.times do |i|
      @categories << Category.create!(
        name: "Category #{i + 1}",
        seo_url: "category-#{i + 1}",
        status: 'active'
      )
    end
  end

  teardown do
    Category.destroy_all
  end

  test 'should return first page by default' do
    get api_v1_categories_path(page: 1)
    assert_response :success
    
    json = JSON.parse(response.body)
    assert json['data'].present?
    assert json['meta'].present?
    assert_equal 1, json['meta']['pagination']['page']
  end

  test 'should return specified page' do
    get api_v1_categories_path(page: 2, per_page: 10)
    assert_response :success
    
    json = JSON.parse(response.body)
    assert_equal 2, json['meta']['pagination']['page']
    assert_equal 10, json['data'].length
  end

  test 'should respect per_page parameter' do
    get api_v1_categories_path(page: 1, per_page: 5)
    assert_response :success
    
    json = JSON.parse(response.body)
    assert_equal 5, json['data'].length
    assert_equal 5, json['meta']['pagination']['per_page']
  end

  test 'should enforce max per_page limit' do
    get api_v1_categories_path(page: 1, per_page: 200)
    assert_response :success
    
    json = JSON.parse(response.body)
    assert_equal 100, json['meta']['pagination']['per_page'] # MAX_PER_PAGE
  end

  test 'should include pagination metadata' do
    get api_v1_categories_path(page: 1, per_page: 10)
    assert_response :success
    
    json = JSON.parse(response.body)
    meta = json['meta']['pagination']
    
    assert meta.key?('page')
    assert meta.key?('per_page')
    assert meta.key?('total')
    assert meta.key?('total_pages')
    assert meta.key?('first_page')
    assert meta.key?('last_page')
    
    assert_equal 30, meta['total']
    assert_equal 3, meta['total_pages']
  end

  test 'should set pagination headers' do
    get api_v1_categories_path(page: 2, per_page: 10)
    assert_response :success
    
    assert_equal '2', response.headers['X-Page']
    assert_equal '10', response.headers['X-Per-Page']
    assert_equal '30', response.headers['X-Total']
    assert_equal '3', response.headers['X-Total-Pages']
    assert response.headers['Link'].present?
  end

  test 'should include Link header with navigation' do
    get api_v1_categories_path(page: 2, per_page: 10)
    assert_response :success
    
    link_header = response.headers['Link']
    assert link_header.include?('rel="first"')
    assert link_header.include?('rel="prev"')
    assert link_header.include?('rel="next"')
    assert link_header.include?('rel="last"')
  end

  test 'should handle first page navigation' do
    get api_v1_categories_path(page: 1, per_page: 10)
    assert_response :success
    
    json = JSON.parse(response.body)
    meta = json['meta']['pagination']
    
    assert meta['first_page']
    assert_not meta['last_page']
    assert_nil meta['prev_page']
    assert_equal 2, meta['next_page']
  end

  test 'should handle last page navigation' do
    get api_v1_categories_path(page: 3, per_page: 10)
    assert_response :success
    
    json = JSON.parse(response.body)
    meta = json['meta']['pagination']
    
    assert_not meta['first_page']
    assert meta['last_page']
    assert_equal 2, meta['prev_page']
    assert_nil meta['next_page']
  end

  test 'should handle invalid page number' do
    get api_v1_categories_path(page: -1)
    assert_response :success
    
    json = JSON.parse(response.body)
    assert_equal 1, json['meta']['pagination']['page'] # Should default to 1
  end

  test 'should handle invalid per_page number' do
    get api_v1_categories_path(per_page: -5)
    assert_response :success
    
    json = JSON.parse(response.body)
    assert_equal 25, json['meta']['pagination']['per_page'] # Should use default
  end

  test 'should work with filters and pagination' do
    # Create some featured categories
    Category.first(5).each { |c| c.update(featured: true) }
    
    get api_v1_categories_path(page: 1, per_page: 3, featured: true)
    assert_response :success
    
    json = JSON.parse(response.body)
    assert_equal 3, json['data'].length
    assert_equal 5, json['meta']['pagination']['total']
  end

  test 'should support backward compatibility without pagination' do
    get api_v1_categories_path
    assert_response :success
    
    json = JSON.parse(response.body)
    # When no page param is provided, should return all or use limit
    assert json.is_a?(Array) || json['data'].present?
  end
end
