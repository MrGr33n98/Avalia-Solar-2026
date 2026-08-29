# frozen_string_literal: true

module Feed
  class CandidateBuilder
    def initialize(user:, view: 'for_you', content_type: nil)
      @user = user
      @view = view
      @content_type = content_type.presence_in(%w[ReviewerPublication Review GroupPost NewsItem Poll])
    end

    def call
      scope = case @view
      when 'following'
        return FeedItem.none unless @user

        followed_creators = SocialFollow.where(follower: @user, followable_type: 'ReviewerProfile').select(:followable_id)
        followed_companies = SocialFollow.where(follower: @user, followable_type: 'Company').select(:followable_id)
        active_group_ids = GroupMembership.where(user: @user, status: 'active').pluck(:group_id)

        actor_condition = "((feed_items.actor_type = 'User' AND feed_items.actor_id IN " \
                          "(SELECT user_id FROM reviewer_profiles WHERE id IN (?))) OR " \
                          "(feed_items.actor_type = 'Company' AND feed_items.actor_id IN (?)))"

        following_condition = actor_condition
        following_args = [followed_creators, followed_companies]
        if active_group_ids.any?
          following_condition = "(#{actor_condition}) OR " \
                                "(feed_items.subject_type = 'GroupPost' AND groups.id IN (?))"
          following_args << active_group_ids
        end

        scope = FeedItem.joins("LEFT OUTER JOIN group_posts ON feed_items.subject_type = 'GroupPost' AND feed_items.subject_id = group_posts.id")
                         .joins("LEFT OUTER JOIN groups ON group_posts.group_id = groups.id")
                         .where(following_condition, *following_args)

        if active_group_ids.any?
          scope.where(
            "(feed_items.subject_type != 'GroupPost' AND feed_items.visibility = 'public') OR " \
            "(feed_items.subject_type = 'GroupPost' AND groups.status = 'active' AND (groups.visibility = 'public' OR groups.id IN (?)))",
            active_group_ids
          )
        else
          scope.where(
            "(feed_items.subject_type != 'GroupPost' AND feed_items.visibility = 'public') OR " \
            "(feed_items.subject_type = 'GroupPost' AND groups.status = 'active' AND groups.visibility = 'public')"
          )
        end
      when 'creators'
        FeedItem.public_items.where(actor_type: 'User', subject_type: 'ReviewerPublication')
      when 'companies'
        FeedItem.public_items.where(actor_type: 'Company')
      when 'recent', 'for_you'
        scope = FeedItem.joins("LEFT OUTER JOIN group_posts ON feed_items.subject_type = 'GroupPost' AND feed_items.subject_id = group_posts.id")
                         .joins("LEFT OUTER JOIN groups ON group_posts.group_id = groups.id")

        if @user
          active_group_ids = GroupMembership.where(user: @user, status: 'active').pluck(:group_id)
          if active_group_ids.any?
            scope.where(
              "(feed_items.subject_type IN ('ReviewerPublication', 'Review', 'NewsItem', 'Poll') AND feed_items.visibility = 'public') OR " \
              "(feed_items.subject_type = 'GroupPost' AND groups.status = 'active' AND (groups.visibility = 'public' OR groups.id IN (?)))",
              active_group_ids
            )
          else
            scope.where(
              "(feed_items.subject_type IN ('ReviewerPublication', 'Review', 'NewsItem', 'Poll') AND feed_items.visibility = 'public') OR " \
              "(feed_items.subject_type = 'GroupPost' AND groups.status = 'active' AND groups.visibility = 'public')"
            )
          end
        else
          scope.where(
            "(feed_items.subject_type IN ('ReviewerPublication', 'Review', 'NewsItem', 'Poll') AND feed_items.visibility = 'public') OR " \
            "(feed_items.subject_type = 'GroupPost' AND groups.status = 'active' AND groups.visibility = 'public')"
          )
        end
      else
        scope = FeedItem.joins("LEFT OUTER JOIN group_posts ON feed_items.subject_type = 'GroupPost' AND feed_items.subject_id = group_posts.id")
                         .joins("LEFT OUTER JOIN groups ON group_posts.group_id = groups.id")

        if @user
          active_group_ids = GroupMembership.where(user: @user, status: 'active').pluck(:group_id)
          if active_group_ids.any?
            scope.where(
              "(feed_items.subject_type IN ('ReviewerPublication', 'Review', 'NewsItem', 'Poll') AND feed_items.visibility = 'public') OR " \
              "(feed_items.subject_type = 'GroupPost' AND groups.status = 'active' AND (groups.visibility = 'public' OR groups.id IN (?)))",
              active_group_ids
            )
          else
            scope.where(
              "(feed_items.subject_type IN ('ReviewerPublication', 'Review', 'NewsItem', 'Poll') AND feed_items.visibility = 'public') OR " \
              "(feed_items.subject_type = 'GroupPost' AND groups.status = 'active' AND groups.visibility = 'public')"
            )
          end
        else
          scope.where(
            "(feed_items.subject_type IN ('ReviewerPublication', 'Review', 'NewsItem', 'Poll') AND feed_items.visibility = 'public') OR " \
            "(feed_items.subject_type = 'GroupPost' AND groups.status = 'active' AND groups.visibility = 'public')"
          )
        end
      end
      @content_type ? scope.where(subject_type: @content_type) : scope
    end
  end
end
