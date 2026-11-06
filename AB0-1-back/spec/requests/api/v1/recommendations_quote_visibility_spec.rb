# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Recommendation paid conversion contracts', type: :request do
  it 'never returns a quote action for an approved Free installer' do
    company = create(:company, segment: 'installer', status: 'active', moderation_status: 'approved',
                     plan: create(:plan, price: 0, features: {}))

    get '/api/v1/recommendations', params: { segment: 'installer' }

    expect(response).to have_http_status(:ok)
    item = JSON.parse(response.body).fetch('data').find { |row| row['id'] == company.id }
    expect(item).to be_present
    expect(item.dig('primary_cta', 'type')).to eq('view_profile')
    expect(item.dig('cta_visibility', 'effective', 'quote')).to eq(false)
  end
end
