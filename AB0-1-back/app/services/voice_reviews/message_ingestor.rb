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
      cleaned = body.strip
      return handle_opt_out(session) if cleaned.match?(/\A(TEXTO|PARAR|NAO|NÃO)\z/i)
      return handle_confirmation_reply(session, cleaned) if session.awaiting_confirmation?
      return unless session.awaiting_consent? || session.awaiting_audio?

      rating = extract_rating(cleaned)
      if rating || cleaned.match?(/\A(ACEITO|SIM|OK|CONCORDO)\z/i)
        grant_consent_and_prompt_audio!(record, session, rating)
      elsif session.awaiting_consent?
        send_audit_greeting(session)
      end
    end

    def extract_rating(cleaned)
      match = cleaned.match(/\A(?:nota\s*)?([1-5])(?:\s*estrelas?)?\z/i)
      match ? match[1].to_i : nil
    end

    def grant_consent_and_prompt_audio!(record, session, rating)
      unless session.consented_to_audio?
        VoiceReviewConsent.create!(voice_review_session: session, purpose: 'process_audio', granted: true,
                                   policy_version: VoiceReviews::Config.policy_version, voice_review_message: record,
                                   granted_at: Time.current)
      end
      session.merge_draft!(initial_rating: rating) if rating
      session.update!(state: 'awaiting_audio', processing_consent_at: session.processing_consent_at || Time.current,
                      version: session.version + 1)
      VoiceReviews::EventRecorder.record!(event_name: 'voice_consent_granted', company: session.company, session:,
                                          dedupe_key: "consent:#{session.id}:process_audio")
      prefix = rating ? "Excelente! Nota *#{rating}/5* registrada. " : 'Obrigado. '
      prompt = "#{prefix}Para publicar seu depoimento sem que você precise digitar nada, " \
               '*mande um áudio rápido de 20 a 40 segundos* contando como foi o atendimento, ' \
               'o prazo da instalação e os equipamentos (inversor/painéis) escolhidos.'
      gateway.send_message(session, prompt)
    end

    def handle_confirmation_reply(session, cleaned)
      if cleaned.match?(/\A(SIM|1|APROVAR|CONFIRMAR|PUBLICAR)\z/i)
        VoiceReviews::ConfirmationService.confirm_from_whatsapp!(session: session)
        msg = '✅ *Avaliação aprovada e enviada para publicação!* Seu depoimento recebeu o selo ' \
              "*Avaliação Verificada via Áudio (WhatsApp)* na página da *#{session.company.name}*. Muito obrigado!"
        gateway.send_message(session, msg)
      elsif cleaned.match?(/\A(2|REGRAVAR|NOVO)\z/i)
        session.update!(state: 'awaiting_audio', version: session.version + 1)
        gateway.send_message(
          session, '🎙️ Tudo certo! Envie um novo áudio de 20 a 40 segundos para substituir o anterior.'
        )
      end
    rescue VoiceReviews::ConfirmationService::Error => e
      Rails.logger.warn("[VoiceReviews] whatsapp confirmation failed session=#{session.id}: #{e.message}")
    end

    def handle_opt_out(session)
      session.update!(state: 'abandoned', version: session.version + 1)
      url = "#{VoiceReviews::Config.frontend_origin}/f/#{session.review_form.token}"
      gateway.send_message(
        session, "Tudo bem. Seu áudio não será transcrito. Você pode avaliar por escrito em #{url}."
      )
    end

    def send_audit_greeting(session)
      name = session.company.name
      privacy = "#{VoiceReviews::Config.frontend_origin}/privacy"
      msg = "Olá! A *#{name}* indicou você para registrar uma avaliação oficial no diretório auditado " \
            "do *Avalia Solar*.\n\nDe *1 a 5 estrelas*, qual sua nota geral para a entrega da *#{name}*?\n" \
            "*(Responda de 1 a 5 ou ACEITO para processarmos um áudio privado, ou TEXTO para avaliar por escrito. " \
            "Consulte #{privacy})*"
      gateway.send_message(session, msg)
    end

    def process_audio(_record, session, audio)
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
      gateway.send_message(
        session, '🎧 Recebi seu áudio! Estou transcrevendo e estruturando sua avaliação em segundos...'
      )
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
