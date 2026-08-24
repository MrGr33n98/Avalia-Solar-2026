# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Feed::Ranker, type: :service do
  let(:user) { create(:user) }
  let(:older_publication) do
    create(:reviewer_publication, user: user, status: 'published', published_at: 2.days.ago)
  end
  let(:newer_publication) do
    create(:reviewer_publication, user: user, status: 'published', published_at: 1.day.ago)
  end

  before do
    FeedItem.create!(actor: user, subject: older_publication, verb: 'published', published_at: older_publication.published_at)
    FeedItem.create!(actor: user, subject: newer_publication, verb: 'published', published_at: newer_publication.published_at)
  end

  it 'mantém ordem cronológica em recent' do
    items = described_class.new(FeedItem.public_items, view: 'recent').call.to_a

    expect(items.map(&:subject_id)).to eq([newer_publication.id, older_publication.id])
  end

  it 'prioriza engajamento persistido em for_you' do
    2.times do
      Reaction.create!(
        reactable: older_publication,
        user: create(:user),
        reaction_type: 'useful'
      )
    end

    items = described_class.new(FeedItem.public_items, view: 'for_you').call.to_a

    expect(items.first.subject_id).to eq(older_publication.id)
  end

  it 'não inclui itens privados' do
    FeedItem.create!(actor: user, subject: create(:reviewer_publication, user: user), verb: 'published', visibility: 'private', published_at: Time.current)

    items = described_class.new(FeedItem.public_items, view: 'for_you').call.to_a

    expect(items).to all(have_attributes(visibility: 'public'))
  end
end
