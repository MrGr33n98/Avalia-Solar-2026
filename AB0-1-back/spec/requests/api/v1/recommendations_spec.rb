# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Recommendations', type: :request do
  let!(:company_local) do
    create(
      :company,
      name: 'Solar Local SC',
      slug: 'solar-local-sc',
      status: 'active',
      moderation_status: 'approved',
      segment: 'installer',
      state: 'SC',
      city: 'Florianópolis',
      verified: true,
      rating_avg: 4.9,
      rating_count: 30,
      response_time_sla: '2h',
      delivered_projects_score: 150
    )
  end

  let!(:company_no_reviews) do
    create(
      :company,
      name: 'Solar Nova Sem Avaliação',
      slug: 'solar-nova',
      status: 'active',
      moderation_status: 'approved',
      segment: 'installer',
      state: 'SC',
      city: 'Florianópolis',
      verified: false,
      rating_avg: 0,
      rating_count: 0,
      response_time_sla: nil,
      delivered_projects_score: 0
    )
  end

  describe 'GET /api/v1/recommendations' do
    it 'returns recommendations with metadata and request_id without location' do
      get '/api/v1/recommendations'

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)

      expect(json['meta']).to be_present
      expect(json['meta']['request_id']).to be_present
      expect(json['meta']['location']['source']).to eq('fallback_national')
      expect(json['data']).to be_an(Array)
    end

    it 'filters recommendations by explicit city and state' do
      get '/api/v1/recommendations', params: { city: 'Florianópolis', state: 'SC' }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)

      expect(json['meta']['location']['city']).to eq('Florianópolis')
      expect(json['meta']['location']['state']).to eq('SC')
      expect(json['meta']['location']['source']).to eq('explicit_param')
      expect(json['data'].first['name']).to eq('Solar Local SC')
      expect(json['data'].first['rating']['label']).to include('4.9')
    end

    it 'returns honest labels for companies without reviews or SLA' do
      get '/api/v1/recommendations', params: { city: 'Florianópolis', state: 'SC' }

      json = JSON.parse(response.body)
      item = json['data'].find { |d| d['id'] == company_no_reviews.id }

      expect(item).to be_present
      expect(item['rating']['average']).to be_nil
      expect(item['rating']['label']).to eq('Sem avaliações')
      expect(item['response_time']['value']).to be_nil
      expect(item['response_time']['label']).to eq('Tempo de resposta não informado')
      expect(item['projects']['label']).to eq('Não informado')
    end

    it 'identifies sponsored placements explicitly' do
      create(
        :recommendation_placement,
        company: company_no_reviews,
        placement_type: 'sponsored',
        state_code: 'SC',
        slot_position: 1,
        starts_at: 1.day.ago,
        ends_at: 1.day.from_now
      )

      get '/api/v1/recommendations', params: { state: 'SC' }

      json = JSON.parse(response.body)
      first_item = json['data'].first

      expect(first_item['id']).to eq(company_no_reviews.id)
      expect(first_item['sponsored']).to be true
      expect(first_item['recommendation_reason']['code']).to eq('SPONSORED_PLACEMENT')
    end

    it 'clamps limit parameter safely' do
      get '/api/v1/recommendations', params: { limit: 999 }

      json = JSON.parse(response.body)
      expect(json['meta']['slots']['total']).to be <= 20
    end
  end
end
