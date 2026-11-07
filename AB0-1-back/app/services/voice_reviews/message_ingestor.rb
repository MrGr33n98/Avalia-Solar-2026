module VoiceReviews
  class MessageIngestor
    MAX_MESSAGES = 50

    def self.call(provider:, provider_session:, raw_body:, messages:)
      new(provider:, provider_session:, raw_body:, messages:).call
    end

    def initialize(provider:, provider_session:, raw_body:, messages:)
      @provider = provider.to_s
      @provider_session = provider_session.to_s.presence
      @raw_body = raw_body.to_s
      @messages = messages
    end

    def call
      raise WebhookIngestor::InvalidEnvelope, 'Muitas mensagens no envelope' if messages.length > MAX_MESSAGES

      messages.each { |message| ingest_message(message) }
      true
    end

    private

    attr_reader :provider, :provider_session, :raw_body, :messages

    def ingest_message(message)
      provider_id = message['id'].to_s
      return if provider_id.blank? || message['from_me']

      digest = Digest::SHA256.hexdigest(raw_body)
      record = VoiceReviewMessage.create_with(
        message_type: message['type'].to_s, payload_digest: digest,
        payload_minimal: minimal_payload(message), received_at: Time.current
      ).find_or_create_by!(provider: provider, provider_session: provider_session, provider_message_id: provider_id)
      return if record.processed_at.present?

      contact = message['from'].to_s
      invite = find_invite(message)
      session = if invite
        VoiceReviews::SessionService.open!(invite:, provider_contact: contact, provider_message_id: provider_id,
                                           provider: provider, provider_session: provider_session,
                                           provider_chat_id: message['chat_id'])
      else
        find_existing_session(contact)
      end
      record.update!(voice_review_session: session) if session && record.voice_review_session_id.blank?
      process_message(record, session, message) if session
      record.update!(processed_at: Time.current, delivery_status: 'processed')
    rescue VoiceReviews::SessionService::Error => e
      record&.update(processed_at: Time.current, delivery_status: 'ignored', processing_error_code: 'invalid_invite')
      Rails.logger.info("[VoiceReviews] ignored message=#{message['id']} reason=#{e.message}")
    rescue ActiveRecord::RecordInvalid => e
      record&.update(processed_at: Time.current, delivery_status: 'ignored', processing_error_code: 'invalid_message')
      Rails.logger.info("[VoiceReviews] invalid message=#{message['id']} reason=#{e.record.errors.full_messages.join(', ')}")
    rescue ActiveRecord::RecordNotUnique
      retry
    end

    def find_invite(message)
      return nil unless message['type'] == 'text'

      code = message['text'].to_s.match(/\b(AVS\s+)?(RV[A-Za-z0-9_-]{8,64})\b/i)&.captures&.last
      return nil if code.blank?

      digest = OpenSSL::HMAC.hexdigest('SHA256', VoiceReviews::Config.contact_pepper.to_s, code)
      VoiceReviewInvite.find_by(code_digest: digest)
    end

    def find_existing_session(contact)
      hash = OpenSSL::HMAC.hexdigest('SHA256', VoiceReviews::Config.contact_pepper.to_s, contact.to_s)
      sessions = VoiceReviewSession.where(provider: provider, provider_session: provider_session, provider_contact_hash: hash)
        .where('expires_at > ?', Time.current)
        .where.not(state: %w[completed expired revoked abandoned failed_permanent])
        .order(last_inbound_at: :desc, created_at: :desc)
      return sessions.first if sessions.first&.active_now?

      nil
    end

    def process_message(record, session, message)
      case message['type']
      when 'text' then process_text(record, session, message['text'].to_s)
      when 'audio' then process_audio(record, session, message.fetch('audio', {}))
      end
    end

    def process_text(record, session, body)
      return unless session.awaiting_consent? || session.awaiting_audio?

      if body.strip.match?(/\A(ACEITO|SIM)\z/i)
        VoiceReviewConsent.create!(voice_review_session: session, purpose: 'process_audio', granted: true,
                                   policy_version: VoiceReviews::Config.policy_version, voice_review_message: record,
                                   granted_at: Time.current)
        session.update!(state: 'awaiting_audio', processing_consent_at: Time.current, version: session.version + 1)
        VoiceReviews::EventRecorder.record!(event_name: 'voice_consent_granted', company: session.company, session:,
                                            dedupe_key: "consent:#{session.id}:process_audio")
        gateway.send_message(
          session, 'Obrigado. Agora envie um áudio curto contando o que funcionou e o que poderia melhorar. Não pedimos nota específica.'
        )
      elsif body.strip.match?(/\A(TEXTO|PARAR|NAO|NÃO)\z/i)
        session.update!(state: 'abandoned', version: session.version + 1)
        gateway.send_message(
          session, "Tudo bem. Seu áudio não será transcrito. Você pode avaliar por escrito em #{VoiceReviews::Config.frontend_origin}/f/#{session.review_form.token}."
        )
      elsif session.awaiting_consent?
        gateway.send_message(
          session, "Olá! Este é o canal de avaliações do Avalia Solar para #{session.company.name}. Responda ACEITO para processarmos um áudio privado ou TEXTO para avaliar por escrito. Consulte #{VoiceReviews::Config.frontend_origin}/privacy."
        )
      end
    end

    def process_audio(record, session, audio)
      return session.update!(state: 'failed_permanent') unless session.consented_to_audio?

      asset = VoiceReviewAsset.create!(voice_review_session: session, provider_media_id: audio['id'].to_s,
                                       provider_media_url: audio['media_url'],
                                       storage_key: "voice-reviews/#{session.id}/#{SecureRandom.hex(16)}",
                                       sha256: audio['sha256'].presence || "SYNTHETIC_#{SecureRandom.hex(16)}",
                                       mime_type: audio['mime_type'].to_s,
                                       byte_size: audio['file_size'].to_i.positive? ? audio['file_size'].to_i : 1,
                                       duration_ms: audio['duration_ms'], purge_after_at: 30.days.from_now)
      session.update!(state: 'audio_received', version: session.version + 1)
      VoiceReviews::EventRecorder.record!(event_name: 'voice_audio_received', company: session.company, session:,
                                          dedupe_key: "audio:#{asset.id}", properties: { provider: provider })
      VoiceReviews::TranscribeJob.perform_later(asset.id)
    end

    def gateway
      VoiceReviews::ContinuationLink.gateway(provider: provider)
    end

    def minimal_payload(message)
      { 'id' => message['id'], 'type' => message['type'], 'timestamp' => message['timestamp'],
        'chat_id' => message['chat_id'], 'audio_id' => message.dig('audio', 'id'),
        'audio_mime_type' => message.dig('audio', 'mime_type') }.compact
    end
  end
end
