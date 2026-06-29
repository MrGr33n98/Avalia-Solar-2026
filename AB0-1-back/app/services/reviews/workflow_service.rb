module Reviews
  class WorkflowService
    class WorkflowError < StandardError; end

    MODERATION_STATUSES = %w[pending approved rejected in_analysis flagged contested].freeze
    VERIFICATION_STATUSES = %w[unverified pending in_review manually_verified rejected].freeze

    def initialize(review:, actor:)
      @review = review
      @actor = actor
    end

    def moderate!(status:, notes: nil)
      normalized = status.to_s
      raise WorkflowError, 'Status de moderação inválido.' unless MODERATION_STATUSES.include?(normalized)

      review.with_lock do
        previous = review.status
        review.update!(
          status: normalized,
          moderation_notes: notes.to_s.strip.presence,
          moderated_at: Time.current,
          moderated_by_type: actor.class.name,
          moderated_by_id: actor.id
        )
        audit!(
          'moderation_changed',
          { status: previous },
          { status: normalized, notes: notes.to_s.strip.presence }
        )
      end
      review.reload
    end

    def verify!(status:, notes: nil)
      normalized = status.to_s
      raise WorkflowError, 'Status de verificação inválido.' unless VERIFICATION_STATUSES.include?(normalized)

      review.with_lock do
        previous = review.verification_status
        review.update!(
          verification_status: normalized,
          verified: normalized == 'manually_verified',
          verification_notes: notes.to_s.strip.presence,
          verified_at: normalized == 'manually_verified' ? Time.current : nil,
          verified_by_type: actor.class.name,
          verified_by_id: actor.id
        )
        audit!(
          'verification_changed',
          { status: previous },
          { status: normalized, notes: notes.to_s.strip.presence }
        )
      end
      review.reload
    end

    private

    attr_reader :review, :actor

    def audit!(event_type, previous_value, new_value)
      review.review_audit_events.create!(
        actor: actor,
        event_type: event_type,
        previous_value: previous_value,
        new_value: new_value
      )
    end
  end
end
