# frozen_string_literal: true

module Groups
  class RecommendationService
    def self.call(user:, limit: 5)
      new(user: user, limit: limit).call
    end

    def initialize(user:, limit: 5)
      @user = user
      @limit = limit || 5
    end

    def call
      return popular_groups unless @user.present?

      # Find categories of groups the user has already joined
      joined_group_ids = @user.group_memberships.active.pluck(:group_id)
      user_categories = Group.where(id: joined_group_ids).pluck(:category_id).compact.uniq

      # Query recommended groups matching user's categories, excluding joined groups
      recommended = Group.discoverable
                         .where(category_id: user_categories)
                         .where.not(id: joined_group_ids)
                         .order(members_count: :desc, created_at: :desc)
                         .limit(@limit)
                         .to_a

      # If we don't have enough recommendations, fill with popular groups
      if recommended.count < @limit
        fill_limit = @limit - recommended.count
        fill_ids = joined_group_ids + recommended.map(&:id)
        
        popular = Group.discoverable
                       .where.not(id: fill_ids)
                       .order(members_count: :desc, created_at: :desc)
                       .limit(fill_limit)
                       .to_a
                       
        recommended += popular
      end

      recommended
    end

    private

    def popular_groups
      Group.discoverable
           .order(members_count: :desc, created_at: :desc)
           .limit(@limit)
           .to_a
    end
  end
end
