# frozen_string_literal: true

class GroupCompactSerializer
  def initialize(group, current_user: nil)
    @group = group
    @current_user = current_user
  end

  def as_json(*)
    {
      id: @group.id,
      name: @group.name,
      slug: @group.slug,
      short_description: @group.short_description,
      visibility: @group.visibility,
      official: @group.official,
      verified: @group.verified,
      featured: @group.featured,
      stats: { members: @group.members_count, posts: @group.posts_count },
      avatar_url: @group.avatar_url,
      hero_preview_url: @group.hero_preview_url,
      membership: membership_payload,
      permissions: permissions_payload
    }
  end

  private

  def membership
    @membership ||= @group.group_memberships.find_by(user_id: @current_user&.id)
  end

  def membership_payload
    membership && GroupMembershipSerializer.new(membership).as_json
  end

  def permissions_payload
    policy = GroupPolicy.new(@current_user, @group)
    {
      can_join: policy.join?,
      can_leave: policy.leave?,
      can_post: @current_user.present? && GroupPolicy.new(@current_user, @group).create_post?,
      can_invite: @current_user.present? && policy.invite?,
      can_moderate: @current_user.present? && policy.moderate?,
      can_manage_members: @current_user.present? && policy.manage_members?
    }
  end
end