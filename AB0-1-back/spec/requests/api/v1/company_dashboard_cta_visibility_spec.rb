# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Company dashboard CTA visibility', type: :request do
  let(:user) { create(:user, status: :active, role: :company) }
  let(:company) { create(:company, status: :active, featured: true) }
  let(:token) { JWT.encode({ user_id: user.id }, Rails.application.secret_key_base, 'HS256') }
  let(:headers) { { 'Authorization' => "Bearer #{token}", 'Content-Type' => 'application/json' } }
  let(:path) { '/api/v1/company_dashboard/cta_visibility' }

  before { create(:company_member, user: user, company: company, role: 'owner') }

  def patch_config(payload, id: company.id)
    patch path, params: payload.merge(company_id: id).to_json, headers: headers
  end

  it 'returns current preferences, eligibility and version for the authorized company' do
    get path, params: { company_id: company.id }, headers: headers
    expect(response).to have_http_status(:ok)
    data = JSON.parse(response.body)
    expect(data['company_id']).to eq(company.id)
    expect(data['preferences']).to include('quote_cta_enabled' => true)
    expect(data['availability'].keys).to contain_exactly('quote', 'whatsapp', 'whatsapp_configured')
    expect(data['effective'].keys).to contain_exactly('quote', 'whatsapp')
    expect(data['version']).to eq(0)
  end

  it 'allows immediate OFF transitions without moderation and increments the revision once' do
    patch_config({ quote_cta_enabled: false, whatsapp_enabled: false, expected_version: 0 })
    expect(response).to have_http_status(:ok)
    expect(company.reload.quote_cta_enabled).to be(false)
    expect(company.cta_visibility_version).to eq(1)
    expect(company.pending_changes.where(change_type: 'cta_config')).to be_empty
    expect(JSON.parse(response.body)['effective']['quote']).to be(false)

    # Same payload and current version are idempotent.
    patch_config({ quote_cta_enabled: false, whatsapp_enabled: false, expected_version: 1 })
    expect(response).to have_http_status(:ok)
    expect(company.reload.cta_visibility_version).to eq(1)
  end

  it 'invalidates the Next.js public profile before reporting successful publication' do
    allow(PublicProfileRevalidator).to receive(:configured?).and_return(true)
    expect(PublicProfileRevalidator).to receive(:call!).with(have_attributes(id: company.id)).and_return(true)

    patch_config({ quote_cta_enabled: false, expected_version: 0 })
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)['cache_state']).to eq('revalidated')
  end

  it 'persists the opt-out and queues cache invalidation on a transient webhook failure' do
    allow(PublicProfileRevalidator).to receive(:configured?).and_return(true)
    allow(PublicProfileRevalidator).to receive(:call!).and_raise(PublicProfileRevalidator::Error, 'timeout')
    expect(PublicProfileRevalidationJob).to receive(:perform_later).with(company.id)

    patch_config({ quote_cta_enabled: false, expected_version: 0 })
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)['cache_state']).to eq('pending_retry')
    expect(company.reload.quote_cta_enabled).to eq(false)
  end

  it 'accepts partial updates without modifying the other channel' do
    company.update!(whatsapp_enabled: false)
    patch_config({ quote_cta_enabled: false, expected_version: 0 })
    expect(response).to have_http_status(:ok)
    expect(company.reload.whatsapp_enabled).to be(false)
  end

  it 'rejects stale revision and leaves the persisted choice unchanged' do
    patch_config({ quote_cta_enabled: false, expected_version: 0 })
    expect(response).to have_http_status(:ok)
    patch_config({ quote_cta_enabled: true, expected_version: 0 })
    expect(response).to have_http_status(:conflict)
    expect(JSON.parse(response.body)['code']).to eq('version_conflict')
    expect(company.reload.quote_cta_enabled).to be(false)
  end

  it 'rejects invalid boolean values and missing version without modifying the company' do
    patch_config({ whatsapp_enabled: 'false', expected_version: 0 })
    expect(response).to have_http_status(:unprocessable_entity)
    patch_config({ quote_cta_enabled: 1, expected_version: 0 })
    expect(response).to have_http_status(:unprocessable_entity)
    patch_config({ quote_cta_enabled: false, expected_version: '0' })
    expect(response).to have_http_status(:unprocessable_entity)
    expect(company.reload.cta_visibility_version).to eq(0)
  end

  it 'does not let Free plans enable restricted quote or WhatsApp buttons' do
    company.update!(quote_cta_enabled: false, whatsapp_enabled: false)
    patch_config({ quote_cta_enabled: true, expected_version: 0 })
    expect(response).to have_http_status(:forbidden)
    patch_config({ whatsapp_enabled: true, expected_version: 0 })
    expect(response).to have_http_status(:forbidden)
    expect(company.reload.quote_cta_enabled).to be(false)
    expect(company.whatsapp_enabled).to be(false)
  end

  it 'does not silently update a different company when the requested ID is not a membership' do
    another = create(:company, status: :active)
    patch_config({ quote_cta_enabled: false, expected_version: 0 }, id: another.id)
    expect(response).to have_http_status(:forbidden)
    expect(another.reload.quote_cta_enabled).to be(true)
    expect(company.reload.quote_cta_enabled).to be(true)
  end

  it 'requires authentication' do
    patch path, params: { company_id: company.id, quote_cta_enabled: false, expected_version: 0 }.to_json,
          headers: { 'Content-Type' => 'application/json' }
    expect(response).not_to have_http_status(:ok)
    expect(company.reload.quote_cta_enabled).to be(true)
  end
end
