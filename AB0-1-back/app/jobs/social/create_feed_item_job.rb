# frozen_string_literal: true

module Social
  class CreateFeedItemJob < ApplicationJob
    queue_as :default

    def perform(subject_type, subject_id, verb: 'published')
      subject = subject_type.constantize.find_by(id: subject_id)
      return unless subject

      actor = if subject.is_a?(ReviewerPublication)
                subject.user
              elsif subject.is_a?(Review)
                subject.user
              end

      return unless actor

      FeedItem.find_or_create_by!(
        actor: actor,
        subject: subject,
        verb: verb
      ) do |item|
        item.visibility = 'public'
        item.published_at = subject.try(:published_at) || subject.created_at
      end
    end
  end
end
