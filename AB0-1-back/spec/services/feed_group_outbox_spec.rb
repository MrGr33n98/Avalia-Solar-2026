# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Feed & GroupPost Social Core Integration', type: :model do
  let(:category) { Category.create!(name: "Solar-#{SecureRandom.hex(4)}", description: 'Solar Category') }
  
  let(:owner) do
    User.create!(
      name: 'Owner User',
      email: "owner_#{SecureRandom.hex(4)}@example.com",
      password: 'Password123!',
      city: 'São Paulo',
      terms_accepted: true
    )
  end

  let(:member) do
    User.create!(
      name: 'Member User',
      email: "member_#{SecureRandom.hex(4)}@example.com",
      password: 'Password123!',
      city: 'Rio de Janeiro',
      terms_accepted: true
    )
  end

  let(:non_member) do
    User.create!(
      name: 'Non-Member User',
      email: "nonmember_#{SecureRandom.hex(4)}@example.com",
      password: 'Password123!',
      city: 'Belo Horizonte',
      terms_accepted: true
    )
  end

  let(:public_group) do
    Group.create!(
      name: 'Public Solar Community',
      slug: "public-solar-#{SecureRandom.hex(4)}",
      description: 'Public group description',
      visibility: 'public',
      status: 'active',
      membership_mode: 'open',
      posting_mode: 'members',
      owner: owner,
      category: category
    )
  end

  let(:private_group) do
    Group.create!(
      name: 'Private Solar Elite',
      slug: "private-solar-#{SecureRandom.hex(4)}",
      description: 'Private group description',
      visibility: 'private_visible',
      status: 'active',
      membership_mode: 'approval',
      posting_mode: 'members',
      owner: owner,
      category: category
    )
  end

  before do
    # Make member an active member of both groups
    GroupMembership.create!(group: public_group, user: member, role: 'member', status: 'active')
    GroupMembership.create!(group: private_group, user: member, role: 'member', status: 'active')

    # Make owner an active owner of both groups
    GroupMembership.create!(group: public_group, user: owner, role: 'owner', status: 'active')
    GroupMembership.create!(group: private_group, user: owner, role: 'owner', status: 'active')
  end

  describe 'DomainEvent to FeedItem projection' do
    it 'projects public group posts to a public FeedItem' do
      post = GroupPost.create!(
        group: public_group,
        user: member,
        title: 'Public Group Post',
        body: 'This is a public post body',
        status: 'published'
      )

      # Simulate domain event generation (from controller)
      DomainEvent.create!(
        event_type: 'group_post_created',
        aggregate_type: 'GroupPost',
        aggregate_id: post.id,
        payload: { group_id: post.group_id, user_id: post.user_id, status: post.status },
        occurred_at: Time.current
      )

      expect {
        Social::ProcessOutboxEventsJob.perform_now
      }.to change(FeedItem, :count).by(1)

      feed_item = FeedItem.last
      expect(feed_item.actor).to eq(member)
      expect(feed_item.subject).to eq(post)
      expect(feed_item.visibility).to eq('public')
    end

    it 'projects private group posts to a group visibility FeedItem' do
      post = GroupPost.create!(
        group: private_group,
        user: member,
        title: 'Private Group Post',
        body: 'This is a private post body',
        status: 'published'
      )

      DomainEvent.create!(
        event_type: 'group_post_created',
        aggregate_type: 'GroupPost',
        aggregate_id: post.id,
        payload: { group_id: post.group_id, user_id: post.user_id, status: post.status },
        occurred_at: Time.current
      )

      Social::ProcessOutboxEventsJob.perform_now

      feed_item = FeedItem.last
      expect(feed_item.subject).to eq(post)
      expect(feed_item.visibility).to eq('group')
    end

    it 'destroys the FeedItem when the post is hidden' do
      post = GroupPost.create!(
        group: public_group,
        user: member,
        title: 'Deletable Post',
        body: 'Content...',
        status: 'published'
      )

      DomainEvent.create!(
        event_type: 'group_post_created',
        aggregate_type: 'GroupPost',
        aggregate_id: post.id,
        payload: { group_id: post.group_id, user_id: post.user_id, status: post.status },
        occurred_at: Time.current
      )
      Social::ProcessOutboxEventsJob.perform_now
      expect(FeedItem.where(subject: post).count).to eq(1)

      # Mark hidden and publish outbox event
      post.update!(status: 'hidden')
      DomainEvent.create!(
        event_type: 'group_post_hidden',
        aggregate_type: 'GroupPost',
        aggregate_id: post.id,
        payload: { group_id: post.group_id, user_id: post.user_id, status: post.status },
        occurred_at: Time.current
      )

      expect {
        Social::ProcessOutboxEventsJob.perform_now
      }.to change(FeedItem, :count).by(-1)

      expect(FeedItem.where(subject: post).count).to eq(0)
    end
  end

  describe 'Feed::CandidateBuilder visibility filtering' do
    let!(:public_feed_item) do
      post = GroupPost.create!(group: public_group, user: member, title: 'Public', body: 'body', status: 'published')
      FeedItem.create!(actor: member, subject: post, verb: 'published', visibility: 'public', published_at: Time.current)
    end

    let!(:private_feed_item) do
      post = GroupPost.create!(group: private_group, user: member, title: 'Private', body: 'body', status: 'published')
      FeedItem.create!(actor: member, subject: post, verb: 'published', visibility: 'group', published_at: Time.current)
    end

    it 'returns public group posts to anonymous guests' do
      candidates = Feed::CandidateBuilder.new(user: nil, view: 'recent').call.to_a
      expect(candidates).to include(public_feed_item)
      expect(candidates).not_to include(private_feed_item)
    end

    it 'returns private group posts only to active members' do
      # Non-member view
      non_member_candidates = Feed::CandidateBuilder.new(user: non_member, view: 'recent').call.to_a
      expect(non_member_candidates).to include(public_feed_item)
      expect(non_member_candidates).not_to include(private_feed_item)

      # Member view
      member_candidates = Feed::CandidateBuilder.new(user: member, view: 'recent').call.to_a
      expect(member_candidates).to include(public_feed_item)
      expect(member_candidates).to include(private_feed_item)
    end
  end

  describe 'Feed::Ranker scoring' do
    it 'calculates higher score for group posts with reactions and comments' do
      post_unpopular = GroupPost.create!(group: public_group, user: member, title: 'Unpopular', body: 'body', status: 'published')
      item_unpopular = FeedItem.create!(actor: member, subject: post_unpopular, verb: 'published', visibility: 'public', published_at: 1.hour.ago)

      post_popular = GroupPost.create!(group: public_group, user: member, title: 'Popular', body: 'body', status: 'published')
      item_popular = FeedItem.create!(actor: member, subject: post_popular, verb: 'published', visibility: 'public', published_at: 1.hour.ago)

      # Add engagement to popular post
      Reaction.create!(user: owner, reactable: post_popular, reaction_type: 'useful')
      Comment.create!(user: owner, commentable: post_popular, body: 'Interesting!', status: 'active')

      # Rank candidates in 'for_you' view
      ranked = Feed::Ranker.new(FeedItem.all, view: 'for_you').call.to_a
      
      # The popular post should rank first due to higher engagement score
      expect(ranked.first.subject).to eq(post_popular)
      expect(ranked.last.subject).to eq(post_unpopular)
    end
  end
end
