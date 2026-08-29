# frozen_string_literal: true

module Feed
  class Suggestions
    def self.call(user: nil)
      followed_profile_ids = user ? SocialFollow.where(follower: user, followable_type: 'ReviewerProfile').select(:followable_id) : []
      followed_company_ids = user ? SocialFollow.where(follower: user, followable_type: 'Company').select(:followable_id) : []
      followed_group_ids = user ? GroupMembership.where(user: user, status: 'active').select(:group_id) : []

      {
        suggested_creators: ReviewerProfile.where(creator_enabled: true).where.not(id: followed_profile_ids)
          .includes(:user).order(created_at: :desc).limit(5).map { |profile| creator(profile) },
        suggested_companies: Company.where(status: 'active').where.not(id: followed_company_ids)
          .order(rating_avg: :desc, id: :desc).limit(5).map { |company| company(company) },
        suggested_groups: Group.discoverable.where.not(id: followed_group_ids)
          .order(posts_count: :desc, id: :desc).limit(5).map { |group| { id: group.id, name: group.name, slug: group.slug } }
      }
    end

    def self.creator(profile)
      { id: profile.id, name: profile.user.display_name, slug: profile.public_slug, avatar_url: profile.avatar_url }
    end
    private_class_method :creator

    def self.company(record)
      { id: record.id, name: record.name, slug: record.slug, logo_url: record.logo_url, rating: record.rating_avg }
    end
    private_class_method :company
  end
end
