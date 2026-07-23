# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Recommendation::ContextBuilder do
  describe '.call' do
    it 'prioritizes explicit parameters over other sources' do
      context = described_class.call(params: { city: 'Florianópolis', state: 'SC' })

      expect(context.city).to eq('Florianópolis')
      expect(context.state).to eq('SC')
      expect(context.location_source).to eq(:explicit_param)
      expect(context.local?).to be true
    end

    it 'falls back to cookie when explicit params are missing' do
      request = double('Request', cookies: { 'user_city' => 'Curitiba', 'user_state' => 'PR' })
      context = described_class.call(request: request)

      expect(context.city).to eq('Curitiba')
      expect(context.state).to eq('PR')
      expect(context.location_source).to eq(:cookie)
    end

    it 'uses fallback_national when no location info is provided' do
      context = described_class.call(params: {})

      expect(context.location_source).to eq(:fallback_national)
      expect(context.national?).to be true
    end
  end
end
