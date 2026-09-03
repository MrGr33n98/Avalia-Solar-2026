# frozen_string_literal: true

require 'rails_helper'
require 'openssl'
require 'base64'

RSpec.describe 'POST /api/v1/sales/ses_webhooks', type: :request do
  let(:topic_arn) { 'arn:aws:sns:us-east-2:431636668039:avalia-solar-ses-events' }
  let(:key) { OpenSSL::PKey::RSA.generate(2048) }
  let(:cert) do
    c = OpenSSL::X509::Certificate.new
    c.version = 2
    c.serial = 1
    c.subject = OpenSSL::X509::Name.parse('/CN=sns.us-east-2.amazonaws.com')
    c.issuer = c.subject
    c.public_key = key.public_key
    c.not_before = Time.now - 3600
    c.not_after = Time.now + 3600
    c.sign(key, OpenSSL::Digest::SHA256.new)
    c
  end

  let(:company) do
    Company.new(name: 'Empresa Teste', slug: 'empresa-teste-1').tap { |c| c.save!(validate: false) }
  end
  let(:user) do
    User.new(
      name: 'Vendedor Teste',
      email: 'vendedor@avaliasolar.com.br',
      password: 'Password123!',
      role: 'admin',
      company_id: company.id,
      terms_accepted: true
    ).tap { |u| u.save!(validate: false) }
  end
  let(:account) { Sales::Account.create!(company_id: company.id, name: 'Conta Teste', owner: user) }
  let(:contact) { Sales::Contact.create!(account: account, first_name: 'João', last_name: 'Silva', email: 'joao@cliente.com') }
  let(:thread) do
    Sales::EmailThread.create!(
      company_id: company.id,
      sales_account_id: account.id,
      sales_contact_id: contact.id,
      subject_normalized: 'teste ses webhook',
      first_message_at: Time.current,
      last_message_at: Time.current
    )
  end
  let(:email_message) do
    Sales::EmailMessage.create!(
      company_id: company.id,
      sales_email_thread_id: thread.id,
      sales_account_id: account.id,
      sales_contact_id: contact.id,
      sender_user_id: user.id,
      from_email: user.email,
      to_email: contact.email,
      subject: 'Teste SES Webhook',
      body_text: 'Mensagem de teste',
      status: 'sent',
      provider_message_id: 'ses-msg-999'
    )
  end

  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with('AWS_SNS_TOPIC_ARN').and_return(topic_arn)
    allow(Net::HTTP).to receive(:get).and_return(cert.to_pem)
  end

  def build_payload(type: 'Notification', topic: topic_arn, cert_url: 'https://sns.us-east-2.amazonaws.com/cert.pem', message: nil, subscribe_url: nil, token: nil)
    payload = {
      'Type' => type,
      'MessageId' => 'msg-123',
      'TopicArn' => topic,
      'Timestamp' => Time.current.iso8601,
      'SignatureVersion' => '2',
      'SigningCertURL' => cert_url
    }

    if type == 'SubscriptionConfirmation'
      payload['SubscribeURL'] = subscribe_url || 'https://sns.us-east-2.amazonaws.com/?Action=ConfirmSubscription&TopicArn=arn:aws:sns:us-east-2:431636668039:avalia-solar-ses-events&Token=123'
      payload['Token'] = token || 'token-123'
      payload['Message'] = message || 'Subscription confirmed'
      canonical = "Message\n#{payload['Message']}\nMessageId\n#{payload['MessageId']}\nSubscribeURL\n#{payload['SubscribeURL']}\nTimestamp\n#{payload['Timestamp']}\nToken\n#{payload['Token']}\nTopicArn\n#{payload['TopicArn']}\nType\n#{payload['Type']}\n"
    else
      payload['Message'] = message || '{"eventType":"delivery","mail":{"messageId":"ses-msg-999"}}'
      canonical = "Message\n#{payload['Message']}\nMessageId\n#{payload['MessageId']}\nTimestamp\n#{payload['Timestamp']}\nTopicArn\n#{payload['TopicArn']}\nType\n#{payload['Type']}\n"
    end

    signature = Base64.strict_encode64(key.sign(OpenSSL::Digest::SHA256.new, canonical.encode))
    payload['Signature'] = signature
    payload
  end

  describe 'POST /api/v1/sales/ses_webhooks' do
    context 'SubscriptionConfirmation' do
      it 'confirma assinatura com sucesso e retorna 200' do
        subscribe_url = 'https://sns.us-east-2.amazonaws.com/?Action=ConfirmSubscription&TopicArn=arn:aws:sns:us-east-2:431636668039:avalia-solar-ses-events&Token=123'
        http_double = instance_double(Net::HTTP)
        response_double = instance_double(Net::HTTPSuccess)

        allow(Net::HTTP).to receive(:start).with('sns.us-east-2.amazonaws.com', 443, use_ssl: true, open_timeout: 5, read_timeout: 5).and_yield(http_double)
        allow(http_double).to receive(:get).and_return(response_double)
        allow(response_double).to receive(:is_a?).with(Net::HTTPSuccess).and_return(true)

        payload = build_payload(type: 'SubscriptionConfirmation', subscribe_url: subscribe_url)

        post '/api/v1/sales/ses_webhooks', params: payload.to_json, headers: { 'CONTENT_TYPE' => 'application/json' }

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)).to eq({ 'status' => 'subscription_confirmed' })
      end
    end

    context 'Invalid requests' do
      it 'retorna 401 para tópico ARN inválido' do
        payload = build_payload(topic: 'arn:aws:sns:us-east-2:000000000000:invalid-topic')

        post '/api/v1/sales/ses_webhooks', params: payload.to_json, headers: { 'CONTENT_TYPE' => 'application/json' }

        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)).to eq({ 'error' => 'Unauthorized webhook request' })
      end

      it 'retorna 401 para certificado inválido' do
        payload = build_payload(cert_url: 'https://evil.amazonaws.com/cert.pem')

        post '/api/v1/sales/ses_webhooks', params: payload.to_json, headers: { 'CONTENT_TYPE' => 'application/json' }

        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)).to eq({ 'error' => 'Unauthorized webhook request' })
      end

      it 'retorna 400 para JSON malformado' do
        post '/api/v1/sales/ses_webhooks', params: '{invalid_json', headers: { 'CONTENT_TYPE' => 'application/json' }

        expect(response).to have_http_status(:bad_request)
        expect(JSON.parse(response.body)).to eq({ 'error' => 'Malformed webhook payload' })
      end
    end

    context 'Normalização de Eventos SES' do
      before { email_message }

      it 'ignora evento Send sem criar EmailEvent e sem virar delivery_delay' do
        payload = build_payload(message: '{"eventType":"Send","mail":{"messageId":"ses-msg-999"}}')

        expect {
          post '/api/v1/sales/ses_webhooks', params: payload.to_json, headers: { 'CONTENT_TYPE' => 'application/json' }
        }.not_to change(Sales::EmailEvent, :count)

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)).to eq({ 'status' => 'success' })
        expect(email_message.reload.status).to eq('sent')
      end

      it 'normaliza evento Delivery para delivered e atualiza o status do e-mail' do
        payload = build_payload(message: '{"eventType":"Delivery","mail":{"messageId":"ses-msg-999"}}')

        expect {
          post '/api/v1/sales/ses_webhooks', params: payload.to_json, headers: { 'CONTENT_TYPE' => 'application/json' }
        }.to change(Sales::EmailEvent, :count).by(1)

        expect(response).to have_http_status(:ok)
        event = Sales::EmailEvent.last
        expect(event.event_type).to eq('delivered')
        expect(event.provider_event_id).to eq('ses-ses-msg-999-delivered')
        expect(email_message.reload.status).to eq('delivered')
      end

      it 'normaliza evento DeliveryDelay para delivery_delay' do
        payload = build_payload(message: '{"eventType":"DeliveryDelay","mail":{"messageId":"ses-msg-999"}}')

        expect {
          post '/api/v1/sales/ses_webhooks', params: payload.to_json, headers: { 'CONTENT_TYPE' => 'application/json' }
        }.to change(Sales::EmailEvent, :count).by(1)

        expect(response).to have_http_status(:ok)
        event = Sales::EmailEvent.last
        expect(event.event_type).to eq('delivery_delay')
      end

      it 'normaliza evento Bounce para bounce e atualiza o status para bounced' do
        payload = build_payload(message: '{"eventType":"Bounce","mail":{"messageId":"ses-msg-999"}}')

        expect {
          post '/api/v1/sales/ses_webhooks', params: payload.to_json, headers: { 'CONTENT_TYPE' => 'application/json' }
        }.to change(Sales::EmailEvent, :count).by(1)

        expect(response).to have_http_status(:ok)
        event = Sales::EmailEvent.last
        expect(event.event_type).to eq('bounce')
        expect(email_message.reload.status).to eq('bounced')
      end

      it 'normaliza evento Complaint para complaint' do
        payload = build_payload(message: '{"eventType":"Complaint","mail":{"messageId":"ses-msg-999"}}')

        expect {
          post '/api/v1/sales/ses_webhooks', params: payload.to_json, headers: { 'CONTENT_TYPE' => 'application/json' }
        }.to change(Sales::EmailEvent, :count).by(1)

        expect(response).to have_http_status(:ok)
        event = Sales::EmailEvent.last
        expect(event.event_type).to eq('complaint')
      end

      it 'normaliza evento Reject para reject' do
        payload = build_payload(message: '{"eventType":"Reject","mail":{"messageId":"ses-msg-999"}}')

        expect {
          post '/api/v1/sales/ses_webhooks', params: payload.to_json, headers: { 'CONTENT_TYPE' => 'application/json' }
        }.to change(Sales::EmailEvent, :count).by(1)

        expect(response).to have_http_status(:ok)
        event = Sales::EmailEvent.last
        expect(event.event_type).to eq('reject')
      end

      it 'ignora eventos desconhecidos sem criar evento nem alterar para delivery_delay' do
        payload = build_payload(message: '{"eventType":"CustomUnknownType","mail":{"messageId":"ses-msg-999"}}')

        expect {
          post '/api/v1/sales/ses_webhooks', params: payload.to_json, headers: { 'CONTENT_TYPE' => 'application/json' }
        }.not_to change(Sales::EmailEvent, :count)

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)).to eq({ 'status' => 'success' })
      end

      it 'garante idempotência para notificações repetidas com o mesmo provider_event_id' do
        payload = build_payload(message: '{"eventType":"Delivery","mail":{"messageId":"ses-msg-999"}}')

        expect {
          post '/api/v1/sales/ses_webhooks', params: payload.to_json, headers: { 'CONTENT_TYPE' => 'application/json' }
        }.to change(Sales::EmailEvent, :count).by(1)

        expect {
          post '/api/v1/sales/ses_webhooks', params: payload.to_json, headers: { 'CONTENT_TYPE' => 'application/json' }
        }.not_to change(Sales::EmailEvent, :count)

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)).to eq({ 'status' => 'success' })
      end
    end
  end
end
