require 'rails_helper'
require 'cgi'

RSpec.describe 'Admin Company Access Requests', type: :request do
  include Devise::Test::IntegrationHelpers

  let!(:admin_user) do
    AdminUser.find_or_create_by!(email: 'admin@example.com') do |admin|
      admin.password = 'password123'
      admin.password_confirmation = 'password123'
    end
  end

  let(:category) { create(:category, status: 'active') }
  let(:company) do
    create(
      :company,
      status: 'active',
      moderation_status: 'approved',
      state: 'SP',
      city: 'Sao Paulo',
      phone: '11999999999',
      categories: [category]
    )
  end
  let(:user) { create(:user, role: 'company', status: :active, company: nil, confirmed_at: Time.current) }
  let!(:access_request) { create(:company_access_request, user: user, company: company, status: 'pending') }

  before do
    sign_in admin_user
  end

  it 'approves request and creates membership' do
    expect do
      put approve_admin_company_access_request_path(access_request)
    end.to change { CompanyMember.count }.by(1)

    expect(response).to redirect_to(admin_company_access_request_path(access_request))
    expect(access_request.reload.status).to eq('approved')
    expect(CompanyMember.find_by(user: user, company: company)).to be_present
  end

  it 'rejects request with reason' do
    put reject_admin_company_access_request_path(access_request), params: { reason: 'Nao autorizado' }

    expect(response).to redirect_to(admin_company_access_request_path(access_request))
    expect(access_request.reload.status).to eq('rejected')
    expect(access_request.admin_note).to eq('Nao autorizado')
  end

  it 'renders approve/reject action items with PUT form submission script' do
    get admin_company_access_request_path(access_request)

    decoded_html = CGI.unescapeHTML(response.body)

    expect(response).to have_http_status(:ok)
    expect(decoded_html).to include(approve_admin_company_access_request_path(access_request))
    expect(decoded_html).to include(reject_admin_company_access_request_path(access_request))
    expect(decoded_html).to include("methodInput.name = '_method'")
    expect(decoded_html).to include("methodInput.value = 'put'")
    expect(decoded_html).to include("csrfInput.name = 'authenticity_token'")
  end
end
