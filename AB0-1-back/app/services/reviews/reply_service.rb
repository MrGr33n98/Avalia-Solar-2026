module Reviews
  class ReplyService
    class ReplyError < StandardError; end

    MAX_LENGTH = 2_000

    def initialize(review:, actor:)
      @review = review
      @actor = actor
    end

    def create!(body)
      normalized = normalize(body)
      review.with_lock do
        raise ReplyError, 'Esta avaliação já possui uma resposta ativa.' if review.reply_active?

        review.update!(reply: normalized, replied_at: Time.current, reply_deleted_at: nil)
        audit!('reply_created', {}, { body: normalized })
      end
      review.reload
    end

    def update!(body)
      normalized = normalize(body)
      review.with_lock do
        raise ReplyError, 'Esta avaliação não possui uma resposta ativa.' unless review.reply_active?

        previous = review.reply
        review.update!(reply: normalized, replied_at: Time.current)
        audit!('reply_updated', { body: previous }, { body: normalized })
      end
      review.reload
    end

    def discard!
      review.with_lock do
        raise ReplyError, 'Esta avaliação não possui uma resposta ativa.' unless review.reply_active?

        review.update!(reply_deleted_at: Time.current)
        audit!('reply_deleted', { body: review.reply }, {})
      end
      review.reload
    end

    private

    attr_reader :review, :actor

    def normalize(body)
      value = body.to_s.strip
      raise ReplyError, 'A resposta não pode ficar em branco.' if value.blank?
      raise ReplyError, "A resposta deve ter no máximo #{MAX_LENGTH} caracteres." if value.length > MAX_LENGTH

      value
    end

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
