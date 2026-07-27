# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Company dashboard media publication flow', type: :request do
  let(:company) { create(:company, status: :active, featured: true) }
  let(:user) { create(:user, status: :active, role: :company) }
  let(:token) { JWT.encode({ user_id: user.id }, Rails.application.secret_key_base, 'HS256') }
  let(:auth_headers) { { 'Authorization' => "Bearer #{token}" } }

  before do
    create(:company_member, company: company, user: user, role: :owner, status: :active)
  end

  it 'publishes an approved dashboard image in the public company payload' do
    post '/api/v1/company_dashboard/upload_media',
         params: { images: [fixture_file_upload('banner_test.png', 'image/png')] },
         headers: auth_headers.merge('Idempotency-Key' => 'publication-image-1')

    expect(response).to have_http_status(:created)
    pending_change = PendingChange.find(JSON.parse(response.body).dig('pending_change', 'id'))
    expect(pending_change).to have_attributes(change_type: 'media', status: 'pending', applied_at: nil)

    pending_change.update!(status: 'approved', approved_at: Time.current)
    pending_change.apply_changes!

    get "/api/v1/companies/#{company.id}"

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).dig('company', 'media_urls')).to contain_exactly(
      a_string_including('/rails/active_storage/')
    )
  end

end
