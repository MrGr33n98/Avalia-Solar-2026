# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Reaction, type: :model do
  let(:user) do
    User.create!(
      name: 'Reactor',
      email: "reactor_#{SecureRandom.hex(4)}@example.com",
      password: 'Password123!',
      city: 'Rio de Janeiro',
      terms_accepted: true
    )
  end

  let(:publication) do
    ReviewerPublication.create!(
      user: user,
      title: 'Reaction Title',
      slug: "reaction-title-#{SecureRandom.hex(4)}",
      body: 'Body content'
    )
  end

  it 'allows user to react to publication' do
    reaction = Reaction.new(user: user, reactable: publication, reaction_type: 'useful')
    expect(reaction).to be_valid
  end

  it 'prevents duplicate reactions for same user and reactable' do
    Reaction.create!(user: user, reactable: publication, reaction_type: 'useful')
    duplicate = Reaction.new(user: user, reactable: publication, reaction_type: 'useful')
    expect(duplicate).not_to be_valid
  end
end
