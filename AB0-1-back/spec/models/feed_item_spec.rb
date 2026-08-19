# frozen_string_literal: true

require 'rails_helper'

RSpec.describe FeedItem, type: :model do
  let(:user) do
    User.create!(
      name: 'Tester',
      email: "test_#{SecureRandom.hex(4)}@example.com",
      password: 'Password123!',
      city: 'São Paulo',
      terms_accepted: true
    )
  end

  let(:publication) do
    ReviewerPublication.create!(
      user: user,
      title: 'Test Title',
      slug: "test-title-#{SecureRandom.hex(4)}",
      body: 'Body content here'
    )
  end

  it 'is valid with valid attributes' do
    item = FeedItem.new(actor: user, subject: publication, verb: 'published', visibility: 'public', published_at: Time.current)
    expect(item).to be_valid
  end

  it 'validates visibility inclusion' do
    item = FeedItem.new(actor: user, subject: publication, verb: 'published', visibility: 'invalid', published_at: Time.current)
    expect(item).not_to be_valid
  end
end
