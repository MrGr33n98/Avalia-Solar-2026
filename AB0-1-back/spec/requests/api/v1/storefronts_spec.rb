# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Storefronts', type: :request do
  describe 'GET /api/v1/storefronts/:slug' do
    let(:slug) { 'weg-solar' }

    context 'quando a vitrine existe' do
      let(:mock_payload) do
        {
          schema_version: 'v1',
          data_as_of: '2026-11-26T14:00:00Z',
          source_type: 'avalia_solar_verified_storefront',
          data: {
            company: {
              id: 42,
              name: 'WEG Solar Brasil',
              slug: 'weg-solar',
              verified: true,
              headquarters: { city: 'Jaraguá do Sul', state: 'SC' }
            },
            settings: {
              headline: 'Líder nacional em inversores.',
              cta_label: 'Solicitar Orçamento',
              show_calculator: true
            },
            projects: [],
            curated_products: []
          },
          limitations: []
        }
      end

      before do
        allow(Storefront::PublicProfileService).to receive(:call).with(slug: 'weg-solar').and_return(mock_payload)
      end

      it 'retorna 200 OK com o envelope da vitrine' do
        get "/api/v1/storefronts/#{slug}"

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['schema_version']).to eq('v1')
        expect(json['data']['company']['name']).to eq('WEG Solar Brasil')
      end
    end

    context 'quando a vitrine não é encontrada' do
      before do
        allow(Storefront::PublicProfileService).to receive(:call)
          .with(slug: 'inexistente')
          .and_raise(Storefront::PublicProfileService::NotFoundError, 'Não encontrada')
      end

      it 'retorna 404 Not Found' do
        get '/api/v1/storefronts/inexistente'

        expect(response).to have_http_status(:not_found)
        json = JSON.parse(response.body)
        expect(json['error']).to include('Não encontrada')
      end
    end
  end
end

