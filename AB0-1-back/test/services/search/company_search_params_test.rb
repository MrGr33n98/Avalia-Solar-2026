# frozen_string_literal: true

require 'test_helper'

module Search
  class CompanySearchParamsTest < ActiveSupport::TestCase
    test 'normalizes invalid pagination without breaking existing API consumers' do
      params = CompanySearchParams.new(page: 'abc', per_page: '9999', sort: 'recommended')
      assert_equal 1, params.page
      assert_equal 10, params.per_page
      assert_equal 'recommended', params.sort
    end

    test 'accepts allowed numeric pagination and verified values' do
      params = CompanySearchParams.new(page: '12', per_page: '24', verified: 'true', city: 'Florianópolis')
      assert_equal 12, params.page
      assert_equal 24, params.per_page
      assert_equal true, params.verified
      assert_equal 'Florianópolis', params.city
    end

    test 'treats absent verified distinctly from false' do
      assert_nil CompanySearchParams.new({}).verified
      assert_equal false, CompanySearchParams.new(verified: 'false').verified
    end

    test 'rejects extreme pages and unrecognized sorts' do
      params = CompanySearchParams.new(page: '999999', per_page: '-5', sort: 'DROP TABLE')
      assert_equal 1, params.page
      assert_equal 10, params.per_page
      assert_equal 'recommended', params.sort
    end
  end
end
