require 'rails_helper'

RSpec.describe 'Public company media payload', type: :request do
  let(:company) { create(:company) }

  before do
    company.media_assets.attach(
      io: StringIO.new('approved image bytes'),
      filename: 'approved-installation.jpg',
      content_type: 'image/jpeg'
    )
    create(
      :company_video,
      company: company,
      video_id: 'published-video',
      url: 'https://www.youtube.com/watch?v=published-video',
      status: 'published'
    )
    create(
      :company_video,
      company: company,
      video_id: 'pending-video',
      url: 'https://www.youtube.com/watch?v=pending-video',
      status: 'pending'
    )
  end

  it 'exposes approved images and published videos through the public company endpoint' do
    get "/api/v1/companies/#{company.id}"

    expect(response).to have_http_status(:ok)
    payload = JSON.parse(response.body).fetch('company')

    expect(payload.fetch('media_urls')).to contain_exactly(a_string_including('/rails/active_storage/'))
    expect(payload.fetch('videos')).to contain_exactly(
      a_hash_including('video_id' => 'published-video', 'provider' => 'youtube')
    )
  end
end
