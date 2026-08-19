# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SavedItem, type: :model do
  let(:user) do
    User.create!(
      name: 'Saver',
      email: "saver_#{SecureRandom.hex(4)}@example.com",
      password: 'Password123!',
      city: 'Florianópolis',
      terms_accepted: true
    )
  end

  let(:publication) do
    ReviewerPublication.create!(
      user: user,
      title: 'Saveable Pub',
      slug: "saveable-pub-#{SecureRandom.hex(4)}",
      body: 'Body content'
    )
  end

  it 'allows saving a publication' do
    saved = SavedItem.new(user: user, saveable: publication)
    expect(saved).to be_valid
  end

  it 'prevents duplicate saved items' do
    SavedItem.create!(user: user, saveable: publication)
    duplicate = SavedItem.new(user: user, saveable: publication)
    expect(duplicate).not_to be_valid
  end
end
