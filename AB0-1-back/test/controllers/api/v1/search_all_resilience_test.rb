require 'test_helper'
require 'securerandom'

module Api
  module V1
    class SearchAllResilienceTest < ActionDispatch::IntegrationTest
      setup do
        @category = ::Category.create!(
          name: 'Energia Solar',
          seo_url: "energia-solar-#{SecureRandom.hex(4)}",
          description: 'Categoria de energia solar',
          status: 'active'
        )
        @company = ::Company.create!(
          name: 'WEG',
          slug: "weg-#{SecureRandom.hex(4)}",
          description: 'Fabricante de equipamentos de energia solar',
          email: 'contato@weg.net',
          phone: '4833333333',
          state: 'SC',
          city: 'Florianópolis',
          categories: [@category],
          status: 'active'
        )
      end

      test 'search all returns 200 for company terms' do
        with_company_search_service(successful_company_service(@company)) do
          get '/api/v1/search/all', params: { q: 'weg' }
        end

        assert_response :success
        json = JSON.parse(response.body)
        assert_kind_of Array, json['companies']
        assert json['companies'].any? { |company| company['name'] == 'WEG' }
      end

      test 'search all returns an empty payload when company search fails' do
        failing_service = Object.new
        def failing_service.call
          raise StandardError, 'search boom'
        end

        with_company_search_service(failing_service) do
          get '/api/v1/search/all', params: { q: 'weg' }
        end

        assert_response :success
        json = JSON.parse(response.body)
        assert_equal [], json['companies']
        assert_includes json.dig('meta', 'error_stage'), 'company_search'
      end

      test 'search all skips companies that fail result serialization' do
        with_company_search_service(successful_company_service(Object.new)) do
          get '/api/v1/search/all', params: { q: 'weg' }
        end

        assert_response :success
        json = JSON.parse(response.body)
        assert_equal [], json['companies']
        assert_includes json.dig('meta', 'error_stage'), 'company_serialization'
      end

      test 'search all matches city terms with and without accents' do
        get '/api/v1/search/all', params: { q: 'florianopolis' }
        assert_response :success
        without_accent = JSON.parse(response.body)

        get '/api/v1/search/all', params: { q: 'Florianópolis' }
        assert_response :success
        with_accent = JSON.parse(response.body)

        assert without_accent['companies'].any? { |company| company['city'] == 'Florianópolis' }
        assert with_accent['companies'].any? { |company| company['city'] == 'Florianópolis' }
      end

      private

      def successful_company_service(company)
        service = Object.new
        service.instance_variable_set(:@company, company)
        def service.call
          {
            nodes: [@company],
            page_info: {
              current_page: 1,
              total_pages: 1,
              total_count: 1,
              per_page: 10,
              has_next_page: false,
              has_previous_page: false
            }
          }
        end
        service
      end

      def with_company_search_service(service)
        original = ::Search::CompanySearchService
        ::Search.send(:remove_const, :CompanySearchService)
        replacement = Class.new do
          define_singleton_method(:new) { |*| service }
        end
        ::Search.const_set(:CompanySearchService, replacement)
        yield
      ensure
        ::Search.send(:remove_const, :CompanySearchService)
        ::Search.const_set(:CompanySearchService, original)
      end
    end
  end
end
