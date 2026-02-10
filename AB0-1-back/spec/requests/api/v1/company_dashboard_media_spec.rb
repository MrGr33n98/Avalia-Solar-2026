require 'rails_helper'

RSpec.describe 'Company Dashboard media endpoints', type: :request do
  let(:company) { create(:company) }
  let(:user) do
    create(
      :user,
      role: 'company',
      status: :active,
      company: nil,
      confirmed_at: Time.current
    )
  end

  before do
    create(:company_member, company: company, user: user, role: :owner, status: 'active')
    allow_any_instance_of(Api::V1::CompanyDashboardController).to receive(:current_user).and_return(user)
  end

  describe 'GET /api/v1/company_dashboard/media' do
    it 'returns photos array without crashing' do
      company.media_assets.attach(
        io: StringIO.new('fake image bytes'),
        filename: 'photo.jpg',
        content_type: 'image/jpeg'
      )

      get '/api/v1/company_dashboard/media'

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['photos']).to be_an(Array)
    end
  end

  describe 'GET /api/v1/company_dashboard/videos' do
    it 'returns only published videos' do
      create(
        :company_video,
        company: company,
        url: 'https://www.youtube.com/watch?v=abc123',
        provider: 'youtube',
        video_id: 'abc123',
        status: 'published'
      )
      create(
        :company_video,
        company: company,
        url: 'https://www.youtube.com/watch?v=def456',
        provider: 'youtube',
        video_id: 'def456',
        status: 'pending'
      )

      get '/api/v1/company_dashboard/videos'

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['videos']).to be_an(Array)
      expect(body['videos'].size).to eq(1)
      expect(body['videos'].first['video_id']).to eq('abc123')
    end
  end
end
