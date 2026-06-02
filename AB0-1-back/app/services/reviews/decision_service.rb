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
      review.status = status
      if review.save(validate: false)
        log_action(review, status)
      else
        Rails.logger.error("DecisionService failed to update review #{review.id} to #{status}: #{review.errors.full_messages}")
      end
    end

    def log_action(review, action)
      # Optional placeholder: write to an audit log or just Rails.logger
      Rails.logger.info("ReviewModeration: Review #{review.id} marked as #{action}")
      
      # If ReviewDecisionLog exists (as seen in Review model `has_many :review_decision_logs`), we might want to use it
      if defined?(ReviewDecisionLog)
        begin
          ReviewDecisionLog.create!(
            review: review,
            action: action.to_s
          )
        rescue StandardError => e
          Rails.logger.warn("Failed to create ReviewDecisionLog for review #{review.id}: #{e.message}")
        end
      end
    end
  end
end
