# frozen_string_literal: true

require 'rails_helper'
require 'openssl'
require 'base64'

RSpec.describe Sales::Messaging::SnsMessageVerifier do
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
  end

  def build_payload(cert_url:, type: 'Notification', topic: topic_arn)
    payload = {
      'Type' => type,
      'MessageId' => 'msg-123',
      'TopicArn' => topic,
      'Message' => '{"eventType":"delivery"}',
      'Timestamp' => Time.current.iso8601,
      'SignatureVersion' => '2',
      'SigningCertURL' => cert_url
    }
    canonical = "Message\n#{payload['Message']}\nMessageId\n#{payload['MessageId']}\nTimestamp\n#{payload['Timestamp']}\nTopicArn\n#{payload['TopicArn']}\nType\n#{payload['Type']}\n"
    signature = Base64.strict_encode64(key.sign(OpenSSL::Digest::SHA256.new, canonical.encode))
    payload['Signature'] = signature
    payload
  end

  context 'Host validation for certificate URI' do
    before do
      allow(Net::HTTP).to receive(:get).and_return(cert.to_pem)
    end

    it 'aceita sns.us-east-2.amazonaws.com' do
      payload = build_payload(cert_url: 'https://sns.us-east-2.amazonaws.com/SimpleNotificationService-123.pem')
      expect(described_class.verify!(payload)).to be true
    end

    it 'aceita sns.us-east-1.amazonaws.com' do
      payload = build_payload(cert_url: 'https://sns.us-east-1.amazonaws.com/SimpleNotificationService-456.pem')
      expect(described_class.verify!(payload)).to be true
    end

    it 'rejeita evil.amazonaws.com' do
      payload = build_payload(cert_url: 'https://evil.amazonaws.com/cert.pem')
      expect { described_class.verify!(payload) }.to raise_error(SecurityError, 'SNS certificado inválido')
    end

    it 'rejeita sns.us-east-2.amazonaws.com.evil.com' do
      payload = build_payload(cert_url: 'https://sns.us-east-2.amazonaws.com.evil.com/cert.pem')
      expect { described_class.verify!(payload) }.to raise_error(SecurityError, 'SNS certificado inválido')
    end

    it 'rejeita HTTP SigningCertURL' do
      payload = build_payload(cert_url: 'http://sns.us-east-2.amazonaws.com/cert.pem')
      expect { described_class.verify!(payload) }.to raise_error(SecurityError, 'SNS certificado inválido')
    end

    it 'rejeita URL não-.pem' do
      payload = build_payload(cert_url: 'https://sns.us-east-2.amazonaws.com/cert.crt')
      expect { described_class.verify!(payload) }.to raise_error(SecurityError, 'SNS certificado inválido')
    end
  end

  context 'Payload validation' do
    it 'rejeita envelope sem campos obrigatórios' do
      expect { described_class.verify!({ 'Type' => 'Notification' }) }.to raise_error(SecurityError, 'SNS payload inválido')
    end

    it 'rejeita tipo SNS desconhecido' do
      payload = { 'Type' => 'Unknown', 'MessageId' => 'id', 'Timestamp' => Time.current.iso8601, 'TopicArn' => topic_arn, 'SignatureVersion' => '1', 'Signature' => 'x', 'SigningCertURL' => 'https://sns.us-east-1.amazonaws.com/cert.pem' }
      expect { described_class.verify!(payload) }.to raise_error(SecurityError, 'SNS tipo inválido')
    end

    it 'rejeita tópico inválido' do
      allow(Net::HTTP).to receive(:get).and_return(cert.to_pem)
      payload = build_payload(cert_url: 'https://sns.us-east-2.amazonaws.com/cert.pem', topic: 'arn:aws:sns:us-east-2:000000000000:other-topic')
      expect { described_class.verify!(payload) }.to raise_error(SecurityError, 'SNS tópico inválido')
    end
  end
end
