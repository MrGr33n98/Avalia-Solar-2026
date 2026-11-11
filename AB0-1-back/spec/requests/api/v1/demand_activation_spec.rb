# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Company Intent Sync API', type: :request do
  let(:company) { create(:company) }
  let(:other_company) { create(:company) }
  let(:user) { create(:user, role: 'company', status: :active, company: company) }
  let!(:member) { create(:company_member, user: user, company: company, role: :owner, status: 'active') }
  let(:base) { '/api/v1/demand_activation' }

  around do |example|
    old = ENV['INTENT_SYNC_ENABLED']
    ENV['INTENT_SYNC_ENABLED'] = 'true'
    example.run
  ensure
    ENV['INTENT_SYNC_ENABLED'] = old
  end

  before do
    allow_any_instance_of(Api::V1::DemandActivationController).to receive(:current_user).and_return(user)
    allow(EntitlementService).to receive(:entitled?).and_return(true)
  end

  it 'keeps activation disabled even when drafts are entitled' do
    get "#{base}/status", params: { company_id: company.id }

    expect(response).to have_http_status(:ok)
    payload = JSON.parse(response.body)
    expect(payload['available']).to eq(true)
    expect(payload['sync_enabled']).to eq(false)
    expect(payload.dig('capabilities', 'oauth')).to eq(false)
    expect(payload.dig('capabilities', 'source_import')).to eq(false)
    expect(payload['providers'].all? { |p| p['operational'] == false }).to eq(true)
  end

  it 'does not grant draft access to a non-entitled company' do
    allow(EntitlementService).to receive(:entitled?).and_return(false)
    get "#{base}/audiences", params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
    expect(JSON.parse(response.body)['code']).to eq('INTENT_SYNC_UPGRADE_REQUIRED')
  end

  it 'requires an active membership for a different company' do
    get "#{base}/status", params: { company_id: other_company.id }
    expect(response).to have_http_status(:forbidden)
  end

  it 'can create a tenant-owned draft with safe filters' do
    post "#{base}/audiences",
         params: { company_id: company.id, audience: { name: 'Setor SC', filter_definition: { region: 'SC' } } }
    expect(response).to have_http_status(:created)
    segment = DemandActivation::AudienceSegment.last
    expect(segment.company_id).to eq(company.id)
    expect(segment.status).to eq('draft')
    expect(segment.filter_definition['region']).to eq('SC')
  end

  it 'rejects a filter that contains an email field' do
    post "#{base}/audiences",
         params: { company_id: company.id, audience: { name: 'Unsafe', filter_definition: { email: 'user@example.com' } } }
    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body)['code']).to eq('INTENT_SYNC_FILTER_BLOCKED')
    expect(DemandActivation::AudienceSegment.where(name: 'Unsafe').count).to eq(0)
  end

  it 'never allows a foreign source to be linked to a draft' do
    source = DemandActivation::Source.create!(
      company: other_company, created_by: user, name: 'Other tenant', provenance: {}
    )
    post "#{base}/audiences",
         params: { company_id: company.id, audience: { name: 'Segregated', source_id: source.id } }
    expect(response).to have_http_status(:not_found)
  end

  it 'allows an owner to register metadata, never an eligible source' do
    post "#{base}/sources", params: {
      company_id: company.id,
      source: { name: 'Fonte própria', provenance: { purpose: 'Campanhas próprias', legal_basis: 'consent', attestation_version: 'v1' } }
    }
    expect(response).to have_http_status(:created)
    source = DemandActivation::Source.last
    expect(source.verification_status).to eq('pending')
    expect(source.eligible?).to eq(false)
  end

  it 'prevents editors from archiving audiences' do
    create(:company_member, company: company, role: :owner, status: 'active')
    member.update!(role: :editor)
    segment = DemandActivation::AudienceSegment.create!(company: company, created_by: user, name: 'Rascunho')
    post "#{base}/audiences/#{segment.id}/archive", params: { company_id: company.id }
    expect(response).to have_http_status(:forbidden)
  end

  it 'refuses every real synchronization attempt' do
    post "#{base}/audiences/999/sync", params: { company_id: company.id }
    expect(response).to have_http_status(:conflict)
    expect(JSON.parse(response.body)['code']).to eq('INTENT_SYNC_NOT_READY')
    expect(DemandActivation::SyncJob.count).to eq(0)
  end

  it 'does not query internal CRM audiences to list activation drafts' do
    get "#{base}/audiences", params: { company_id: company.id }
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)['audiences']).to eq([])
    expect(DemandActivation::AudienceSegment.table_name).not_to eq(Sales::Audience.table_name)
  end
end
