# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::Messaging::SnsMessageVerifier do
  it 'rejeita envelope sem campos obrigatórios' do
    expect { described_class.verify!({ 'Type' => 'Notification' }) }.to raise_error(SecurityError)
  end

  it 'rejeita tipo SNS desconhecido' do
    payload = { 'Type' => 'Unknown', 'MessageId' => 'id', 'Timestamp' => Time.current.iso8601, 'TopicArn' => 'arn', 'SignatureVersion' => '1', 'Signature' => 'x', 'SigningCertURL' => 'https://sns.us-east-1.amazonaws.com/cert.pem' }
    expect { described_class.verify!(payload) }.to raise_error(SecurityError)
  end
end
