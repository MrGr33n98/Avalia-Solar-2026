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
  end
end
