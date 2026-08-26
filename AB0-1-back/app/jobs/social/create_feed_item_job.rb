# frozen_string_literal: true

module Social
  class CreateFeedItemJob < ApplicationJob
    queue_as :default

    def perform(subject_type, subject_id, verb: 'published')
      subject_class = subject_type.safe_constantize
      return unless [ReviewerPublication, Review, GroupPost].include?(subject_class)

      subject = subject_class.find_by(id: subject_id)
      return unless subject

      # For GroupPost, only create feed item if published
      if subject.is_a?(GroupPost) && !subject.published?
        FeedItem.where(subject: subject).destroy_all
        return
      end

      actor = if subject.is_a?(ReviewerPublication) || subject.is_a?(Review) || subject.is_a?(GroupPost)
                subject.user
              end

      return unless actor

      feed_item = FeedItem.find_or_initialize_by(
        actor: actor,
        subject: subject,
        verb: verb
      )

      feed_item.visibility = if subject.is_a?(GroupPost)
                               subject.group&.visibility == 'public' ? 'public' : 'group'
                             else
                               'public'
                             end

      feed_item.published_at ||= subject.try(:published_at) || subject.created_at
      feed_item.save!
    end
  end
end
