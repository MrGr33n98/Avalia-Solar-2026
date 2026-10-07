# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Marketplace Proposals Real Flow API', type: :request do
  let(:buyer) { FactoryBot.create(:user, :buyer, :confirmed) }
  let(:company) { FactoryBot.create(:company) }
  let(:lead) { FactoryBot.create(:lead, email: buyer.email, city: 'Florianópolis', state: 'SC') }
  let(:distribution) { FactoryBot.create(:lead_distribution, lead: lead, company: company) }

  it 'executa o fluxo completo sem mock: distribui lead, publica proposta e consulta via GET /api/v1/proposals' do
    # 1. Bootstrap
    proposal = Marketplace::ProposalBootstrapService.new(distribution: distribution).call
    expect(proposal.status).to eq('draft')

    # 2. Publicar proposta pela empresa
    proposal.versions.create!(
      number: 1,
      status: 'published',
      title: 'Sistema Solar 10kWp Premium',
      summary: 'Proposta técnica completa',
      total_cents: 3_200_000,
      currency: 'BRL',
      valid_until: 30.days.from_now.to_date
    )
    proposal.publish!

    # 3. Chamar API como buyer
    headers = api_auth_headers_for(buyer)
    get '/api/v1/proposals', headers: headers

    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    expect(json['proposals']).to be_an(Array)
    expect(json['proposals'].size).to eq(1)

    p = json['proposals'].first
    expect(p['id']).to eq(proposal.id)
    expect(p['status']).to eq('sent')
    expect(p['company']['id']).to eq(company.id)
    expect(p['version']['title']).to eq('Sistema Solar 10kWp Premium')
  end
end
