require 'rails_helper'

RSpec.describe 'Api::V1::Categories', type: :request do
  let(:category) { create(:category) }

  describe 'GET /api/v1/categories/:id/evaluation_context' do
    context 'with granular criteria' do
      let!(:criterion) { create(:rating_criterion, category: category, title: 'Atendimento', slug: 'atendimento') }

      it 'returns the evaluation context' do
        get "/api/v1/categories/#{category.id}/evaluation_context"

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['category_id']).to eq(category.id)
        expect(json['has_granular_criteria']).to be true
        expect(json['criteria'].first['slug']).to eq('atendimento')
      end
    end

    context 'without granular criteria' do
      it 'returns empty criteria list' do
        get "/api/v1/categories/#{category.id}/evaluation_context"

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['has_granular_criteria']).to be false
        expect(json['criteria']).to be_empty
      end
    end
  end
end
