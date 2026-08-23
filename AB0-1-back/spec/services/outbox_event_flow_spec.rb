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
    expect(feed_item.visibility).to eq('public')
    expect(feed_item.published_at).to eq(publication.published_at)

    # Verify idempotency
    expect {
      Social::ProcessOutboxEventsJob.perform_now
    }.not_to change(FeedItem, :count)
  end

  it 'completes events without a supported projection' do
    event = DomainEvent.create!(
      event_type: 'publication.published',
      aggregate_type: 'User',
      aggregate_id: user.id,
      occurred_at: Time.current
    )

    expect { Social::ProcessOutboxEventsJob.perform_now }.not_to change(FeedItem, :count)
    expect(event.reload).to have_attributes(status: 'completed', processed_at: be_present)
  end

  it 'can reprocess a failed event after projection failure' do
    publication = create(:reviewer_publication, user: user, status: 'published', published_at: Time.current)
    event = DomainEvent.create!(
      event_type: 'publication.published',
      aggregate_type: 'ReviewerPublication',
      aggregate_id: publication.id,
      occurred_at: Time.current
    )
    allow(Social::CreateFeedItemJob).to receive(:perform_now).and_raise(StandardError, 'projection failed')

    Social::ProcessOutboxEventsJob.perform_now
    expect(event.reload.status).to eq('failed')

    allow(Social::CreateFeedItemJob).to receive(:perform_now).and_call_original
    Social::ProcessOutboxEventsJob.perform_now

    expect(event.reload.status).to eq('completed')
    expect(FeedItem.where(subject: publication).count).to eq(1)
  end

  it 'does not reprocess events after five failed attempts' do
    event = DomainEvent.create!(
      event_type: 'publication.published',
      aggregate_type: 'ReviewerPublication',
      aggregate_id: 999_999,
      occurred_at: Time.current,
      status: 'failed',
      attempts: 5,
      last_error: 'permanent failure'
    )

    expect { Social::ProcessOutboxEventsJob.perform_now }.not_to change { event.reload.updated_at }
    expect(event.reload.status).to eq('failed')
  end
end
