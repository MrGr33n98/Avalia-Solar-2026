module VoiceReviews
  class SessionService
    class Error < StandardError; end

    def self.open!(invite:, provider_contact:, provider_message_id:, provider: VoiceReviews::Config.provider,
                   provider_session: nil, provider_chat_id: nil)
      new(invite:, provider_contact:, provider_message_id:, provider:, provider_session:, provider_chat_id:).open!
    end

    def initialize(invite:, provider_contact:, provider_message_id:, provider:, provider_session:, provider_chat_id:)
      @invite = invite
      @provider_contact = provider_contact.to_s
      @provider_message_id = provider_message_id.to_s
      @provider = provider.to_s
      @provider_session = provider_session.to_s.presence
      @provider_chat_id = provider_chat_id.to_s.presence || @provider_contact
    end

    def open!
      VoiceReviewSession.transaction do
        session = VoiceReviewSession.find_or_initialize_by(
          voice_review_invite: invite, provider: @provider, provider_session: @provider_session,
          provider_contact_hash: contact_hash
        )
        raise Error, 'Convite inválido ou expirado' unless invite.claimable?

        if session.persisted?
          if session.submitted? || session.completed? || session.published_review_id.present? || session.voice_review_publication.present? || session.active_now?
            session
          else
            reopen_inactive_session!(session)
          end
        else
          raw_token = SecureRandom.urlsafe_base64(32)
          session.assign_attributes(company: invite.company, review_form: invite.review_form,
                                    state: 'awaiting_consent', expires_at: 24.hours.from_now,
                                    draft_payload: { 'current_criterion_index' => 0, 'criterion_scores' => {} },
                                    session_token_digest: VoiceReviewSession.digest_token(raw_token),
                                    provider_contact_ciphertext: encrypt(provider_contact),
                                    provider_chat_id: @provider_chat_id,
                                    last_inbound_at: Time.current)
          session.provider_session = @provider_session
          session.raw_session_token = raw_token
          session.save!
          invite.increment!(:claims_count)
          VoiceReviews::EventRecorder.record!(event_name: 'voice_session_started', company: invite.company, invite:, session:,
                                              dedupe_key: "session-started:#{session.id}", properties: { provider: @provider })
          session
        end
      rescue ActiveRecord::RecordNotUnique
        retry
      end
    end

    private

    attr_reader :invite, :provider_contact, :provider_message_id, :provider, :provider_session, :provider_chat_id

    def reopen_inactive_session!(session)
      raw_token = SecureRandom.urlsafe_base64(32)
      session.voice_review_consents.where(revoked_at: nil).update_all(revoked_at: Time.current)
      session.assign_attributes(
        state: 'awaiting_consent',
        processing_consent_at: nil,
        expires_at: 24.hours.from_now,
        draft_payload: { 'current_criterion_index' => 0, 'criterion_scores' => {} },
        session_token_digest: VoiceReviewSession.digest_token(raw_token),
        provider_chat_id: @provider_chat_id,
        last_inbound_at: Time.current,
        version: session.version + 1
      )
      session.raw_session_token = raw_token
      session.save!
      VoiceReviews::EventRecorder.record!(
        event_name: 'voice_session_reopened',
        company: invite.company,
        invite: invite,
        session: session,
        dedupe_key: "session-reopened:#{session.id}:#{session.version}",
        properties: { provider: @provider }
      )
      session
    end

    def contact_hash
      OpenSSL::HMAC.hexdigest('SHA256', VoiceReviews::Config.contact_pepper.to_s, provider_contact)
    end

    def encrypt(value)
      encryptor = ActiveSupport::MessageEncryptor.new(Rails.application.key_generator.generate_key('voice-review-contact', 32))
      encryptor.encrypt_and_sign(value)
    end
  end
end
