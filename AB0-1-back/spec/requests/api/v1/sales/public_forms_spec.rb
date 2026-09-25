# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Sales public forms', type: :request do
  let!(:company) { create(:company) }
  let!(:form) do
    Sales::Form.create!(company: company, name: 'Pedido de orçamento', slug: 'orcamento-publico',
                        fields: [{ key: 'name', required: true }, { key: 'email', required: true }])
  end
  let(:endpoint) { "/api/v1/sales/forms/#{form.public_key}" }
  let(:submission_endpoint) { "#{endpoint}/submit" }

  it 'expõe chave opaca e os campos configurados sem expor id interno' do
    get endpoint

    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body).fetch('form')
    expect(json['public_key']).to eq(form.public_key)
    expect(json).not_to have_key('id')
    expect(json.fetch('fields')).to eq([{ 'key' => 'name', 'required' => true },
                                        { 'key' => 'email', 'required' => true }])
  end

  it 'salva somente campos configurados e deduplica a mesma chave idempotente' do
    headers = { 'Idempotency-Key' => SecureRandom.uuid }
    payload = { submission: { name: 'Prospect sintético', email: 'prospect@example.test' } }

    expect do
      2.times { post submission_endpoint, params: payload, headers: headers, as: :json }
    end.to change(Sales::FormSubmission, :count).by(1)

    expect(response).to have_http_status(:accepted), response.body
    saved = Sales::FormSubmission.last
    expect(saved.form_id).to eq(form.id)
    expect(saved.campaign_id).to be_nil
    expect(saved.payload).to eq('name' => 'Prospect sintético', 'email' => 'prospect@example.test')
  end

  it 'rejeita IDs internos ou campos fora do formulário' do
    post submission_endpoint,
         params: { submission: { name: 'Nome', email: 'prospect@example.test', contact_id: 123 } },
         as: :json

    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body).dig('error', 'code')).to eq('FORM_SUBMISSION_INVALID')
    expect(Sales::FormSubmission.count).to eq(0)
  end

  it 'rejeita conteúdo acima do limite' do
    post submission_endpoint,
         params: { submission: { name: 'N' * 17_000 } },
         as: :json

    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body).dig('error', 'code')).to eq('FORM_PAYLOAD_TOO_LARGE')
  end

  it 'não abre form sem tenant associado' do
    form.update_column(:company_id, nil)

    get endpoint

    expect(response).to have_http_status(:not_found)
  end
end
