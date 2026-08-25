# frozen_string_literal: true

class GroupRuleSerializer
  def initialize(rule)
    @rule = rule
  end

  def as_json(*)
    {
      id: @rule.id,
      group_id: @rule.group_id,
      title: @rule.title,
      description: @rule.description,
      position: @rule.position
    }
  end
end