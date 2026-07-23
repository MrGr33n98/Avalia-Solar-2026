# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Recommendation::Engine do
  let!(:company1) do
    create(
      :company,
      status: 'active',
      moderation_status: 'approved',
      segment: 'installer',
      state: 'SC',
      city: 'Florianópolis',
      verified: true,
      rating_avg: 4.8,
      rating_count: 20
    )
  end

  let!(:company2) do
    create(
      :company,
      status: 'active',
      moderation_status: 'approved',
      segment: 'installer',
      state: 'SP',
      city: 'São Paulo',
      verified: false,
      rating_avg: 4.0,
      rating_count: 5
    )
  end

  describe '.call' do
    it 'returns ranked recommendation results sorted by organic score' do
      context = Recommendation::Context.new(city: 'Florianópolis', state: 'SC')
      results = described_class.call(context: context, limit: 10)

      expect(results).not_to be_empty
      expect(results.first.company).to eq(company1)
      expect(results.first.organic_score).to be > results.last.organic_score
      expect(results.first.primary_cta[:label]).to eq('Solicitar orçamento')
    end

    it 'inserts active sponsored placements at top slots' do
      placement = create(
        :recommendation_placement,
        company: company2,
        placement_type: 'sponsored',
        state_code: 'SC',
        slot_position: 1,
        starts_at: 1.day.ago,
        ends_at: 1.day.from_now
      )

      context = Recommendation::Context.new(city: 'Florianópolis', state: 'SC')
      results = described_class.call(context: context, limit: 10)

      expect(results.first.company).to eq(company2)
      expect(results.first.sponsored?).to be true
      expect(results.first.recommendation_reason[:code]).to eq('SPONSORED_PLACEMENT')
    end
  end
end
