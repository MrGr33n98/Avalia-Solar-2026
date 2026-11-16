require 'rails_helper'

RSpec.describe 'Companies create API', type: :request do
  let!(:category) { create(:category, status: 'active') }

  let(:owner) do
    create(:user, role: 'review', status: :active, confirmed_at: Time.current,
                  city: 'Sao Paulo', state: 'SP')
  end

  def owner_headers
    post '/api/v1/auth/login', params: { email: owner.email, password: 'Password123' }.to_json,
         headers: { 'Content-Type' => 'application/json' }
    token = JSON.parse(response.body).fetch('token')
    { 'Content-Type' => 'application/json', 'Authorization' => "Bearer #{token}" }
  end

  it 'rejects public requests that omit consent and applicant verification details' do
    expect {
      post '/api/v1/companies', params: { company: { name: 'Unauthorized' } }.to_json,
           headers: { 'Content-Type' => 'application/json' }
    }.not_to change(Company, :count)
    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body).fetch('code')).to eq('CONSENT_REQUIRED')
  end

  it 'creates a pending company without a redundant pending change' do
    payload = {
      company: {
        name: 'Solar Cadastro',
        description: 'Empresa em processo de cadastro.',
        cnpj: '11222333000181',
        email: 'cadastro@solar.example',
        email_public: 'contato@solar.example',
        state: 'SP',
        city: 'São Paulo',
        phone: '11999999999',
        category_ids: [category.id]
      }
    }

    headers = owner_headers

    expect {
      post '/api/v1/companies',
           params: payload.to_json,
           headers: headers
    }.to change(Company, :count).by(1)

    expect(response).to have_http_status(:created)
    body = JSON.parse(response.body)
    expect(body.dig('company', 'name')).to eq('Solar Cadastro')

    company = Company.find(body.dig('company', 'id'))
    expect(company.status).to eq('pending')
    expect(company.category_ids).to contain_exactly(category.id)
    expect(company.moderation_status).to eq('pending_review')
    expect(company.submitted_at).to be_present
    expect(PendingChange.where(company: company)).to be_empty
    owner_member = company.company_members.find_by(user: owner)
    expect(owner_member&.owner?).to be(true)
    expect(owner_member&.pending?).to be(true)
    expect(company.company_access_requests.find_by(user: owner)&.status).to eq('pending')
  end


  it 'accepts a public app application with no active owner and requires explicit consent' do
    payload = {
      company: {
        name: 'Empresa Pública Solar', description: 'Solicitação pelo formulário público.',
        cnpj: '11222333000181', email: 'empresa@solar.example',
        email_public: 'atendimento@solar.example', state: 'SP',
        city: 'São Paulo', phone: '11999999999', category_ids: [category.id],
        plan_id: 999, verified: true, status: 'active'
      },
      applicant: {
        name: 'Responsável Comercial', email: 'pessoa@solar.example',
        phone: '11999999999', relationship: 'owner'
      },
      terms_accepted: true,
      declaration_accepted: true
    }

    expect do
      post '/api/v1/companies', params: payload.to_json,
           headers: { 'Content-Type' => 'application/json' }
    end.to change(Company, :count).by(1)

    expect(response).to have_http_status(:created)
    company = Company.find(JSON.parse(response.body).dig('company', 'id'))
    applicant = User.find_by!(email: 'pessoa@solar.example')

    expect(company).to be_pending_status
    expect(company.verified).to be false
    expect(company.company_members).to be_empty
    expect(applicant.status).to eq('pending')
    expect(applicant.confirmed?).to be(false)
    claim = company.company_access_requests.find_by!(user: applicant)
    expect(claim.status).to eq('pending')

    CompanyClaims::DecideRequest.call(request: claim, admin: create(:admin_user))
    expect(claim.reload.status).to eq('approved')
    expect(company.reload.status).to eq('pending')
    expect(company.company_members.active).not_to exist
    expect(applicant.reload.status).to eq('pending')

    applicant.confirm

    expect(applicant.reload).to be_confirmed
    expect(applicant.status).to eq('active')
    expect(applicant.approved_by_admin?).to be(true)
    expect(company.reload.status).to eq('active')
    expect(company.company_members.active.where(user: applicant, role: :owner)).to exist
  end

  it 'does not create a duplicate company for an existing CNPJ' do
    existing = create(:company, cnpj: '11222333000181')
    params = {
      company: {
        name: 'Cópia', cnpj: existing.cnpj, email: 'duplicate@solar.example',
        state: 'SP', city: 'São Paulo', category_ids: [category.id]
      },
      applicant: {
        name: 'Outro Responsável', email: 'outro@solar.example',
        phone: '11999999999', relationship: 'owner'
      },
      terms_accepted: true,
      declaration_accepted: true
    }

    expect do
      post '/api/v1/companies', params: params.to_json,
           headers: { 'Content-Type' => 'application/json' }
    end.not_to change(Company, :count)
    expect(response).to have_http_status(:unprocessable_entity)
    expect(existing.reload.name).not_to eq('Cópia')
  end
end
