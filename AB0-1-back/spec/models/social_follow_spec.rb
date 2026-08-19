# frozen_string_literal: true

require 'rails_helper'

RSpec.describe SocialFollow, type: :model do
  let(:follower) do
    User.create!(
      name: 'Follower',
      email: "follower_#{SecureRandom.hex(4)}@example.com",
      password: 'Password123!',
      city: 'São Paulo',
      terms_accepted: true
    )
  end

  let(:category) { Category.create!(name: 'Inversores', description: 'Categoria de inversores solares') }

  it 'allows a user to follow a category' do
    follow = SocialFollow.new(follower: follower, followable: category)
    expect(follow).to be_valid
  end

  it 'enforces uniqueness of follow' do
    SocialFollow.create!(follower: follower, followable: category)
    duplicate = SocialFollow.new(follower: follower, followable: category)
    expect(duplicate).not_to be_valid
  end
end
