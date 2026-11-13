require 'rails_helper'
require 'cgi'
require 'nokogiri'

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

  describe 'admin claims navigation' do
    it 'surfaces a dynamic claims tab and the pending shortcut on Users & Access' do
      get admin_usuarios_acesso_path

      expect(response).to have_http_status(:ok)
      page = Nokogiri::HTML(response.body)
      claims_links = page.css('a[href*="company_access_requests"]')
      expect(claims_links.map { |link| link.text.strip }).to include('Reivindicações (1)')
      expect(claims_links.any? { |link| link['href']&.include?('scope=pending') }).to be(true)
      expect(page.text).to include('Reivindicações Pendentes')
    end

    it 'shows applicant identity, contact details and a direct review link' do
      access_request.update!(
        contact_email: 'contato-claim@example.org',
        contact_phone: '+5511998765432'
      )

      get admin_company_access_requests_path

      expect(response).to have_http_status(:ok)
      page = Nokogiri::HTML(response.body)
      expect(page.text).to include('E-mail da conta', user.email)
      expect(page.text).to include('E-mail de contato', 'contato-claim@example.org')
      expect(page.text).to include('Telefone/WhatsApp', '+5511998765432')
      expect(page.css('a[href]').any? do |link|
        link.text.strip == 'Analisar' && link['href'] == admin_company_access_request_path(access_request)
      end).to be(true)
    end

    it 'filters requests by applicant account email' do
      other_user = create(:user, role: 'company', status: :active, company: nil, confirmed_at: Time.current)
      create(:company_access_request, user: other_user, company: company, status: 'pending')

      get admin_company_access_requests_path, params: { q: { user_email_cont: user.email } }

      expect(response).to have_http_status(:ok)
      page = Nokogiri::HTML(response.body)
      table_text = page.css('table.index_table tbody').text
      expect(table_text).to include(user.email)
      expect(table_text).not_to include(other_user.email)
    end

    it 'does not expose the requests listing to unauthenticated users' do
      sign_out admin_user
      get admin_company_access_requests_path

      expect(response).to have_http_status(:redirect)
      expect(response.body).not_to include(user.email)
    end
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
