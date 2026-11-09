module VoiceReviews
  module EventRecorder
    module_function

    def record!(event_name:, company:, dedupe_key:, session: nil, invite: nil, properties: {})
      existing = VoiceReviewEvent.find_by(dedupe_key:)
      return existing if existing

      VoiceReviewEvent.create!(event_name:, company:, voice_review_session: session, voice_review_invite: invite,
                               dedupe_key:, safe_properties: properties.slice(:kind, :channel, :reason_code,
                                                                                :provider, :model_id, :test_mode),
                               occurred_at: Time.current)
    rescue ActiveRecord::RecordNotUnique
      nil
    end
  end
end
