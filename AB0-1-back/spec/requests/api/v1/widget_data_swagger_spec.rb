require 'swagger_helper'

RSpec.describe 'api/v1/companies/{id}/widget_data', type: :request do
  path '/api/v1/companies/{id}/widget_data' do
    get 'Busca dados do Trust Widget' do
      tags 'Trust'
      produces 'application/json'
      parameter name: :id, in: :path, type: :string, description: 'ID ou Slug da Empresa'
      parameter name: :api_key, in: :query, type: :string, description: 'API Key do Instalador/Empresa'

      let!(:company) { create(:company, status: 'active', api_key: 'test_widget_key') }
      let(:id) { company.id }
      let(:api_key) { 'test_widget_key' }

      response '200', 'Dados encontrados' do
        schema type: :object,
          properties: {
            company_id: { type: :integer },
            name: { type: :string },
            verified: { type: :boolean },
            trust_score: { type: :number },
            rating_avg: { type: :number, nullable: true },
            reviews_count: { type: :integer },
            verified_badge_image_url: { type: :string, nullable: true },
            public_profile_url: { type: :string }
          }
        run_test!
      end

      response '401', 'Nao autorizado' do
        let(:api_key) { 'invalid_key' }
        run_test!
      end
      
      response '404', 'Empresa nao encontrada' do
        let(:id) { 999_999 }
        run_test!
      end
    end
  end
end
