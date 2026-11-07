module VoiceReviews
  class TranscribeJob < ApplicationJob
    queue_as :voice_reviews

    retry_on StandardError, wait: :polynomially_longer, attempts: 3

    def perform(asset_id)
      return unless VoiceReviews::Config.enabled?

      session = nil
      asset = VoiceReviewAsset.includes(:voice_review_session).find(asset_id)
      session = asset.voice_review_session
      return unless session.active_now? && session.consented_to_audio?

      VoiceReviews::MediaDownloader.provider.download!(asset) unless asset.file.attached?
      session.update!(state: 'transcribing', version: session.version + 1)
      result = VoiceReviews::SpeechToText.provider.transcribe(asset)
      transcript = session.voice_review_transcripts.create!(voice_review_asset: asset, provider: result[:provider],
                                                            model_id: result[:model_id], language: result[:language],
                                                            private_raw_text: result[:text], version: next_version(session))
      session.update!(state: 'awaiting_confirmation', version: session.version + 1)
      VoiceReviews::EventRecorder.record!(event_name: 'voice_transcription_ready', company: session.company, session:,
                                          dedupe_key: "transcript:#{transcript.id}", properties: { provider: result[:provider], model_id: result[:model_id] })
      session.issue_new_token!
      VoiceReviews::ContinuationLink.send!(session, transcript)
    rescue StandardError
      session&.update(state: 'failed_retryable')
      raise
    end

    private

    def next_version(session)
      VoiceReviewTranscript.where(voice_review_session_id: session.id).maximum(:version).to_i + 1
    end
  end
end
