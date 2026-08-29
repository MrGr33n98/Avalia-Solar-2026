# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Feed::Serializer, type: :service do
  let(:user) { create(:user) }
  let!(:profile) { create(:reviewer_profile, user: user, creator_enabled: true, public_slug: 'felipe-creator', public_headline: 'Expert Solar') }
  let(:company) { create(:company, name: 'Suns', slug: 'suns') }

  let(:pub) { create(:reviewer_publication, user: user, title: 'My Post', slug: 'my-post', body: 'Test content') }
  let(:review) { create(:review, user: user, company: company, rating: 4.5, comment: 'Nice', headline: 'Good service') }

  let(:feed_item_pub) { FeedItem.create!(actor: user, subject: pub, verb: 'publish', published_at: Time.current) }
  let(:feed_item_review) { FeedItem.create!(actor: user, subject: review, verb: 'review', published_at: Time.current) }

  describe '#serialize' do
    it 'serializes user actor with normalized properties' do
      serializer = described_class.new([feed_item_pub], current_user: user)
      result = serializer.serialize.first

      expect(result[:actor][:id]).to eq(user.id)
      expect(result[:actor][:type]).to eq('creator')
      expect(result[:actor][:display_name]).to eq(user.display_name)
      expect(result[:actor][:slug]).to eq('felipe-creator')
      expect(result[:actor][:headline]).to eq('Expert Solar')
      expect(result[:author]).to eq(result[:actor])
    end

    it 'serializes company subject in reviews' do
      serializer = described_class.new([feed_item_review], current_user: user)
      result = serializer.serialize.first

      expect(result[:subject][:company][:id]).to eq(company.id)
      expect(result[:subject][:company][:name]).to eq(company.name)
      expect(result[:subject][:company][:slug]).to eq(company.slug)
    end

    it 'serializes publication cover as URL and includes publication metadata' do
      serializer = described_class.new([feed_item_pub], current_user: user)
      result = serializer.serialize.first

      expect(result[:subject][:publication_type]).to eq(pub.publication_type)
      expect(result[:subject][:category]).to eq(pub.category)
      expect(result[:subject]).to have_key(:cover_image_url)
      expect(result[:subject][:cover_image_url]).to be_nil
    end

    it 'uses persisted publication counters' do
      pub.update!(views_count: 7, shares_count: 3)
      ReviewerPublicationEvent.create!(reviewer_publication: pub, event_name: 'publication_view')

      result = described_class.new([feed_item_pub], current_user: user).serialize.first

      expect(result[:subject].slice(:views_count, :shares_count)).to eq(views_count: 7, shares_count: 3)
    end
  end

  describe 'viewer_following engagement state' do
    let(:viewer) { create(:user) }
    let(:creator) { create(:user) }
    let!(:creator_profile) { create(:reviewer_profile, user: creator) }
    let(:pub_subject) { create(:reviewer_publication, user: creator) }
    let(:feed_item) { FeedItem.create!(actor: creator, subject: pub_subject, verb: 'publish', published_at: Time.current) }

    it 'returns true if the viewer is following the actor profile' do
      SocialFollow.create!(
        follower: viewer,
        followable: creator_profile
      )

      serializer = described_class.new([feed_item], current_user: viewer)
      result = serializer.serialize.first

      expect(result[:engagement][:viewer_following]).to eq(true)
    end

    it 'returns false if the viewer is not following the actor profile' do
      serializer = described_class.new([feed_item], current_user: viewer)
      result = serializer.serialize.first

      expect(result[:engagement][:viewer_following]).to eq(false)
    end

    it 'returns false for anonymous feed' do
      serializer = described_class.new([feed_item], current_user: nil)
      result = serializer.serialize.first

      expect(result[:engagement][:viewer_following]).to eq(false)
    end
  end
end
