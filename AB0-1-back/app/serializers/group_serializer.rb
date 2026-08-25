# frozen_string_literal: true

class GroupSerializer < GroupCompactSerializer
  def as_json(*)
    super.merge(
      description: @group.description,
      membership_mode: @group.membership_mode,
      posting_mode: @group.posting_mode,
      status: @group.status,
      category_id: @group.category_id,
      created_at: @group.created_at&.iso8601,
      updated_at: @group.updated_at&.iso8601
    )
  end
end