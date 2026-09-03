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
      payload['Message'] = message || '{"eventType":"delivery","mail":{"messageId":"ses-msg-1"}}'
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

    context 'Valid Notification' do
      it 'processa notificação válida com sucesso e idempotência para evento duplicado' do
        payload = build_payload(message: '{"eventType":"delivery","mail":{"messageId":"ses-msg-999"}}')

        post '/api/v1/sales/ses_webhooks', params: payload.to_json, headers: { 'CONTENT_TYPE' => 'application/json' }
        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)).to eq({ 'status' => 'success' })

        # Envio duplicado (idempotência)
        post '/api/v1/sales/ses_webhooks', params: payload.to_json, headers: { 'CONTENT_TYPE' => 'application/json' }
        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)).to eq({ 'status' => 'success' })
      end
    end
  end
end
