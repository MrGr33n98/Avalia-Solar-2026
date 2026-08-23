# frozen_string_literal: true

module Social
  class CreateFeedItemJob < ApplicationJob
    queue_as :default

    def perform(subject_type, subject_id, verb: 'published')
      subject_class = subject_type.safe_constantize
      return unless [ReviewerPublication, Review].include?(subject_class)

      subject = subject_class.find_by(id: subject_id)
      return unless subject

      actor = if subject.is_a?(ReviewerPublication)
                subject.user
              elsif subject.is_a?(Review)
                subject.user
              end

      return unless actor

      feed_item = FeedItem.find_or_initialize_by(
        actor: actor,
        subject: subject,
        verb: verb
      end
      feed_item.visibility = 'public'
      feed_item.published_at ||= subject.try(:published_at) || subject.created_at
      feed_item.save!
    end
  end
end
