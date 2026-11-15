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
      return if message['chat_id'].to_s.end_with?('@g.us') || message['from'].to_s.end_with?('@g.us')

      digest = Digest::SHA256.hexdigest(raw_body)
      record = VoiceReviewMessage.create_with(
        message_type: message['type'].to_s, payload_digest: digest,
        payload_minimal: minimal_payload(message), received_at: Time.current
      ).find_or_create_by!(provider: provider, provider_session: provider_session, provider_message_id: provider_id)

      # Rails 7.0 faz ROLLBACK quando um bloco de transação sai via `return`.
      # Por isso o roteamento usa if/else e nunca retorna de dentro do with_lock.
      record.with_lock do
        unless record.processed_at.present?
          contact = message['from'].to_s
          invite = find_invite(message)

          if invite.nil? && route_onboarding(contact, message)
            record.update!(processed_at: Time.current, delivery_status: 'processed')
          else
            process_voice_review(record, message, contact, provider_id, invite)
          end
        end
      end
    rescue VoiceReviews::SessionService::Error => e
      record&.update(processed_at: Time.current, delivery_status: 'ignored', processing_error_code: 'invalid_invite')
      Rails.logger.info("[VoiceReviews] ignored message=#{message['id']} reason=#{e.message}")
    rescue ActiveRecord::RecordInvalid => e
      record&.update(processed_at: Time.current, delivery_status: 'ignored', processing_error_code: 'invalid_message')
      Rails.logger.info("[VoiceReviews] invalid message=#{message['id']} reason=#{e.record.errors.full_messages.join(', ')}")
    rescue ActiveRecord::RecordNotUnique
      retry
    end

    # Retorna true quando a mensagem pertence ao fluxo de cadastro/reivindicação B2B.
    def route_onboarding(contact, message)
      return false unless defined?(B2b::OnboardingSessionService)

      onboarding_session = B2b::OnboardingSessionService.find_active_by_contact(contact)
      if onboarding_session
        B2b::OnboardingSessionService.process_message!(onboarding_session, message)
        return true
      end

      text_body = extract_text_content(message)
      if text_body.match?(/\A(?:CADASTRAR|CADASTRO|NOVO CADASTRO|SOU INTEGRADOR|QUERO CADASTRAR)\b/i)
        open_onboarding(contact, message)
        return true
      end

      if text_body.match?(/\A(?:REIVINDICAR|REIVINDICACAO|REIVINDICAÇÃO|ASSUMIR PERFIL)\b/i)
        cnpj_inline = text_body.gsub(/\D/, '')
        B2b::OnboardingSessionService.open_claim!(
          contact: contact,
          provider: provider,
          provider_session: provider_session,
          provider_chat_id: message['chat_id'],
          sender_name: message['sender_name'],
          cnpj: (cnpj_inline.length == 14 ? cnpj_inline : nil)
        )
        return true
      end

      if text_body.gsub(/\D/, '').length == 14 && find_existing_session(contact).nil?
        session = open_onboarding(contact, message, skip_greeting: true)
        B2b::OnboardingSessionService.process_message!(session, message)
        return true
      end

      false
    end

    def open_onboarding(contact, message, skip_greeting: false)
      B2b::OnboardingSessionService.open!(
        contact: contact,
        provider: provider,
        provider_session: provider_session,
        provider_chat_id: message['chat_id'],
        sender_name: message['sender_name'],
        skip_greeting: skip_greeting
      )
    end

    def process_voice_review(record, message, contact, provider_id, invite)
      if invite && defined?(B2b::OnboardingSessionService)
        # Código de convite tem prioridade: encerra cadastro B2B pendente do mesmo contato.
        B2b::OnboardingSessionService.find_active_by_contact(contact)&.update!(state: 'abandoned')
      end

      session = if invite
                  VoiceReviews::SessionService.open!(invite:, provider_contact: contact, provider_message_id: provider_id,
                                                     provider: provider, provider_session: provider_session,
                                                     provider_chat_id: message['chat_id'])
                else
                  find_existing_session(contact)
                end
      record.update!(voice_review_session: session) if session && record.voice_review_session_id.blank?
      if session && message['sender_name'].present? && session.draft_payload.to_h['reviewer_name'].blank?
        session.merge_draft!(reviewer_name: message['sender_name'])
      end
      if invite
        send_consent_prompt(session) if session.awaiting_consent? && !session.consented_to_audio?
      elsif session
        process_message(record, session, message)
      elsif defined?(Whatsapp::ConversationRouter)
        Whatsapp::ConversationRouter.call(
          provider: provider,
          provider_session: provider_session,
          contact: contact,
          message: message,
          record: record
        )
      end
      record.update!(processed_at: Time.current, delivery_status: 'processed')
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
        .where.not(state: %w[completed submitted expired revoked abandoned failed_permanent])
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
      return handle_human_handoff(session) if cleaned.match?(/\A(?:AJUDA|ATENDENTE|HUMANO|SUPORTE|FALAR COM PESSOA)\b/i)
      return handle_confirmation_reply(session, cleaned) if session.awaiting_confirmation?

      if session.submitted? || session.completed?
        fname = reviewer_first_name(session)
        hello = fname ? "Olá, *#{fname}*! 👋" : "Olá! 👋"
        msg = "#{hello} Sua avaliação para a *#{session.company.name}* foi recebida e está em análise.\n\n" \
              "Você pode visualizá-la no diretório auditado do *Avalia Solar*. Muito obrigado pelo seu feedback!"
        gateway.send_message(session, msg)
        return
      end

      if session.awaiting_audio?
        handle_text_review_submission(record, session, cleaned)
        return
      end

      return unless session.awaiting_consent?

      unless session.consented_to_audio?
        if cleaned.match?(/\A(ACEITO|CONCORDO|AUTORIZO)\z/i)
          VoiceReviewConsent.create!(
            voice_review_session: session, purpose: 'process_audio', granted: true,
            policy_version: VoiceReviews::Config.policy_version, voice_review_message: record,
            granted_at: Time.current
          )
          session.update!(processing_consent_at: Time.current, version: session.version + 1)
          send_audit_greeting(session)
        else
          send_consent_prompt(session)
        end
        return
      end

      rating = extract_rating(cleaned)
      if rating
        session.merge_draft!(error_strikes: 0)
        advance_criterion_or_prompt_audio!(record, session, rating)
      elsif cleaned.length >= 25 && !cleaned.match?(/\A(?:ACEITO|SIM|OK|CONCORDO|COMEÇAR|INICIAR)\b/i)
        # Atalho Express (GAP-03): se o usuário já escreveu um relato completo após dar consentimento, aceita imediatamente.
        session.merge_draft!(error_strikes: 0)
        handle_text_review_submission(record, session, cleaned)
      elsif cleaned.match?(/\A(ACEITO|SIM|OK|CONCORDO|COMEÇAR|INICIAR)\z/i)
        current_idx = session.draft_payload.to_h['current_criterion_index'].to_i
        if current_idx.positive?
          criteria = session_criteria(session)
          curr = criteria[current_idx] || criteria.first
          msg = curr ? criterion_prompt(session, curr, current_idx + 1, criteria.length) : fallback_greeting(session)
          gateway.send_message(session, msg)
        else
          send_audit_greeting(session)
        end
      else
        strikes = session.draft_payload.to_h['error_strikes'].to_i + 1
        session.merge_draft!(error_strikes: strikes)
        criteria = session_criteria(session)
        current_idx = session.draft_payload.to_h['current_criterion_index'].to_i
        curr = criteria[current_idx] || criteria.first
        title = curr&.title || 'este critério'
        name = session.company.name
        escalation_hint = strikes >= 3 ? "\n\n💡 *Precisa de ajuda?* Responda *AJUDA* para falar com nossa equipe ou *PARAR* para encerrar." : ''
        gateway.send_message(
          session,
          "Para avaliar a *#{name}*, por favor responda com uma nota de *1 a 5 estrelas* para o critério *#{title}* ⭐\n\n*(Ou envie um áudio/relato escrito contando sua experiência a qualquer momento)*#{escalation_hint}"
        )
      end
    end

    def handle_human_handoff(session)
      session.update!(state: 'needs_human_review', version: session.version + 1)
      VoiceReviews::EventRecorder.record!(
        event_name: 'voice_session_human_handoff',
        company: session.company,
        session: session,
        dedupe_key: "handoff:#{session.id}:#{session.version}"
      )
      gateway.send_message(
        session,
        "👩‍💻 *Atendimento Humano Solicitado*\n\n" \
        "Pausamos o assistente automático e sinalizamos nossa equipe de suporte para ajudar você.\n" \
        "Se preferir encerrar a avaliação a qualquer momento, responda *PARAR*."
      )
    end

    def extract_rating(cleaned)
      case cleaned.to_s.strip.downcase
      when /\A(?:nota\s*)?1(?:\s*estrelas?)?\z/, /\A(?:um|uma|p[eé]ssim[oa])\z/ then 1
      when /\A(?:nota\s*)?2(?:\s*estrelas?)?\z/, /\A(?:dois|duas|ruim)\z/ then 2
      when /\A(?:nota\s*)?3(?:\s*estrelas?)?\z/, /\A(?:tr[eê]s|regular|m[eé]di[oa])\z/ then 3
      when /\A(?:nota\s*)?4(?:\s*estrelas?)?\z/, /\A(?:quatro|bo[am])\z/ then 4
      when /\A(?:nota\s*)?5(?:\s*estrelas?)?\z/, /\A(?:cinco|[oó]tim[oa]|excelente|top)\z/ then 5
      else
        match = cleaned.match(/\b([1-5])\b/)
        match ? match[1].to_i : nil
      end
    end

    def session_criteria(session)
      criteria = ReviewForms::CriteriaResolver.call(review_form: session.review_form)
      if criteria.empty?
        cat = session.review_form.experience_category || session.company.primary_category
        criteria = RatingCriterion.active.where(category: cat).order(:id).to_a if cat
      end
      if criteria.empty?
        criteria = RatingCriterion.active.where(category_id: 70).order(:id).to_a
      end
      order_slugs = %w[atendimento qualidade_tecnica prazo custo_beneficio]
      criteria = criteria.sort_by { |c| order_slugs.index(c.slug) || 99 }
      criteria.first(4)
    end

    def send_consent_prompt(session)
      privacy_url = "#{VoiceReviews::Config.frontend_origin}/privacy"
      gateway.send_message(
        session,
        "Sou o assistente de avaliações do Avalia Solar. Você pode avaliar *#{session.company.name}* " \
        "por texto ou áudio. Suas mensagens serão tratadas para registrar a avaliação; " \
        "áudios poderão ser transcritos e organizados com auxílio de IA. " \
        "Nada será publicado sem sua confirmação e moderação. " \
        "Veja o aviso de privacidade: #{privacy_url}\n\n" \
        "Para começar, responda *ACEITO*. Para encerrar, responda *PARAR*."
      )
    end

    def send_audit_greeting(session)
      criteria = session_criteria(session)
      session.merge_draft!(current_criterion_index: 0)
      first_criterion = criteria.first
      msg = if first_criterion
              criterion_prompt(session, first_criterion, 1, criteria.length)
            else
              fallback_greeting(session)
            end
      gateway.send_message(session, msg)
    end

    def fallback_greeting(session)
      name = session.company.name
      fname = reviewer_first_name(session)
      hello = fname ? "Olá, *#{fname}*! 👋" : 'Olá! 👋'
      privacy = "#{VoiceReviews::Config.frontend_origin}/privacy"
      "#{hello} A *#{name}* convidou você para registrar uma avaliação oficial no diretório auditado " \
      "do *Avalia Solar*.\n\nDe *1 a 5 estrelas*, qual sua nota geral para a entrega da *#{name}*?\n" \
      "*(Responda de 1 a 5 ou mande um áudio a qualquer momento. Consulte #{privacy})*"
    end

    def criterion_prompt(session, criterion, current_step, total_steps)
      name = session.company.name
      fname = reviewer_first_name(session)
      greeting = fname ? "Olá, *#{fname}*! 👋 " : "Olá! 👋 "

      question_text = case criterion.slug.to_s
                      when 'atendimento'
                        "De *1 a 5 estrelas*, como você avalia o *Atendimento* e a atenção da equipe da *#{name}*?"
                      when 'qualidade_tecnica'
                        "De *1 a 5 estrelas*, qual sua nota para a *Qualidade Técnica* dos equipamentos e da instalação da *#{name}*?"
                      when 'prazo'
                        "De *1 a 5 estrelas*, como foi o cumprimento do *Prazo de Entrega* e instalação da *#{name}*?"
                      when 'custo_beneficio'
                        "De *1 a 5 estrelas*, qual nota você dá para a transparência e o *Custo-Benefício* geral da *#{name}*?"
                      else
                        "De *1 a 5 estrelas*, qual sua nota para *#{criterion.title}* na entrega da *#{name}*?"
                      end

      if current_step == 1
        intro = "#{greeting}Sou o assistente virtual do *Avalia Solar*.\n" \
                "A *#{name}* convidou você para registrar uma avaliação oficial sobre a instalação da sua usina solar.\n\n" \
                "São apenas #{total_steps} perguntas rápidas (menos de 1 minuto) para auditarmos a entrega:\n\n"
        "#{intro}⭐ *Pergunta #{current_step} de #{total_steps} — #{criterion.title}:*\n#{question_text}\n\n" \
          "*(Responda com uma nota de 1 a 5, ou se preferir, envie um áudio a qualquer momento)*"
      else
        feedback = feedback_for_step(current_step)
        "#{feedback}\n\n⭐ *Pergunta #{current_step} de #{total_steps} — #{criterion.title}:*\n#{question_text}"
      end
    end

    def feedback_for_step(step)
      case step
      when 2 then "Ótimo! Nota registrada para Atendimento. 👍"
      when 3 then "Perfeito! Nota registrada para Qualidade Técnica. ⏱️"
      when 4 then "Show de bola! Nota registrada para Prazo. Última pergunta... 💰"
      else "Muito bem! Nota registrada. ⭐"
      end
    end

    def advance_criterion_or_prompt_audio!(record, session, rating)
      criteria = session_criteria(session)
      draft = session.draft_payload.to_h
      scores = (draft['criterion_scores'] || {}).dup
      current_idx = draft['current_criterion_index'].to_i

      current_criterion = criteria[current_idx] || criteria.first
      scores[current_criterion.slug] = rating if current_criterion

      next_idx = current_idx + 1

      if next_idx < criteria.length
        session.merge_draft!(criterion_scores: scores, current_criterion_index: next_idx)
        session.update!(processing_consent_at: session.processing_consent_at || Time.current, version: session.version + 1)
        next_criterion = criteria[next_idx]
        msg = criterion_prompt(session, next_criterion, next_idx + 1, criteria.length)
        gateway.send_message(session, msg)
      else
        avg_rating = (scores.values.map(&:to_f).sum / [scores.values.length, 1].max).round
        session.merge_draft!(criterion_scores: scores, initial_rating: avg_rating, current_criterion_index: next_idx)
        session.update!(state: 'awaiting_audio', processing_consent_at: session.processing_consent_at || Time.current,
                        version: session.version + 1)
        VoiceReviews::EventRecorder.record!(event_name: 'voice_consent_granted', company: session.company, session:,
                                            dedupe_key: "consent:#{session.id}:#{session.version}:process_audio")
        gateway.send_message(session, build_all_criteria_completed_prompt(session, scores, criteria))
      end
    end

    def build_all_criteria_completed_prompt(session, scores, criteria)
      name = session.company.name
      fname = reviewer_first_name(session)
      greeting = fname ? "Sensacional, *#{fname}*! " : "Sensacional! "

      lines = criteria.map do |c|
        val = scores[c.slug] || 5
        "• *#{c.title}:* #{val}/5"
      end.join("\n")

      avg = (scores.values.map(&:to_f).sum / [scores.values.length, 1].max).round(1)

      "#{greeting}Todas as suas notas para a *#{name}* foram registradas com sucesso: ⭐\n\n" \
      "#{lines}\n" \
      "⭐ *Média Geral:* #{avg} / 5.0\n\n" \
      "Agora, para receber o selo *Avaliação Verificada via WhatsApp* na página da *#{name}*, " \
      "**mande um áudio rápido de 20 a 40 segundos** contando detalhes da sua experiência e como está a geração da usina! 🎙️\n\n" \
      "*(Ou se preferir, envie uma mensagem de texto com seu relato)*"
    end

    def handle_text_review_submission(record, session, text)
      if text.length < 5
        gateway.send_message(
          session,
          "Mande um áudio de *20 a 40 segundos* contando como foi a instalação e o atendimento, ou digite um comentário mais detalhado. 🎙️"
        )
        return
      end

      session.merge_draft!(text_review_comment: text)
      asset = VoiceReviewAsset.create!(voice_review_session: session, provider_media_id: "text-#{record.id}",
                                       storage_key: "voice-reviews/#{session.id}/text-#{record.id}",
                                       sha256: Digest::SHA256.hexdigest(text), mime_type: 'text/plain',
                                       byte_size: text.bytesize, purge_after_at: 30.days.from_now)
      structured = VoiceReviews::StructuredExtractor.call(
        raw_text: text,
        company_name: session.company.name,
        review_form: session.review_form,
        initial_rating: session.draft_rating || 5
      )
      transcript = VoiceReviewTranscript.create!(
        voice_review_session: session, voice_review_asset: asset, provider: 'text_input',
        model_id: 'structured-v1', language: 'pt-BR', private_raw_text: text,
        structured_payload: structured, version: (session.latest_transcript&.version || 0) + 1
      )
      session.update!(state: 'awaiting_confirmation', version: session.version + 1)
      ContinuationLink.send!(session, transcript)
    end

    def criteria_bullets(session)
      items = session_criteria(session).map(&:title)
      items = ['Atendimento', 'Prazo de Entrega', 'Qualidade Técnica', 'Equipamentos escolhidos'] if items.empty?
      items.first(5).map { |title| "• *#{title}*" }.join("\n")
    end

    def reviewer_first_name(session)
      raw = session.draft_payload.to_h['reviewer_name'].to_s.strip
      if raw.blank? && session.voice_review_invite.respond_to?(:customer_name)
        raw = session.voice_review_invite.customer_name.to_s.strip
      end
      raw.split.first.presence
    end

    def handle_confirmation_reply(session, cleaned)
      if cleaned.match?(/\A(SIM|1|APROVAR|CONFIRMAR|PUBLICAR)\z/i)
        VoiceReviews::ConfirmationService.confirm_from_whatsapp!(session: session)
        msg = '✅ *Avaliação recebida!* O texto foi confirmado e enviado para moderação. ' \
              "Você poderá encontrá-lo na página da *#{session.company.name}* após a aprovação."
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

    def process_audio(record, session, audio)
      unless session.consented_to_audio?
        send_consent_prompt(session)
        return
      end
      return unless session.awaiting_audio? || session.awaiting_consent?

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

    def extract_text_content(message)
      return '' unless message.is_a?(Hash)

      raw = message['body'] || message['text']
      if raw.is_a?(Hash)
        raw['body'].to_s.strip
      else
        raw.to_s.strip
      end
    end

    def minimal_payload(message)
      chat_id = message['chat_id'].to_s
      chat_id_hash = if chat_id.present?
                       OpenSSL::HMAC.hexdigest('SHA256', VoiceReviews::Config.contact_pepper.to_s, chat_id)
                     end
      { 'id' => message['id'], 'type' => message['type'], 'timestamp' => message['timestamp'],
        'chat_id_hash' => chat_id_hash, 'audio_id' => message.dig('audio', 'id'),
        'audio_mime_type' => message.dig('audio', 'mime_type') }.compact
    end
  end
end
