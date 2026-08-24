# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Feed::Query, type: :service do
  let(:user) { create(:user) }
  let(:older_publication) { create(:reviewer_publication, user: user, status: 'published', published_at: 2.days.ago) }
  let(:newer_publication) { create(:reviewer_publication, user: user, status: 'published', published_at: 1.day.ago) }

  before do
    FeedItem.create!(actor: user, subject: older_publication, verb: 'published', published_at: older_publication.published_at)
    FeedItem.create!(actor: user, subject: newer_publication, verb: 'published', published_at: newer_publication.published_at)
  end

  it 'retorna itens e cursor em recent' do
    result = described_class.new(user: user, view: 'recent', limit: 1).call

    expect(result[:items].size).to eq(1)
    expect(result[:items].first.subject_id).to eq(newer_publication.id)
    expect(result[:has_more]).to be(true)
    expect(result[:next_cursor]).to be_present
  end

  it 'não duplica itens entre páginas em recent' do
    first_page = described_class.new(user: user, view: 'recent', limit: 1).call
    second_page = described_class.new(user: user, view: 'recent', cursor: first_page[:next_cursor], limit: 1).call

    expect(first_page[:items].map(&:id) & second_page[:items].map(&:id)).to be_empty
  end
end
