# frozen_string_literal: true

require 'test_helper'

module Search
  class CompanySearchServiceTest < ActiveSupport::TestCase
    test 'falls back to postgresql when opensearch returns zero companies for a real query' do
      company = Company.new(name: 'Solar Test')
      opensearch_result = {
        nodes: [],
        page_info: { total_count: 0, total_pages: 1, current_page: 1, per_page: 10 }
      }
      postgresql_result = {
        nodes: [company],
        page_info: { total_count: 1, total_pages: 1, current_page: 1, per_page: 10 }
      }
      service = CompanySearchService.new(q: 'solar')

      service.define_singleton_method(:search_enabled?) { true }
      service.define_singleton_method(:opensearch_responsive?) { true }
      service.define_singleton_method(:search_via_opensearch) { opensearch_result }
      service.define_singleton_method(:search_via_postgresql) { postgresql_result }

      assert_equal postgresql_result, service.call
    end
  end
end
