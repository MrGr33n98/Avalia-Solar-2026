# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mcp::RemoteQuotaPolicy do
  let(:redis) { double('Redis', call: 1) }
  let(:policy) do
    described_class.new(
      identity: 'member-one@example.invalid',
      client_id: 'oauth-client-one',
      remote_ip: '198.51.100.18',
      mode: :oauth
    )
  end

  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with('MCP_REMOTE_POLICY_ENABLED').and_return('true')
    allow(Sidekiq).to receive(:redis).and_yield(redis)
  end

  it 'uses Redis atomic EVAL for client, identity, IP and daily limits' do
    expect(redis).to receive(:call).with('EVAL', described_class::SCRIPT, 1,
                                        a_string_starting_with('mcp:quota:v1:oauth:identity:'), 1, 120).and_return(1)
    expect(redis).to receive(:call).with('EVAL', described_class::SCRIPT, 1,
                                        a_string_starting_with('mcp:quota:v1:oauth:client:'), 1, 120).and_return(1)
    expect(redis).to receive(:call).with('EVAL', described_class::SCRIPT, 1,
                                        a_string_starting_with('mcp:quota:v1:oauth:ip:'), 1, 120).and_return(1)
    expect(redis).to receive(:call).with('EVAL', described_class::SCRIPT, 1,
                                        a_string_starting_with('mcp:quota:v1:oauth:day:'), 1, 90_000).and_return(1)

    expect(policy.enforce!).to be(true)
  end

  it 'never places identities, client IDs or IPs verbatim in Redis keys' do
    keys = []
    allow(redis).to receive(:call) do |*args|
      keys << args[3]
      1
    end

    expect(policy.enforce!).to be(true)
    expect(keys).to have_attributes(length: 4)
    expect(keys.join).not_to include('member-one', 'oauth-client-one', '198.51.100.18')
  end

  it 'rejects requests over the identity quota with retry guidance' do
    allow(redis).to receive(:call).and_return(31)
    expect { policy.enforce! }.to raise_error(described_class::Failure) do |error|
      expect(error.type).to eq(:rate_limited)
      expect(error.retry_after).to eq(60)
    end
  end

  it 'fails closed when Redis cannot count a request' do
    allow(redis).to receive(:call).and_raise(IOError)
    expect { policy.enforce! }.to raise_error(described_class::Failure) do |error|
      expect(error.type).to eq(:unavailable)
    end
  end

  it 'fails closed for missing or oversized caller identities' do
    [nil, '', 'x' * 257].each do |identity|
      unsafe = described_class.new(
        identity: identity, client_id: 'client', remote_ip: '198.51.100.1', mode: :oauth
      )
      expect { unsafe.enforce! }.to raise_error(described_class::Failure, 'unavailable')
    end
  end

  it 'fails closed when policy is not explicitly enabled' do
    allow(ENV).to receive(:[]).with('MCP_REMOTE_POLICY_ENABLED').and_return(nil)
    expect { policy.enforce! }.to raise_error(described_class::Failure, 'unavailable')
  end

  it 'rejects unsupported modes instead of silently using a default policy' do
    unsafe = described_class.new(identity: 'x', client_id: 'y', remote_ip: '198.51.100.1', mode: :admin)
    expect { unsafe.enforce! }.to raise_error(described_class::Failure, 'unavailable')
  end
end
