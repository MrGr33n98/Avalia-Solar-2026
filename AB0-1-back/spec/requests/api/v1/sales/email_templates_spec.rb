# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Sales Email Templates API', type: :request do
  let!(:company) { create(:company) }
  let!(:other_company) { create(:company) }
  let!(:user) { create(:user, company: company) }
  let!(:other_user) { create(:user, company: other_company) }

  let!(:template1) do
    ::Sales::EmailTemplate.create!(
      company: company,
      name: 'Proposta Comercial',
      subject_template: 'Sua proposta de energia solar {{person.first_name}}',
      preheader: 'Confira os detalhes da proposta',
      category: 'Prospecção',
      status: 'active',
      body_html: '<p>Olá {{person.first_name}}, veja sua proposta.</p>'
    )
  end

  let!(:template2) do
    ::Sales::EmailTemplate.create!(
      company: company,
      name: 'Follow-up Rascunho',
      subject_template: 'Ainda em dúvida?',
      category: 'Follow-up',
      status: 'draft',
      user: user,
      body_html: '<p>Podemos conversar?</p>'
    )
  end

  let!(:other_template) do
    ::Sales::EmailTemplate.create!(
      company: other_company,
      name: 'Outra Empresa',
      subject_template: 'Assunto outro',
      category: 'Prospecção',
      status: 'active',
      body_html: '<p>Outro tenant</p>'
    )
  end

  def auth_headers(account)
    token = JWT.encode({ user_id: account.id, typ: 'access', exp: 1.day.from_now.to_i }, Rails.application.secret_key_base, 'HS256')
    { 'Authorization' => "Bearer #{token}" }
  end

  describe 'GET /api/v1/sales/email_templates' do
    it 'returns paginated list of templates for current tenant' do
      get '/api/v1/sales/email_templates', headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['templates'].size).to eq(2)
      expect(json['meta']['total']).to eq(2)
      expect(json['meta']['page']).to eq(1)
    end

    it 'filters by search q' do
      get '/api/v1/sales/email_templates?q=Proposta', headers: auth_headers(user)

      json = JSON.parse(response.body)
      expect(json['templates'].size).to eq(1)
      expect(json['templates'].first['name']).to eq('Proposta Comercial')
    end

    it 'filters by category' do
      get '/api/v1/sales/email_templates?category=Follow-up', headers: auth_headers(user)

      json = JSON.parse(response.body)
      expect(json['templates'].size).to eq(1)
      expect(json['templates'].first['category']).to eq('Follow-up')
    end

    it 'filters by status' do
      get '/api/v1/sales/email_templates?status=draft', headers: auth_headers(user)

      json = JSON.parse(response.body)
      expect(json['templates'].size).to eq(1)
      expect(json['templates'].first['status']).to eq('draft')
    end
  end

  describe 'GET /api/v1/sales/email_templates/stats' do
    it 'returns count metrics' do
      get '/api/v1/sales/email_templates/stats', headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['total']).to eq(2)
      expect(json['active']).to eq(1)
      expect(json['draft']).to eq(1)
      expect(json['shared']).to eq(1)
    end
  end

  describe 'GET /api/v1/sales/email_templates/variables' do
    it 'returns variable groups' do
      get '/api/v1/sales/email_templates/variables', headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['groups']).to be_an(Array)
      expect(json['groups'].first['key']).to eq('person')
    end
  end

  describe 'GET /api/v1/sales/email_templates/categories' do
    it 'returns distinct categories' do
      get '/api/v1/sales/email_templates/categories', headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['categories']).to include('Follow-up', 'Prospecção')
    end
  end

  describe 'POST /api/v1/sales/email_templates/:id/duplicate' do
    it 'duplicates template into a draft' do
      post "/api/v1/sales/email_templates/#{template1.id}/duplicate", headers: auth_headers(user)

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json.dig('template', 'name')).to eq('Proposta Comercial (cópia)')
      expect(json.dig('template', 'status')).to eq('draft')
    end
  end

  describe 'POST /api/v1/sales/email_templates/:id/archive' do
    it 'archives the template' do
      post "/api/v1/sales/email_templates/#{template1.id}/archive", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json.dig('template', 'status')).to eq('archived')
    end
  end

  describe 'POST /api/v1/sales/email_templates/:id/test_send' do
    it 'renders and sends test email' do
      post "/api/v1/sales/email_templates/#{template1.id}/test_send",
           params: { to_email: 'teste@exemplo.com' },
           headers: auth_headers(user),
           as: :json

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['to_email']).to eq('teste@exemplo.com')
      expect(json.dig('rendered', 'subject')).to include('Sua proposta de energia solar')
    end
  end
end
