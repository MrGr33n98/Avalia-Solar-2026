# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::BannerEvents', type: :request do
  it 'keeps safe compare metadata for views and clicks' do
    banner = create(:banner, :approved, active: true, position: 'compare_hero')

    post '/api/v1/banner_events', params: {
      banner_event: {
        banner_id: banner.id,
        event_type: 'view',
        metadata: {
          position: 'compare_hero',
          page: 'compare',
          sponsored: true,
          unsafe: 'discard me'
        }
      }
    }

    expect(response).to have_http_status(:created)
    expect(BannerEvent.last.metadata_json).to include(
      'position' => 'compare_hero',
      'page' => 'compare',
      'sponsored' => true
    )
    expect(BannerEvent.last.metadata_json).not_to have_key('unsafe')
  end
end
