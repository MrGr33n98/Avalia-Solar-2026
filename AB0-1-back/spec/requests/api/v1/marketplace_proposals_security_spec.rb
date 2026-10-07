# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Marketplace Proposals Security API', type: :request do
  let(:buyer1) { FactoryBot.create(:user, :buyer, :confirmed) }
  let(:buyer2) { FactoryBot.create(:user, :buyer, :confirmed) }
  let(:company) { FactoryBot.create(:company) }
  let(:lead1) { FactoryBot.create(:lead, email: buyer1.email) }
  let(:distribution1) { FactoryBot.create(:lead_distribution, lead: lead1, company: company) }

  it 'impede que buyer2 acesse proposta de buyer1 (proteção IDOR)' do
    proposal = Marketplace::ProposalBootstrapService.new(distribution: distribution1).call
    proposal.versions.create!(number: 1, status: 'published', title: 'Proposta Buyer 1')
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
    expect(json['proposals']).to be_empty
  end
end
