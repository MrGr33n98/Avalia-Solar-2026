# frozen_string_literal: true

require 'test_helper'
require 'securerandom'

module Search
  class CompanySearchServiceTest < ActiveSupport::TestCase
    test 'sorts the entire filtered dataset before selecting a page in PostgreSQL' do
      token = "zz-sort-#{SecureRandom.hex(6)}"
      common = {
        description: 'Empresa para validar paginação',
        email: 'sort@example.org', phone: '4833333333',
        state: 'SC', city: 'Florianópolis', status: 'active'
      }
      # Create Z before A, so insertion order cannot accidentally pass the test.
      Company.create!(**common, name: "#{token} Z", slug: "zz-z-#{SecureRandom.hex(6)}")
      Company.create!(**common, name: "#{token} A", slug: "zz-a-#{SecureRandom.hex(6)}")

      first = CompanySearchService.new(q: token, sort: 'name_asc', page: 1, limit: 1)
      first.define_singleton_method(:search_enabled?) { false }
      second = CompanySearchService.new(q: token, sort: 'name_asc', page: 2, limit: 1)
      second.define_singleton_method(:search_enabled?) { false }

      assert_match(/ A\\z/, first.call.fetch(:nodes).first.name)
      assert_match(/ Z\\z/, second.call.fetch(:nodes).first.name)
    end

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
