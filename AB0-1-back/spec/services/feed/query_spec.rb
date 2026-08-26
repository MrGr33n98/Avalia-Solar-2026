# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Feed::Query, type: :service do
  let(:user) { create(:user) }
  let(:older_publication) { create(:reviewer_publication, user: user, status: 'published', published_at: 2.days.ago) }
  let(:newer_publication) { create(:reviewer_publication, user: user, status: 'published', published_at: 1.day.ago) }

  before do
    FeedItem.create!(actor: user, subject: older_publication, verb: 'published', published_at: older_publication.published_at)
    FeedItem.create!(actor: user, subject: newer_publication, verb: 'published', published_at: newer_publication.published_at)
  end

  it 'retorna itens e cursor em recent' do
    result = described_class.new(user: user, view: 'recent', limit: 1).call

    expect(result[:items].size).to eq(1)
    expect(result[:items].first.subject_id).to eq(newer_publication.id)
    expect(result[:has_more]).to be(true)
    expect(result[:next_cursor]).to be_present
  end

  it 'não duplica itens entre páginas em recent' do
    first_page = described_class.new(user: user, view: 'recent', limit: 1).call
    second_page = described_class.new(user: user, view: 'recent', cursor: first_page[:next_cursor], limit: 1).call

    expect(first_page[:items].map(&:id) & second_page[:items].map(&:id)).to be_empty
  end

  describe 'following view' do
    let(:creator) { create(:user) }
    let(:creator_profile) { create(:reviewer_profile, user: creator) }
    let(:company) { create(:company) }
    let(:group) { create(:group) }
    
    let(:unfollowed_creator) { create(:user) }
    let(:unfollowed_company) { create(:company) }
    let(:unjoined_group) { create(:group) }

    let(:creator_post) { create(:reviewer_publication, user: creator, status: 'published') }
    let(:company_post) { create(:review, company: company, user: create(:user), status: 'approved') }
    let(:group_post) { GroupPost.create!(group: group, user: create(:user), status: 'published', body: 'Test') }
    
    let(:unfollowed_creator_post) { create(:reviewer_publication, user: unfollowed_creator, status: 'published') }
    let(:unfollowed_company_post) { create(:review, company: unfollowed_company, user: create(:user), status: 'approved') }
    let(:unjoined_group_post) { GroupPost.create!(group: unjoined_group, user: create(:user), status: 'published', body: 'Test') }

    before do
      SocialFollow.create!(follower: user, followable: creator_profile)
      SocialFollow.create!(follower: user, followable: company)
      GroupMembership.create!(group: group, user: user, status: 'active', role: 'member')
      
      FeedItem.create!(actor: creator, subject: creator_post, verb: 'published', published_at: Time.current)
      FeedItem.create!(actor: company, subject: company_post, verb: 'published', published_at: Time.current)
      FeedItem.create!(actor: group_post.user, subject: group_post, verb: 'published', published_at: Time.current)
      
      FeedItem.create!(actor: unfollowed_creator, subject: unfollowed_creator_post, verb: 'published', published_at: Time.current)
      FeedItem.create!(actor: unfollowed_company, subject: unfollowed_company_post, verb: 'published', published_at: Time.current)
      FeedItem.create!(actor: unjoined_group_post.user, subject: unjoined_group_post, verb: 'published', published_at: Time.current)
    end

    it 'inclui publicacoes de creators e empresas seguidas e posts de grupos, excluindo nao seguidos' do
      result = described_class.new(user: user, view: 'following', limit: 10).call
      subjects = result[:items].map(&:subject)
      
      expect(subjects).to include(creator_post)
      expect(subjects).to include(company_post)
      expect(subjects).to include(group_post)
      
      expect(subjects).not_to include(unfollowed_creator_post)
      expect(subjects).not_to include(unfollowed_company_post)
      expect(subjects).not_to include(unjoined_group_post)
    end
  end

end
