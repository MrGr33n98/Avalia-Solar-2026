# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::PublicidadeCampanhas', type: :request do
  describe 'GET /api/v1/publicidade_campanhas' do
    let!(:company) { create(:company, status: 'active') }
    let!(:active_campaign) do
      create(:campaign, name: 'Campanha Priority', budget: 1000, priority: 10,
                        start_date: 1.day.ago, end_date: 1.day.from_now, company: company)
    end
    let!(:low_priority_campaign) do
      create(:campaign, name: 'Campanha Low', budget: 500, priority: 2,
                        start_date: 1.day.ago, end_date: 1.day.from_now, company: company)
    end
    let!(:inactive_campaign) do
      create(:campaign, name: 'Campanha Inativa', budget: 2000, priority: 20,
                        start_date: 5.days.ago, end_date: 2.days.ago, company: company)
    end

    before { Rails.cache.clear }

    context 'when there is an active campaign' do
      it 'returns the active campaign with highest priority' do
        get '/api/v1/publicidade_campanhas'
        expect(response).to have_http_status(:ok)
        
        json = JSON.parse(response.body)
        expect(json['id']).to eq(active_campaign.id)
        expect(json['name']).to eq('Campanha Priority')
        expect(json['priority']).to eq(10)
      end

      it 'serves JSON from the admin alias route as well' do
        get '/admin/publicidade_campanhas', headers: { 'Accept' => 'application/json' }
        expect(response).to have_http_status(:ok)
        
        json = JSON.parse(response.body)
        expect(json['id']).to eq(active_campaign.id)
      end
    end

    context 'when there are no active campaigns' do
      before do
        Campaign.update_all(start_date: 5.days.ago, end_date: 2.days.ago)
        Rails.cache.clear
      end

      it 'returns nil successfully' do
        get '/api/v1/publicidade_campanhas'
        expect(response).to have_http_status(:ok)
        expect(response.body).to eq('null')
      end
    end
  end
end
