# frozen_string_literal: true

require 'rails_helper'

RSpec.describe JwtBlacklistService, 'redis-rb 5 boolean contract' do
  let(:jti) { SecureRandom.uuid }
  let(:token) do
    JWT.encode({ jti: jti, exp: 1.hour.from_now.to_i }, Rails.application.secret_key_base, 'HS256')
  end
  let(:redis) { instance_double(Redis) }

  before do
    # Exercise the Redis-backed branch even if the test environment has no Redis.
    allow(described_class).to receive(:redis_available?).and_return(true)
    stub_const('RedisHelper', double('RedisHelper'))
    allow(RedisHelper).to receive(:with_redis).and_yield(redis)
  end

  it 'recognizes a revoked token when Redis exists? returns true' do
    expect(redis).to receive(:exists?).with("#{described_class::REDIS_PREFIX}#{jti}").and_return(true)

    expect(described_class.revoked?(token)).to be(true)
  end

  it 'does not reject an unrevoked token when Redis exists? returns false' do
    expect(redis).to receive(:exists?).with("#{described_class::REDIS_PREFIX}#{jti}").and_return(false)

    expect(described_class.revoked?(token)).to be(false)
  end
end
