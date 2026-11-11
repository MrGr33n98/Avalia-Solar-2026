# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::CircuitBreaker do
  before do
    allow(Rails).to receive(:cache).and_return(ActiveSupport::Cache::MemoryStore.new)
  end

  it 'abre após falhas consecutivas' do
    5.times { described_class.failure!(provider: 'test') }
    expect(described_class.allow?(provider: 'test')).to be(false)
  end

  it 'fecha após sucesso' do
    described_class.failure!(provider: 'test')
    described_class.success!(provider: 'test')
    expect(described_class.allow?(provider: 'test')).to be(true)
  end
end
