# frozen_string_literal: true

class GroupMembershipSerializer
  def initialize(membership)
    @membership = membership
  end

  def as_json(*)
    {
      id: @membership.id,
      group_id: @membership.group_id,
      user_id: @membership.user_id,
      role: @membership.role,
      status: @membership.status,
      joined_at: @membership.joined_at&.iso8601,
      approved_at: @membership.approved_at&.iso8601,
      notifications_level: @membership.notifications_level
    }
  end
end