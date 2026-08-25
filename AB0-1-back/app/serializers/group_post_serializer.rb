# frozen_string_literal: true

class GroupPostSerializer
  def initialize(post, current_user: nil)
    @post = post
    @current_user = current_user
  end

  def as_json(*)
    {
      id: @post.id,
      title: @post.title,
      body: @post.body,
      status: @post.status,
      pinned: @post.pinned,
      comments_enabled: @post.comments_enabled,
      created_at: @post.created_at&.iso8601,
      updated_at: @post.updated_at&.iso8601,
      author: author_payload,
      topic: topic_payload,
      permissions: permissions_payload
    }
  end

  private

  def author_payload
    {
      id: @post.user.id,
      name: @post.user.display_name,
      avatar_url: @post.user.avatar_url
    }
  end

  def topic_payload
    return nil unless @post.group_topic

    { id: @post.group_topic.id, name: @post.group_topic.name, slug: @post.group_topic.slug }
  end

  def permissions_payload
    policy = GroupPostPolicy.new(@current_user, @post)
    { can_edit: policy.update?, can_delete: policy.destroy?, can_moderate: policy.moderate? }
  end
end