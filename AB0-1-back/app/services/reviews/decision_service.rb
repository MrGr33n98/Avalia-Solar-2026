module Reviews
  class DecisionService
    def approve!(review)
      update_status(review, :approved)
    end

    def reject!(review)
      update_status(review, :rejected)
    end

    def flag!(review)
      update_status(review, :flagged)
    end

    private

    def update_status(review, status)
      # We use update! to ensure we bypass validations or handle them, but usually update is fine.
      # If there are specific moderation validations, handle them.
      previous_status = review.status
      review.status = status
      if review.save(validate: false)
        log_action(review, previous_status, status)
      else
        Rails.logger.error("DecisionService failed to update review #{review.id} to #{status}: #{review.errors.full_messages}")
      end
    end

    def log_action(review, previous_status, action)
      Rails.logger.info("ReviewModeration: Review #{review.id} marked as #{action}")
      ReviewAuditEvent.create!(
        review: review,
        event_type: 'moderation_changed',
        previous_value: { status: previous_status },
        new_value: { status: action.to_s },
        metadata: { automated: true }
      )
    rescue StandardError => e
      Rails.logger.warn("Failed to audit moderation for review #{review.id}: #{e.message}")
    end
  end
end
