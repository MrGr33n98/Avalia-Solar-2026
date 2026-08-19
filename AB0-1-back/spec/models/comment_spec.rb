# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Comment, type: :model do
  let(:user) do
    User.create!(
      name: 'Commenter',
      email: "commenter_#{SecureRandom.hex(4)}@example.com",
      password: 'Password123!',
      city: 'Curitiba',
      terms_accepted: true
    )
  end

  let(:publication) do
    ReviewerPublication.create!(
      user: user,
      title: 'Commentable Pub',
      slug: "commentable-pub-#{SecureRandom.hex(4)}",
      body: 'Pub body'
    )
  end

  it 'is valid with valid body and polymorphic commentable' do
    comment = Comment.new(user: user, commentable: publication, body: 'Ótima publicação!')
    expect(comment).to be_valid
  end

  it 'validates body presence' do
    comment = Comment.new(user: user, commentable: publication, body: '')
    expect(comment).not_to be_valid
  end
end
