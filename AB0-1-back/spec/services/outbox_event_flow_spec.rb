# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Outbox Event Flow', type: :model do
  let(:user) do
    User.create!(
      name: 'Publisher',
      email: "pub_#{SecureRandom.hex(4)}@example.com",
      password: 'Password123!',
      city: 'São Paulo',
      terms_accepted: true
    )
  end

  it 'generates DomainEvent and creates FeedItem via Outbox worker when publication is published' do
    publication = ReviewerPublication.create!(
      user: user,
      title: 'Outbox Test Publication',
      slug: "outbox-pub-#{SecureRandom.hex(4)}",
      body: 'Content for outbox test'
    )

    expect {
      publication.publish!
    }.to change(DomainEvent, :count).by(1)

    event = DomainEvent.last
    expect(event.event_type).to eq('publication.published')
    expect(event.aggregate_type).to eq('ReviewerPublication')
    expect(event.aggregate_id).to eq(publication.id)

    expect {
      Social::ProcessOutboxEventsJob.perform_now
    }.to change(FeedItem, :count).by(1)

    feed_item = FeedItem.last
    expect(feed_item.actor).to eq(user)
    expect(feed_item.subject).to eq(publication)

    # Verify idempotency
    expect {
      Social::ProcessOutboxEventsJob.perform_now
    }.not_to change(FeedItem, :count)
  end
end
