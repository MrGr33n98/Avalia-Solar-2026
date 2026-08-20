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

  it 'bloqueia self-follow de perfil reviewer' do
    profile = create(:reviewer_profile, user: follower)

    follow = SocialFollow.new(follower: follower, followable: profile)

    expect(follow).not_to be_valid
    expect(follow.errors[:follower_id]).to include('não pode seguir a si próprio')
  end

  it 'possui índice único real para suportar concorrência' do
    index = ActiveRecord::Base.connection.indexes(:social_follows).find do |candidate|
      candidate.columns == %w[follower_id followable_type followable_id]
    end

    expect(index).to be_present
    expect(index.unique).to be(true)
  end
end
