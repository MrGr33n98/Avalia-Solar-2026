# frozen_string_literal: true

require 'rails_helper'

RSpec.describe OutboundTokenService, type: :service do
  let(:company_id) { 42 }
  let(:source_context) { 'profile' }
  let(:outbound_click_id) { '550e8400-e29b-41d4-a716-446655440000' }

  describe '.encode' do
    it 'gera um token com formato payload.assinatura' do
      token = described_class.encode(
        company_id: company_id,
        source_context: source_context,
        outbound_click_id: outbound_click_id
      )

      expect(token).to be_a(String)
      parts = token.split('.')
      expect(parts.length).to eq(2)
      expect(parts[0]).to be_present
      expect(parts[1]).to match(/\A[0-9a-f]{64}\z/) # HMAC-SHA256 hex string tem 64 chars
    end

    it 'não expõe dados pessoais (PII) no token' do
      token = described_class.encode(
        company_id: company_id,
        source_context: source_context,
        outbound_click_id: outbound_click_id
      )

      payload = described_class.decode(token)
      expect(payload.keys).to contain_exactly(:cid, :src, :clk, :iat, :exp, :nonce)
      expect(payload[:cid]).to eq(42)
      expect(payload[:src]).to eq('profile')
      expect(payload[:clk]).to eq(outbound_click_id)
      expect(payload).not_to have_key(:email)
      expect(payload).not_to have_key(:ip)
      expect(payload).not_to have_key(:user_id)
      expect(payload).not_to have_key(:name)
    end
  end

  describe '.decode' do
    it 'decodifica token válido com sucesso' do
      token = described_class.encode(
        company_id: company_id,
        source_context: source_context,
        outbound_click_id: outbound_click_id
      )

      decoded = described_class.decode(token)
      expect(decoded).to be_present
      expect(decoded[:cid]).to eq(company_id)
      expect(decoded[:src]).to eq(source_context)
      expect(decoded[:clk]).to eq(outbound_click_id)
      expect(decoded[:exp]).to be > Time.current.to_i
    end

    it 'rejeita token com assinatura adulterada' do
      token = described_class.encode(
        company_id: company_id,
        source_context: source_context,
        outbound_click_id: outbound_click_id
      )

      payload, _sig = token.split('.')
      tampered_token = "#{payload}.0000000000000000000000000000000000000000000000000000000000000000"

      expect(described_class.decode(tampered_token)).to be_nil
      expect(described_class.valid?(tampered_token)).to be(false)
    end

    it 'rejeita token com payload alterado' do
      token = described_class.encode(
        company_id: company_id,
        source_context: source_context,
        outbound_click_id: outbound_click_id
      )

      _payload, sig = token.split('.')
      tampered_payload = Base64.urlsafe_encode64({ cid: 999 }.to_json, padding: false)
      tampered_token = "#{tampered_payload}.#{sig}"

      expect(described_class.decode(tampered_token)).to be_nil
      expect(described_class.valid?(tampered_token)).to be(false)
    end

    it 'rejeita token expirado' do
      token = described_class.encode(
        company_id: company_id,
        source_context: source_context,
        outbound_click_id: outbound_click_id,
        ttl: -10.seconds
      )

      expect(described_class.decode(token)).to be_nil
      expect(described_class.valid?(token)).to be(false)
    end

    it 'retorna nil para token em branco ou nulo' do
      expect(described_class.decode(nil)).to be_nil
      expect(described_class.decode('')).to be_nil
      expect(described_class.decode('token_invalido_sem_ponto')).to be_nil
    end
  end
end
