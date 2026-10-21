# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Company Reputation Serialization', type: :serializer do
  describe 'when company has no reviews (0 rating_count)' do
    let(:company) do
      Company.new(
        id: 999,
        name: 'Growatt Brasil',
        slug: 'growatt-brasil',
        rating_avg: nil,
        rating_count: 0
      )
    end

    it 'CompanyCardSerializer returns nil for sentiment, recommendation_rate and nps_score' do
      data = CompanyCardSerializer.new(company).as_json
      reputation = data[:reputation]

      expect(reputation[:rating_avg]).to be_nil
      expect(reputation[:rating_count]).to eq(0)
      expect(reputation[:sentiment]).to be_nil
      expect(reputation[:recommendation_rate]).to be_nil
      expect(reputation[:nps_score]).to be_nil
      expect(reputation[:nps_responses]).to eq(0)
    end

    it 'CompanyListSerializer returns nil for sentiment and recommendation_rate' do
      data = CompanyListSerializer.new(company).as_json
      reputation = data[:reputation]

      expect(reputation[:rating_avg]).to be_nil
      expect(reputation[:rating_count]).to eq(0)
      expect(reputation[:sentiment]).to be_nil
      expect(reputation[:recommendation_rate]).to be_nil
      expect(reputation[:nps_score]).to be_nil
      expect(reputation[:nps_responses]).to eq(0)
    end
  end
end
