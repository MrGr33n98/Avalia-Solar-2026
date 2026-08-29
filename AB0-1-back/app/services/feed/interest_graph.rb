module Feed
  class InterestGraph
    WEIGHTS = {
      'feed_item_dwell_10s' => 3.0,
      'feed_item_saved' => 4.0,
      'feed_item_reaction' => 2.0,
      'feed_item_comment' => 3.0,
      'creator_profile_click' => 2.0,
      'company_profile_click' => 2.0,
      'topic_click' => 2.5,
      'creator_follow' => 5.0,
      'community_join' => 5.0
    }.freeze

    def self.record(user:, event_type:, metadata: {}, occurred_at: Time.current)
      return if user.blank? || WEIGHTS[event_type.to_s].blank?

      entity_type, entity_id = entity_from(metadata)
      return if entity_type.blank? || entity_id.blank?

      interest = UserInterest.find_or_initialize_by(user: user, entity_type: entity_type, entity_id: entity_id)
      elapsed_days = interest.last_interaction_at ? (occurred_at - interest.last_interaction_at) / 1.day : 0
      decayed_score = interest.score.to_f * (0.95**[elapsed_days, 0].max)
      interest.assign_attributes(score: decayed_score + WEIGHTS.fetch(event_type.to_s), last_interaction_at: occurred_at)
      interest.save!
    rescue ActiveRecord::RecordNotUnique
      retry
    end

    def self.entity_from(metadata)
      %w[topic creator company group].each do |kind|
        id = metadata["#{kind}_id"] || metadata[kind]
        return [kind.classify, id.to_i] if id.present? && id.to_i.positive?
      end
      [nil, nil]
    end
    private_class_method :entity_from
  end
end
