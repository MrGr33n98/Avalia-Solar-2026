# frozen_string_literal: true

class GroupMemberSerializer
  def initialize(membership)
    @membership = membership
  end

  def as_json(*)
    user = @membership.user
    {
      id: @membership.id,
      user: {
        id: user.id,
        name: user.display_name,
        avatar_url: user.avatar_url
      },
      role: @membership.role,
      joined_at: @membership.joined_at&.iso8601
    }
  end
end