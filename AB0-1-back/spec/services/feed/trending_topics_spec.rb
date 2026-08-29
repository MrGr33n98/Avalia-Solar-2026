# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Feed::TrendingTopics, type: :service do
  include ActiveSupport::Testing::TimeHelpers

  around do |example|
    travel_to(Time.zone.local(2026, 8, 29, 12)) { example.run }
  end

  it 'retorna contagem e velocidade por categoria' do
    user = create(:user)
    2.times { create(:reviewer_publication, user: user, status: 'published', category: 'Armazenamento', published_at: 2.days.ago) }
    create(:reviewer_publication, user: user, status: 'published', category: 'Armazenamento', published_at: 35.days.ago)

    result = described_class.call

    expect(result).to include(hash_including(slug: 'armazenamento', label: 'Armazenamento', publications_count: 2, velocity: 1.0))
  end

  it 'ignora publicações sem categoria e fora da janela atual' do
    user = create(:user)
    create(:reviewer_publication, user: user, status: 'published', category: nil, published_at: 1.day.ago)
    create(:reviewer_publication, user: user, status: 'draft', category: 'Solar', published_at: 1.day.ago)

    expect(described_class.call).to eq([])
  end
end
