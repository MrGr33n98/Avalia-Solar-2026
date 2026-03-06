# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Webhooks::SecurityService do
  let(:provider) { 'mock' }
  let(:payload) { '{"checkout_session_id":"test-123","status":"paid"}' }
  let(:secret) { 'test_secret_key_for_development_only' }
  let(:valid_signature) { OpenSSL::HMAC.hexdigest('SHA256', secret, payload) }
  let(:current_timestamp) { Time.current.to_i.to_s }

  describe '#verify!' do
    context 'with valid HMAC signature' do
      it 'returns true for mock provider' do
        service = described_class.new(
          provider: 'mock',
          payload: payload,
          signature: valid_signature
        )

        expect(service.verify!).to be true
      end

      it 'accepts valid timestamp within tolerance' do
        service = described_class.new(
          provider: 'mock',
          payload: payload,
          signature: valid_signature,
          timestamp: current_timestamp
        )

        expect(service.verify!).to be true
      end
    end

    context 'with invalid signature' do
      it 'raises InvalidSignatureError' do
        service = described_class.new(
          provider: 'mock',
          payload: payload,
          signature: 'invalid_signature_hash'
        )

        expect { service.verify! }.to raise_error(
          Webhooks::SecurityService::InvalidSignatureError,
          /Invalid HMAC signature/
        )
      end
    end

    context 'with expired timestamp' do
      it 'raises TimestampExpiredError for old timestamp' do
        old_timestamp = (Time.current - 10.minutes).to_i.to_s
        
        service = described_class.new(
          provider: 'mock',
          payload: payload,
          signature: valid_signature,
          timestamp: old_timestamp
        )

        expect { service.verify! }.to raise_error(
          Webhooks::SecurityService::TimestampExpiredError,
          /Timestamp outside tolerance/
        )
      end

      it 'raises TimestampExpiredError for future timestamp' do
        future_timestamp = (Time.current + 10.minutes).to_i.to_s
        
        service = described_class.new(
          provider: 'mock',
          payload: payload,
          signature: valid_signature,
          timestamp: future_timestamp
        )

        expect { service.verify! }.to raise_error(
          Webhooks::SecurityService::TimestampExpiredError
        )
      end
    end

    context 'with missing secret' do
      it 'raises MissingSecretError when ENV secret not set' do
        allow(ENV).to receive(:[]).with('STRIPE_WEBHOOK_SECRET').and_return(nil)
        
        service = described_class.new(
          provider: 'stripe',
          payload: payload,
          signature: 'any_signature'
        )

        expect { service.verify! }.to raise_error(
          Webhooks::SecurityService::MissingSecretError,
          /STRIPE_WEBHOOK_SECRET not configured/
        )
      end
    end

    context 'with unknown provider' do
      it 'raises InvalidSignatureError' do
        service = described_class.new(
          provider: 'unknown_provider',
          payload: payload,
          signature: valid_signature
        )

        expect { service.verify! }.to raise_error(
          Webhooks::SecurityService::InvalidSignatureError,
          /Unknown provider/
        )
      end
    end
  end

  describe 'logging' do
    it 'logs success on verification' do
      allow(Rails.logger).to receive(:info)

      service = described_class.new(
        provider: 'mock',
        payload: payload,
        signature: valid_signature
      )

      service.verify!

      expect(Rails.logger).to have_received(:info).with(
        /{.*"event":"webhook_verified".*"provider":"mock".*/
      )
    end

    it 'logs failure on invalid signature' do
      allow(Rails.logger).to receive(:warn)

      service = described_class.new(
        provider: 'mock',
        payload: payload,
        signature: 'invalid'
      )

      expect { service.verify! }.to raise_error(Webhooks::SecurityService::InvalidSignatureError)

      expect(Rails.logger).to have_received(:warn).with(
        /{.*"event":"webhook_verification_failed".*/
      )
    end
  end
end
