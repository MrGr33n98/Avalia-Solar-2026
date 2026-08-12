# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::LlmCostCalculator do
  it 'calcula custo de entrada e saída por milhão de tokens' do
    expect(described_class.call(provider: 'openai', model: 'gpt-test', input_tokens: 1_000_000, output_tokens: 1_000_000)).to eq(0.75)
  end
end
