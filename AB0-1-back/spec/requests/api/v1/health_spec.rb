require 'swagger_helper'

RSpec.describe 'api/v1/health', type: :request do
  path '/health' do
    get 'Check API health status' do
      tags 'Health'
      produces 'application/json'

      response '200', 'API is healthy' do
        schema type: :object,
               properties: {
                 status: { type: :string, example: 'ok' },
                 timestamp: { type: :string, format: :date_time }
               },
               required: [ 'status' ]

        run_test!
      end
    end
  end
end
