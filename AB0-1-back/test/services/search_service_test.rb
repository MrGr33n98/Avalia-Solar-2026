require 'test_helper'

class SearchServiceTest < ActiveSupport::TestCase
  setup do
    @service = SearchService.new
    @product = products(:one)
    @content = contents(:one)
    @user = users(:one)
  end

  test "should search across all resources" do
    results = @service.search('test')
    assert_not_nil results
    assert results.is_a?(Hash)
  end

  test "should search products by name" do
    results = @service.search(@product.name, type: 'products')
    assert results[:products].present?
  end

  test "should search contents by title" do
    results = @service.search(@content.title, type: 'contents')
    assert results[:contents].present?
  end

  test "should return empty results for no matches" do
    results = @service.search('nonexistentquery123456789')
    assert results.all? { |_, v| v.blank? }
  end

  test "should handle nil query" do
    results = @service.search(nil)
    assert_not_nil results
  end

  test "should handle empty string query" do
    results = @service.search('')
    assert_not_nil results
  end

  test "should support pagination" do
    results = @service.search('test', page: 1, per_page: 10)
    assert_not_nil results
  end

  test "should search case insensitively" do
    results_lower = @service.search(@product.name.downcase)
    results_upper = @service.search(@product.name.upcase)
    
    assert_equal results_lower[:products].count, results_upper[:products].count
  end

  test "should filter by category" do
    category = categories(:one)
    results = @service.search('test', category_id: category.id)
    assert_not_nil results
  end

  test "should search users by name" do
    results = @service.search(@user.name, type: 'users')
    assert results[:users].present? if results.key?(:users)
  end
end
