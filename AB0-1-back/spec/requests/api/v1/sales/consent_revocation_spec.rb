require 'rails_helper'

RSpec.describe 'Sales consent revocation', type: :request do
  let(:company_a) { create(:company) }
  let(:company_b) { create(:company) }
  let(:owner_a) { create_sales_user(company_a) }
  let(:peer_a) { create_sales_user(company_a) }
  let(:owner_b) { create_sales_user(company_b) }
  let!(:account_a) { Sales::Account.create!(company: company_a, owner: owner_a, name: 'Conta A') }
  let!(:account_b) { Sales::Account.create!(company: company_b, owner: owner_b, name: 'Conta B') }
  let!(:contact_a) { Sales::Contact.create!(sales_account_id: account_a.id, first_name: 'Contato A', user: owner_a) }
  let!(:contact_b) { Sales::Contact.create!(sales_account_id: account_b.id, first_name: 'Contato B', user: owner_b) }
  let!(:consent_a) { create_consent(contact_a) }
  let!(:consent_b) { create_consent(contact_b) }

  def create_sales_user(company)
    user = create(:user, company: company, role: :company)
    role = Sales::Role.find_or_create_by!(slug: "consent_sales_#{company.id}") do |record|
      record.name = 'Sales Consent'
      record.system = true
    end
    Sales::UserRole.find_or_create_by!(user: user, role: role)
    user
  end

  def create_consent(contact)
    Sales::Consent.create!(contact: contact, purpose: 'marketing', lawful_basis: 'legitimate_interest',
                           granted: true, granted_at: Time.current)
  end

  def auth_headers(user)
    token = JWT.encode(
      { user_id: user.id, typ: 'access', exp: 24.hours.from_now.to_i, jti: SecureRandom.uuid },
      Rails.application.secret_key_base,
      'HS256'
    )
    { 'Authorization' => "Bearer #{token}", 'Accept' => 'application/json' }
  end

  it 'expõe rota de revogação' do
    route = Rails.application.routes.routes.find do |candidate|
      candidate.path.spec.to_s.include?('/api/v1/sales/consent_revocations')
    end

    expect(route).to be_present
    expect(route.defaults[:action]).to eq('update')
    expect(route.defaults[:controller]).to eq('api/v1/sales/consent_revocations')
  end

  it 'mantém a rota REST escopada por consentimento' do
    expect(Rails.application.routes.routes.any? do |route|
      route.path.spec.to_s.include?('/api/v1/sales/consents/:consent_id/revoke') && route.defaults[:action] == 'update'
    end).to be(true)
  end

  it 'revoga consentimento válido e mantém a repetição idempotente' do
    2.times do
      post '/api/v1/sales/consent_revocations', params: { consent_id: consent_a.id }, headers: auth_headers(owner_a)
      expect(response).to have_http_status(:ok)
    end

    expect(consent_a.reload).to have_attributes(granted: false)
    expect(consent_a.revoked_at).to be_present
  end

  it 'oculta consentimento de outro tenant e consentimento inexistente' do
    post '/api/v1/sales/consent_revocations', params: { consent_id: consent_b.id }, headers: auth_headers(owner_a)
    cross_tenant_response = response.body
    expect(response).to have_http_status(:not_found)

    post '/api/v1/sales/consent_revocations', params: { consent_id: -1 }, headers: auth_headers(owner_a)
    expect(response).to have_http_status(:not_found)
    expect(response.body).to eq(cross_tenant_response)
  end

  it 'nega usuário do tenant sem ownership do contato' do
    post '/api/v1/sales/consent_revocations', params: { consent_id: consent_a.id }, headers: auth_headers(peer_a)

    expect(response).to have_http_status(:forbidden)
    expect(consent_a.reload.granted).to be(true)
  end
end
