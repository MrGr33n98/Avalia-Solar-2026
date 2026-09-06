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
