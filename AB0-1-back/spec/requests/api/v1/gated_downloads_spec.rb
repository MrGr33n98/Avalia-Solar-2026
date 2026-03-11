require 'rails_helper'

RSpec.describe 'Gated downloads API', type: :request do
  include ActiveJob::TestHelper

  let(:company) { create(:company) }
  let(:headers) do
    {
      'ACCEPT' => 'application/json',
      'CONTENT_TYPE' => 'application/json'
    }
  end
  let(:payload) do
    {
      company_id: company.id,
      anonymous_id: 'anon-download-1',
      document_type: 'pdf',
      document_title: 'Guia Técnico Solar',
      document_url: 'https://cdn.example.com/guia-tecnico.pdf',
      contact_name: 'Maria Compradora',
      contact_email: 'maria@empresa.com',
      contact_phone: '11999998888'
    }
  end

  before do
    ActiveJob::Base.queue_adapter = :test
    clear_enqueued_jobs
  end

  after do
    clear_enqueued_jobs
  end

  it 'accepts flat payloads, creates the lead identity, and schedules follow-up jobs' do
    expect do
      post '/api/v1/gated_downloads', params: payload.to_json, headers: headers
    end.to change(GatedDownload, :count).by(1).and change(User, :count).by(1)

    expect(response).to have_http_status(:created)

    body = JSON.parse(response.body)
    download = GatedDownload.order(:created_at).last
    created_user = User.find(body['user_id'])

    expect(created_user.email).to eq('maria@empresa.com')
    expect(created_user.name).to eq('Maria Compradora')
    expect(download.user_id).to eq(created_user.id)
    expect(download.company_id).to eq(company.id)
    expect(enqueued_jobs.map { |job| job[:job] }).to include(CalculateBuyerIntentJob, StitchIdentityJob)
  end

  it 'returns validation errors for invalid payloads' do
    post '/api/v1/gated_downloads',
         params: payload.merge(contact_email: 'invalido').to_json,
         headers: headers

    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body)['errors']).to be_present
  end
end
