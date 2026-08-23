# frozen_string_literal: true

module Feed
  class CandidateBuilder
    def initialize(user:, view: 'for_you')
      @user = user
      @view = view
    end

    def call
      case @view
      when 'following'
        return FeedItem.none unless @user

        followed_creators = SocialFollow.where(follower: @user, followable_type: 'ReviewerProfile').select(:followable_id)
        followed_companies = SocialFollow.where(follower: @user, followable_type: 'Company').select(:followable_id)

        FeedItem.where(
          "visibility = 'public' AND ((actor_type = 'User' AND actor_id IN " \
          "(SELECT user_id FROM reviewer_profiles WHERE id IN (?))) OR " \
          "(actor_type = 'Company' AND actor_id IN (?)))",
          followed_creators, followed_companies
        )
      when 'creators'
        FeedItem.public_items.where(actor_type: 'User', subject_type: 'ReviewerPublication')
      when 'companies'
        FeedItem.public_items.where(actor_type: 'Company')
      when 'recent', 'for_you'
        FeedItem.public_items.where(subject_type: %w[ReviewerPublication Review])
      else
        FeedItem.public_items.where(subject_type: %w[ReviewerPublication Review])
      end
    end
  end
end
