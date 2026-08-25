# frozen_string_literal: true

class GroupTopicSerializer
  def initialize(topic)
    @topic = topic
  end

  def as_json(*)
    {
      id: @topic.id,
      group_id: @topic.group_id,
      name: @topic.name,
      slug: @topic.slug,
      description: @topic.description,
      position: @topic.position,
      posts_count: @topic.posts_count
    }
  end
end