require 'rails_helper'

RSpec.describe 'Categories cards view', type: :request do
  def attach_png(record, name: 'banner.png')
    record.banner.attach(
      io: StringIO.new(FactoryBot::BANNER_1X1_PNG),
      filename: name,
      content_type: 'image/png'
    )
  end

  let!(:category_without_banner) { create(:category, seo_url: 'no-banner') }
  let!(:category_with_banner) { create(:category, seo_url: 'with-banner') }

  before do
    attach_png(category_with_banner)

    # Create a targeted sponsor banner to ensure cards view doesn't incorrectly use it.
    create(:banner).tap do |banner|
      banner.categories << category_without_banner
      banner.save!
    end
  end

  describe 'GET /api/v1/categories?view=cards' do
    it 'uses Category.banner (Active Storage) as banner_url' do
      get '/api/v1/categories', params: { view: 'cards' }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      payload = body.find { |c| c['id'] == category_with_banner.id }

      expect(payload).to be_present
      expect(payload['banner_url']).to be_present
      expect(payload['banner_url']).to include('/rails/active_storage/blobs')
    end

    it 'returns null banner_url when category has no banner' do
      get '/api/v1/categories', params: { view: 'cards' }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      payload = body.find { |c| c['id'] == category_without_banner.id }

      expect(payload).to be_present
      expect(payload['banner_url']).to be_nil
    end

    it 'reflects banner updates after cache expiry key changes' do
      get '/api/v1/categories', params: { view: 'cards' }
      first = JSON.parse(response.body).find { |c| c['id'] == category_with_banner.id }['banner_url']

      category_with_banner.banner.purge
      attach_png(category_with_banner, name: 'banner-updated.png')
      category_with_banner.touch

      get '/api/v1/categories', params: { view: 'cards' }
      second = JSON.parse(response.body).find { |c| c['id'] == category_with_banner.id }['banner_url']

      expect(second).to be_present
      expect(second).not_to eq(first)
    end
  end
end

