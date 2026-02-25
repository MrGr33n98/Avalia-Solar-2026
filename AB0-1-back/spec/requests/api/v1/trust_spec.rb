require 'swagger_helper'

RSpec.describe 'Trust API', type: :request, swagger_doc: 'v1/swagger.json' do
  path '/api/v1/trust/profile' do
    get 'Retrieves company trust profile' do
      tags 'Trust'
      produces 'application/json'
      parameter name: 'X-Api-Key', in: :header, type: :string, required: true

      response '200', 'profile found' do
        schema type: :object,
               properties: {
                 company: {
                   type: :object,
                   properties: {
                     name: { type: :string },
                     verified: { type: :boolean },
                     trust_score: { type: :number },
                     rating_avg: { type: :number },
                     reviews_count: { type: :integer },
                     badges: { type: :array, items: { type: :string } }
                   }
                 },
                 metrics: {
                   type: :object,
                   properties: {
                     response_time_sla: { type: :string },
                     roi_accuracy_index: { type: :number }
                   }
                 }
               }

        let(:'X-Api-Key') { 'test_key' }
        run_test!
      end

      response '401', 'unauthorized' do
        let(:'X-Api-Key') { 'invalid' }
        run_test!
      end
    end
  end

  path '/api/v1/trust/widgets/config' do
    get 'Retrieves widget rendering configuration' do
      tags 'Trust'
      produces 'application/json'
      parameter name: :api_key, in: :query, type: :string, required: true

      response '200', 'config found' do
        schema type: :object,
               properties: {
                 widget_type: { type: :string },
                 theme: { type: :string },
                 position: { type: :string },
                 api_key: { type: :string },
                 installer_id: { type: :integer }
               }

        let(:api_key) { 'test_key' }
        run_test!
      end
    end
  end
end
