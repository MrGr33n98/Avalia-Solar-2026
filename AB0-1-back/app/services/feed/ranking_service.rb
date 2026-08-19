# frozen_string_literal: true

module Feed
  class RankingService
    def initialize(user:)
      @user = user
    end

    def score(feed_item)
      score = 0.0

      # Freshness decay (half-life of 24h)
      age_hours = (Time.current - feed_item.published_at) / 1.hour
      freshness_score = 100.0 / (1.0 + (age_hours / 24.0))
      score += freshness_score

      # Following boost
      if @user && feed_item.actor_type == 'User'
        profile_id = ReviewerProfile.where(user_id: feed_item.actor_id).pluck(:id).first
        if profile_id && SocialFollow.exists?(follower: @user, followable_type: 'ReviewerProfile', followable_id: profile_id)
          score += 100.0
        end
      end

      score
    end
  end
end
