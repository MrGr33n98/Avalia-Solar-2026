require 'test_helper'

module Api
  module V1
    class ClassificationTest < ActionDispatch::IntegrationTest
      # self.use_transactional_tests = true
      
      def setup
        # Ordem de deleção para evitar erros de Foreign Key
        ::Review.delete_all
        ::Category.connection.execute("DELETE FROM categories_companies")
        ::Company.delete_all
        ::Category.delete_all

        @category = ::Category.create!(
          name: 'Solar Test', 
          status: :active,
          description: 'Test description for solar category',
          seo_url: 'solar-test'
        )
        
        @best_company = ::Company.create!(
          name: 'A - Melhor Empresa', 
          slug: 'melhor-empresa',
          status: :active, 
          rating_avg: 5.0, 
          rating_count: 10,
          city: 'Rio Branco',
          state: 'AC',
          description: 'Description for company A',
          email: 'company_a@example.com',
          email_public: 'contact_a@example.com',
          categories: [@category]
        )
        
        @average_company = ::Company.create!(
          name: 'B - Empresa Média', 
          slug: 'empresa-media',
          status: :active, 
          rating_avg: 3.5, 
          rating_count: 5,
          city: 'Rio Branco',
          state: 'AC',
          description: 'Description for company B',
          email: 'company_b@example.com',
          phone: '11999999999',
          categories: [@category]
        )
        
        @new_company = ::Company.create!(
          name: 'C - Empresa Nova', 
          slug: 'empresa-nova',
          status: :active, 
          rating_avg: 0.0, 
          rating_count: 0,
          city: 'Rio Branco',
          state: 'AC',
          description: 'Description for company C',
          email: 'company_c@example.com',
          whatsapp: '41999999999',
          categories: [@category]
        )
      end

      test "should return companies sorted by rating_avg" do
        get api_v1_companies_url, params: { sort: 'rating' }
        assert_response :success
        
        json_response = JSON.parse(response.body)
        ratings = json_response.map { |c| c['rating_avg'].to_f }
        
        assert_equal [5.0, 3.5, 0.0], ratings
        assert_equal 'A - Melhor Empresa', json_response.first['name']
      end

      test "should return companies sorted by name" do
        get api_v1_companies_url, params: { sort: 'name' }
        assert_response :success
        
        json_response = JSON.parse(response.body)
        names = json_response.map { |c| c['name'] }
        
        assert_equal ['A - Melhor Empresa', 'B - Empresa Média', 'C - Empresa Nova'], names
      end

      test "should handle invalid sort parameter by falling back to default" do
        get api_v1_companies_url, params: { sort: 'invalid_field' }
        assert_response :success
        
        json_response = JSON.parse(response.body)
        # O padrão agora é rating_avg desc, rating_count desc, created_at desc
        assert_equal 'A - Melhor Empresa', json_response.first['name']
      end

      test "should include rating data in the response" do
        get api_v1_companies_url
        assert_response :success
        
        json_response = JSON.parse(response.body)
        company_data = json_response.find { |c| c['id'] == @best_company.id }
        
        assert_not_nil company_data['rating_avg']
        assert_not_nil company_data['rating_count']
        assert_equal 5.0, company_data['rating_avg'].to_f
        assert_equal 10, company_data['rating_count']
      end
    end
  end
end
