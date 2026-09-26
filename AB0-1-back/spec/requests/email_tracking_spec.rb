# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Email pixel tracking', type: :request do
  let!(:company) { create(:company) }
  let!(:user) { create(:user, company: company) }
  let!(:message) do
    Sales::EmailMessage.create!(company: company, sender_user: user, from_email: 'vendas@example.test',
                                to_email: 'prospect@example.test', subject: 'Mensagem sintética',
                                open_tracking_enabled: true)
  end

  it 'registra e classifica o sinal com resposta GIF sem cache' do
    get "/t/email/open/#{message.tracking_token}.gif", headers: { 'User-Agent' => 'GoogleImageProxy' }

    expect(response).to have_http_status(:ok)
    expect(response.media_type).to eq('image/gif')
    expect(response.headers['Cache-Control']).to include('no-store')
    expect(response.headers['Pragma']).to eq('no-cache')
    expect(response.headers['Expires']).to eq('0')
    event = message.events.find_by!(event_type: 'open_signal')
    expect(event.source).to eq('avalia_pixel')
    expect(event.signal_class).to eq('proxy')
    expect(event.classification_reasons).to eq(['google_image_proxy'])
    expect(event.payload).not_to include('ip', 'user_agent')
    expect(message.reload.raw_open_signals).to eq(1)
    expect(message.unique_open_signals).to eq(1)
  end

  it 'responde pixel seguro sem registrar token inexistente ou tracking desativado' do
    get '/t/email/open/token-inexistente.gif'
    expect(response).to have_http_status(:ok)
    expect(Sales::EmailEvent.count).to eq(0)

    message.update!(open_tracking_enabled: false)
    get "/t/email/open/#{message.tracking_token}.gif"
    expect(response).to have_http_status(:ok)
    expect(message.events.where(event_type: 'open_signal')).to be_empty
  end
end
