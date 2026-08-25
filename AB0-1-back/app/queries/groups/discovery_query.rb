# frozen_string_literal: true

module Groups
  class DiscoveryQuery
    VALID_VIEWS = %w[active featured new mine].freeze

    def initialize(scope: Group.all, search: nil, category_id: nil, featured: nil, view: nil, current_user: nil)
      @scope = scope
      @search = search.to_s.strip
      @category_id = category_id
      @featured = featured
      @view = view
      @current_user = current_user
    end

    def call
      if @view == 'mine'
        return Group.none unless @current_user.present?

        relation = @scope.joins(:group_memberships)
                         .select('groups.*, group_memberships.joined_at')
                         .where(group_memberships: { user_id: @current_user.id, status: 'active' })
                         .where(status: 'active')
                         .distinct

        relation = relation.where(category_id: @category_id) if @category_id.present?
        relation = apply_search(relation) if @search.present?

        return relation.order('group_memberships.joined_at DESC')
      end

      relation = @scope.where(status: 'active', visibility: 'public')
      relation = relation.where(category_id: @category_id) if @category_id.present?
      relation = relation.where(featured: boolean_featured) unless boolean_featured.nil?
      relation = apply_search(relation) if @search.present?

      case @view
      when 'featured' then relation.where(featured: true).order(posts_count: :desc, id: :desc)
      when 'new' then relation.order(created_at: :desc, id: :desc)
      else relation.order(posts_count: :desc, members_count: :desc, id: :desc)
      end
    end

    private

    def apply_search(relation)
      pattern = "%#{ActiveRecord::Base.sanitize_sql_like(@search)}%"
      relation.where('groups.name ILIKE :pattern OR groups.short_description ILIKE :pattern', pattern: pattern)
    end

    def boolean_featured
      return nil if @featured.nil? || @featured.to_s.empty?

      ActiveModel::Type::Boolean.new.cast(@featured)
    end
  end
end