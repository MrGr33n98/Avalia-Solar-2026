# frozen_string_literal: true

require 'test_helper'
require 'securerandom'

module Api
  module V1
    class SearchAllFiltersContractTest < ActionDispatch::IntegrationTest
      setup do
        @category = ::Category.create!(
          name: "Painéis #{SecureRandom.hex(4)}",
          seo_url: "paineis-#{SecureRandom.hex(4)}",
          description: 'Painéis de energia',
          status: 'active'
        )
      end

      test 'passes typed company filters to the search domain before pagination' do
        captured = []
        service = Object.new
        service.define_singleton_method(:call) do
          { nodes: [], page_info: { current_page: 2, total_pages: 1, total_count: 0, per_page: 12 } }
        end
        with_stubbed_company_service(service, captured) do
          get '/api/v1/search/all', params: {
            q: 'solar', page: 2, per_page: 12,
            state: 'SC', verified: 'true', category: @category.name
          }
        end

        assert_response :success
        assert_equal 'SC', captured.first[:state]
        assert_equal true, captured.first[:verified]
        assert_equal @category.id, captured.first[:category_id]
        assert_equal 2, captured.first[:page]
        assert_equal 12, captured.first[:limit]
        json = JSON.parse(response.body)
        assert_equal 12, json.dig('pagination', 'per_page')
        assert_equal 0, json.dig('pagination', 'total_count')
      end

      test 'does not reintroduce unfiltered legacy companies when verified filter is set' do
        company = ::Company.create!(
          name: 'Unverified Solar', slug: "unverified-#{SecureRandom.hex(4)}",
          description: 'Empresa sem verificação', email: 'solar@example.org',
          phone: '4833333333', state: 'SC', city: 'Florianópolis', status: 'active'
        )
        empty_service = Object.new
        empty_service.define_singleton_method(:call) do
          { nodes: [], page_info: { current_page: 1, total_pages: 1, total_count: 0, per_page: 24 } }
        end
        payload = { companies: [company], products: [], categories: [], articles: [], reviews: [] }
        with_stubbed_legacy_service(payload) do
          with_stubbed_company_service(empty_service, []) do
            get '/api/v1/search/all', params: { q: 'solar', verified: 'true', per_page: 24 }
          end
        end
        assert_response :success
        assert_equal [], JSON.parse(response.body)['companies']
      end

      private

      def with_stubbed_company_service(service, captured)
        original = ::Search::CompanySearchService
        ::Search.send(:remove_const, :CompanySearchService)
        replacement = Class.new do
          define_singleton_method(:new) { |**options| captured << options; service }
        end
        ::Search.const_set(:CompanySearchService, replacement)
        yield
      ensure
        ::Search.send(:remove_const, :CompanySearchService)
        ::Search.const_set(:CompanySearchService, original)
      end

      def with_stubbed_legacy_service(payload)
        original = ::SearchService
        ::Object.send(:remove_const, :SearchService)
        replacement = Class.new do
          define_method(:initialize) { |*| @result = payload }
          define_method(:call) { @result }
        end
        ::Object.const_set(:SearchService, replacement)
        yield
      ensure
        ::Object.send(:remove_const, :SearchService)
        ::Object.const_set(:SearchService, original)
      end
    end
  end
end
