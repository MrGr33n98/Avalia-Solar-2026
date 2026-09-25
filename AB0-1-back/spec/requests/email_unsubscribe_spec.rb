# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Email unsubscribe', type: :request do
  let!(:company) { create(:company) }
  let!(:user) { create(:user, company: company) }
  let!(:message) do
    Sales::EmailMessage.create!(company: company, sender_user: user, from_email: 'vendas@example.test',
                                to_email: 'prospect@example.test', subject: 'Mensagem sintética')
  end
  let(:token) { Sales::Messaging::UnsubscribeToken.generate(message) }
  let(:path) { "/t/email/unsubscribe/#{token}" }

  it 'GET exibe confirmação e não altera preferências' do
    get path

    expect(response).to have_http_status(:ok)
    expect(response.body).to include('Cancelar inscrição')
    expect(Sales::EmailSuppression.exists?(company: company, email: message.to_email)).to be(false)
  end

  it 'POST cancela de forma idempotente e cria suppression no tenant correto' do
    2.times { post path }

    expect(response).to have_http_status(:no_content)
    expect(Sales::EmailSuppression.where(company: company, email: message.to_email,
                                         reason: 'unsubscribe').count).to eq(1)
  end

  it 'rejeita token adulterado' do
    get "/t/email/unsubscribe/#{token}forged"

    expect(response).to have_http_status(:not_found)
    expect(Sales::EmailSuppression.exists?(company: company, email: message.to_email)).to be(false)
  end
end
