# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mcp::CanonicalPayloadService do
  describe '.build_canonical_payload' do
    it 'normaliza e ordena recursivamente as chaves' do
      args = {
        'z' => 10,
        'a' => { 'beta' => 'B', 'alpha' => 'A' },
        'arr' => [{ 'k2' => 2, 'k1' => 1 }]
      }

      payload = described_class.build_canonical_payload(
        agent_id: 'agent:hermes:outbound',
        tool_name: 'search_companies',
        risk_tier: 'r1',
        arguments: args,
        requester_user_id: 42,
        tenant_id: 100
      )

      expect(payload['version']).to eq(1)
      expect(payload['agent_id']).to eq('agent:hermes:outbound')
      expect(payload['requester_user_id']).to eq(42)
      expect(payload['tenant_id']).to eq(100)
      expect(payload['tool_name']).to eq('search_companies')
      expect(payload['risk_tier']).to eq('r1')
      expect(payload['arguments']['a'].keys).to eq(%w[alpha beta])
      expect(payload['arguments']['arr'].first.keys).to eq(%w[k1 k2])
    end
  end

  describe '.generate_digest' do
    it 'produz exatamente o mesmo SHA-256 independentemente da ordem original das chaves' do
      args1 = { b: 2, a: 1, nested: { y: 'Y', x: 'X' } }
      args2 = { 'a' => 1, 'b' => 2, 'nested' => { 'x' => 'X', 'y' => 'Y' } }

      digest1 = described_class.generate_digest(
        agent_id: 'agent:hermes:outbound',
        tool_name: 'search_companies',
        risk_tier: 'r1',
        arguments: args1,
        requester_user_id: 1,
        tenant_id: 10
      )

      digest2 = described_class.generate_digest(
        agent_id: 'agent:hermes:outbound',
        tool_name: 'search_companies',
        risk_tier: 'r1',
        arguments: args2,
        requester_user_id: 1,
        tenant_id: 10
      )

      expect(digest1).to eq(digest2)
      expect(digest1).to match(/\A[a-f0-9]{64}\z/)
    end

    it 'altera o digest se qualquer argumento sofrer adulteração (Anti-Tampering)' do
      digest_original = described_class.generate_digest(
        agent_id: 'agent:hermes:outbound',
        tool_name: 'send_outbound_campaign',
        risk_tier: 'r3',
        arguments: { 'recipients' => 10, 'template' => 'A' }
      )

      digest_tampered = described_class.generate_digest(
        agent_id: 'agent:hermes:outbound',
        tool_name: 'send_outbound_campaign',
        risk_tier: 'r3',
        arguments: { 'recipients' => 10_000, 'template' => 'B' }
      )

      expect(digest_original).not_to eq(digest_tampered)
    end

    it 'altera o digest se o tenant sofrer adulteração' do
      d1 = described_class.generate_digest(agent_id: 'a1', tool_name: 't1', risk_tier: 'r1', tenant_id: 1)
      d2 = described_class.generate_digest(agent_id: 'a1', tool_name: 't1', risk_tier: 'r1', tenant_id: 2)

      expect(d1).not_to eq(d2)
    end

    it 'altera o digest se o solicitante sofrer adulteração' do
      d1 = described_class.generate_digest(agent_id: 'a1', tool_name: 't1', risk_tier: 'r1', requester_user_id: 1)
      d2 = described_class.generate_digest(agent_id: 'a1', tool_name: 't1', risk_tier: 'r1', requester_user_id: 2)

      expect(d1).not_to eq(d2)
    end

    it 'altera o digest se o agent_id sofrer adulteração' do
      d1 = described_class.generate_digest(agent_id: 'agent_a', tool_name: 't1', risk_tier: 'r1')
      d2 = described_class.generate_digest(agent_id: 'agent_b', tool_name: 't1', risk_tier: 'r1')

      expect(d1).not_to eq(d2)
    end

    it 'rejeita tipos não serializáveis' do
      unserializable = Object.new
      def unserializable.as_json(_opt = nil)
        self
      end

      expect do
        described_class.generate_digest(
          agent_id: 'a1',
          tool_name: 't1',
          risk_tier: 'r1',
          arguments: { bad: unserializable }
        )
      end.to raise_error(Mcp::Error) do |error|
        expect(error.code).to eq('invalid_payload_type')
      end
    end
  end

  describe '.secure_verify?' do
    it 'retorna true para digest idêntico e false para divergência' do
      digest = described_class.generate_digest(
        agent_id: 'agent:engineering:primary',
        tool_name: 'diagnose_performance',
        risk_tier: 'r0',
        arguments: { 'period' => '24h' }
      )

      valid = described_class.secure_verify?(
        expected_digest: digest,
        agent_id: 'agent:engineering:primary',
        tool_name: 'diagnose_performance',
        risk_tier: 'r0',
        arguments: { 'period' => '24h' }
      )
      expect(valid).to be true

      invalid = described_class.secure_verify?(
        expected_digest: digest,
        agent_id: 'agent:engineering:primary',
        tool_name: 'diagnose_performance',
        risk_tier: 'r0',
        arguments: { 'period' => '7d' }
      )
      expect(invalid).to be false
    end
  end
end
