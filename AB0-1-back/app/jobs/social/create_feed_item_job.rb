# frozen_string_literal: true

module Social
  class CreateFeedItemJob < ApplicationJob
    queue_as :default

    def perform(subject_type, subject_id, verb: 'published')
      subject_class = subject_type.safe_constantize
      return unless [ReviewerPublication, Review, GroupPost, NewsItem, Poll].include?(subject_class)

      # Do not project reviews/publications into the paused social Feed.
      # Group posts remain independent and retain their own group behavior.
      return if !ReviewsOnlyMvp.feed_enabled? && subject_class != GroupPost

      subject = subject_class.find_by(id: subject_id)
      return unless subject
      return if [NewsItem, Poll].include?(subject_class) && subject.status != 'published'

      # For GroupPost, only create feed item if published
      if subject.is_a?(GroupPost) && !subject.published?
        FeedItem.where(subject: subject).destroy_all
        return
      end

      actor = subject.respond_to?(:actor) ? subject.actor : subject.user

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
