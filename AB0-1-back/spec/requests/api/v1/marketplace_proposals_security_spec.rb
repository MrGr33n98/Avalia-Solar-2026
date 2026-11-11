# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Marketplace Proposals Security API', type: :request do
  let(:buyer1) { FactoryBot.create(:user, :buyer, :confirmed) }
  let(:buyer2) { FactoryBot.create(:user, :buyer, :confirmed) }
  let(:company) { FactoryBot.create(:company) }
  let(:lead1) { FactoryBot.create(:lead, email: buyer1.email) }
  let(:distribution1) { FactoryBot.create(:lead_distribution, lead: lead1, company: company) }

  def api_auth_headers_for(user)
    token = JWT.encode({ user_id: user.id, typ: 'access', exp: 24.hours.from_now.to_i }, Rails.application.secret_key_base, 'HS256')
    {
      'Authorization' => "Bearer #{token}",
      'CONTENT_TYPE' => 'application/json',
      'Accept' => 'application/json'
    }
  end

  it 'impede que buyer2 acesse proposta de buyer1 (proteção IDOR)' do
    proposal = Marketplace::ProposalBootstrapService.new(distribution: distribution1).call
    version = proposal.versions.find_by!(number: 1)
    version.items.create!(
      kind: 'equipment',
      name: 'Kit Solar',
      quantity: 1,
      unit: 'un',
      unit_price_cents: 25_000_00,
      total_cents: 25_000_00,
      position: 0
    )
    version.terms.create!(key: 'payment', label: 'Pagamento', value: '30 dias', position: 0)
    version.update!(status: 'draft', title: 'Proposta Buyer 1', valid_until: 30.days.from_now, total_cents: 25_000_00)
    proposal.publish!

    headers = api_auth_headers_for(buyer2)
    get "/api/v1/proposals/#{proposal.id}", headers: headers

    expect(response).to have_http_status(:forbidden).or have_http_status(:not_found)
  end

  it 'impede que buyer1 veja propostas em rascunho (draft disclosure)' do
    proposal = Marketplace::ProposalBootstrapService.new(distribution: distribution1).call
    expect(proposal.status).to eq('draft')

    headers = api_auth_headers_for(buyer1)
    get '/api/v1/proposals', headers: headers

    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    proposal_payload = json['proposals'].find { |p| p['id'] == proposal.id }
    expect(proposal_payload['version']).to be_nil
    expect(proposal_payload['versions']).to be_empty
  end
end
