module VoiceReviews
  class MetricsService
    STATES = %w[opened awaiting_consent awaiting_audio audio_received transcribing awaiting_confirmation draft_confirmed
                submitted completed expired revoked abandoned failed_retryable failed_permanent needs_human_review].freeze

    def self.call(company:, from_date:, to_date:)
      scope = VoiceReviewSession.where(company:).where(created_at: from_date.beginning_of_day..to_date.end_of_day)
      invites = VoiceReviewInvite.where(company:).where(created_at: from_date.beginning_of_day..to_date.end_of_day)
      reviews = Review.where(company:).where(created_at: from_date.beginning_of_day..to_date.end_of_day)
      counts = scope.group(:state).count
      {
        company_id: company.id,
        period: { from: from_date.to_date, to: to_date.to_date },
        invites_created: invites.count,
        sessions_started: scope.count,
        consented: scope.joins(:voice_review_consents).where(voice_review_consents: { purpose: 'process_audio', granted: true }).distinct.count,
        audio_received: counts.fetch('audio_received', 0) + counts.fetch('transcribing', 0) + counts.fetch('awaiting_confirmation', 0) + counts.fetch('submitted', 0),
        transcript_ready: counts.fetch('awaiting_confirmation', 0) + counts.fetch('submitted', 0),
        confirmed: counts.fetch('submitted', 0) + counts.fetch('completed', 0),
        submitted: counts.fetch('submitted', 0) + counts.fetch('completed', 0),
        approved: reviews.where(capture_flow_source: 'whatsapp_voice', status: 'approved').count,
        rejected: reviews.where(capture_flow_source: 'whatsapp_voice', status: 'rejected').count,
        unknown: reviews.where(capture_flow_source: 'whatsapp_voice', status: 'in_analysis').count,
        attribution_note: 'Clique no WhatsApp não equivale a sessão, áudio ou avaliação publicada.'
      }
    end
  end
end
