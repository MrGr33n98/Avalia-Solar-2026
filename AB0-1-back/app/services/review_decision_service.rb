class ReviewDecisionService
  class PermissionError < StandardError; end
  class DecisionError < StandardError; end

  attr_reader :review, :admin_user, :notes, :lock_version

  def initialize(review:, admin_user:, notes: nil, lock_version: nil)
    @review = review
    @admin_user = admin_user
    @notes = notes
    @lock_version = lock_version
  end

  def approve!
    perform_decision(:approved)
  end

  def reject!
    perform_decision(:rejected)
  end

  private

  def perform_decision(new_status)
    raise PermissionError, 'Admin user required for review moderation' unless admin_user

    previous_status = review.status
    Review.transaction do
      review.lock_version = lock_version if lock_version.present?
      review.update!(status: new_status)

      ReviewDecisionLog.create!(
        review: review,
        admin_user: admin_user,
        action: new_status.to_s,
        previous_status: previous_status,
        new_status: new_status.to_s,
        notes: notes
      )

      notify_review_owner(previous_status, new_status)
    end
    review.reload
  rescue ActiveRecord::StaleObjectError
    raise DecisionError, 'Review was already updated by another moderator'
  end

  def notify_review_owner(previous_status, new_status)
    return unless review.user

    ReviewDecisionNotifier.with(
      review: review,
      previous_status: previous_status,
      new_status: new_status.to_s,
      admin_name: admin_user.name
    ).deliver_later(review.user)

    ReviewDecisionMailer.with(
      review: review,
      previous_status: previous_status,
      new_status: new_status.to_s,
      notes: notes,
      admin_name: admin_user.name
    ).decision_notification.deliver_later
  rescue StandardError => e
    Rails.logger.error("[ReviewDecisionService] failed to notify user: #{e.message}")
  end
end
