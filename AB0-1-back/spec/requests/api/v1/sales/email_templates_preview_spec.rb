# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Sales email template preview API', type: :request do
  let!(:company) { create(:company) }
  let!(:other_company) { create(:company) }
  let!(:user) { create(:user, company: company) }
  let!(:other_user) { create(:user, company: other_company) }
  let!(:template) do
    ::Sales::EmailTemplate.create!(company: company, name: 'Oferta', subject_template: 'Olá', body_html: '<p>Oi</p>')
  end
  let!(:other_template) do
    ::Sales::EmailTemplate.create!(company: other_company, name: 'Outro', subject_template: 'Olá', body_html: '<p>Oi</p>')
  end

  def auth_headers(account)
    token = JWT.encode({ user_id: account.id, typ: 'access', exp: 1.day.from_now.to_i }, Rails.application.secret_key_base, 'HS256')
    { 'Authorization' => "Bearer #{token}" }
  end

  it 'returns a rendered preview for a valid template' do
    post "/api/v1/sales/email_templates/#{template.id}/preview", headers: auth_headers(user)

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).dig('preview', 'subject')).to eq('Olá')
  end

  it 'accepts the frontend preview payload with an empty context' do
    post "/api/v1/sales/email_templates/#{template.id}/preview",
         params: { context: {} },
         headers: auth_headers(user),
         as: :json

    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).dig('preview', 'subject')).to eq('Olá')
  end

  it 'previews unsaved draft changes for an existing template through backend without persisting' do
    post "/api/v1/sales/email_templates/#{template.id}/preview",
         params: {
           draft: {
             subject_template: 'Assunto do Draft Não Salvo',
             body_html: '<p>Olá {{person.first_name}}, bem-vindo à {{company.name}}!</p>'
           }
         },
         headers: auth_headers(user),
         as: :json

    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    expect(json.dig('preview', 'subject')).to eq('Assunto do Draft Não Salvo')
    expect(json.dig('preview', 'body_html')).to include('Maria')
    expect(json.dig('preview', 'body_html')).to include('Solaris Energia')

    # Confirm original template in DB remains unchanged
    expect(template.reload.subject_template).to eq('Olá')
    expect(template.body_html).to eq('<p>Oi</p>')
  end

  it 'previews a new unsaved template draft via collection endpoint without template ID' do
    post '/api/v1/sales/email_templates/preview',
         params: {
           draft: {
             subject_template: 'Template Totalmente Novo',
             body_html: '<p>Novo template {{person.first_name}}</p>'
           }
         },
         headers: auth_headers(user),
         as: :json

    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    expect(json.dig('preview', 'subject')).to eq('Template Totalmente Novo')
    expect(json.dig('preview', 'body_html')).to include('Maria')
  end

  it 'sanitizes malicious script in draft payload' do
    post "/api/v1/sales/email_templates/#{template.id}/preview",
         params: {
           draft: {
             subject_template: 'Teste Sanitizer',
             body_html: '<script>alert(1)</script><p>Conteúdo seguro</p>'
           }
         },
         headers: auth_headers(user),
         as: :json

    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    expect(json.dig('preview', 'body_html')).not_to include('<script>')
    expect(json.dig('preview', 'body_html')).not_to include('alert(1)')
    expect(json.dig('preview', 'body_html')).to include('Conteúdo seguro')
  end

  it 'returns TEMPLATE_PREVIEW_INVALID when renderer rejects input' do
    allow(::Sales::Messaging::Renderer).to receive(:render).and_raise(
      ::Sales::Messaging::Renderer::EmailRenderError, 'Corpo inválido'
    )

    post "/api/v1/sales/email_templates/#{template.id}/preview", headers: auth_headers(user)

    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body)['code']).to eq('TEMPLATE_PREVIEW_INVALID')
    expect(JSON.parse(response.body)['message']).to eq('Corpo inválido')
  end

  it 'does not preview a template belonging to another tenant' do
    post "/api/v1/sales/email_templates/#{other_template.id}/preview", headers: auth_headers(user)

    expect(response).to have_http_status(:not_found)
  end
end
