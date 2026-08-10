# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'GraphQL banners', type: :request do
  it 'usa a distribuição oficial e expõe deliveryId' do
    company = create(:company)
    eligible = create(:banner, :approved, :sponsored, active: true, position: 'home_top', company: company)
    create(:banner_addon_subscription, banner: eligible, company: company)
    create(:banner, :approved, :sponsored, active: true, position: 'home_top', company: create(:company))

    post '/graphql', params: {
      query: <<~GRAPHQL
        query {
          banners(position: "home_top") {
            id
            deliveryId
          }
        }
      GRAPHQL
    }, as: :json

    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    expect(json['errors']).to be_blank
    banners = json.dig('data', 'banners')
    expect(banners.map { |banner| banner['id'].to_i }).to include(eligible.id)
    expect(banners.first['deliveryId']).to match(/\A[a-f0-9]{32}\z/)
  end

  it 'aplica frequency cap quando recebe audienceKey' do
    banner = create(:banner, :approved, active: true, sponsored: false, position: 'home_top')
    create(:banner_event, banner: banner, event_type: 'impression', tracked_at: 1.hour.ago,
           metadata_json: { 'audience_key' => 'graphql-audience-1' }, valid_for_reporting: true)

    post '/graphql', params: {
      query: <<~GRAPHQL
        query {
          banners(position: "home_top", audienceKey: "graphql-audience-1") {
            id
          }
        }
      GRAPHQL
    }, as: :json

    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    expect(json['errors']).to be_blank
    expect(json.dig('data', 'banners').map { |item| item['id'].to_i }).not_to include(banner.id)
  end
end
