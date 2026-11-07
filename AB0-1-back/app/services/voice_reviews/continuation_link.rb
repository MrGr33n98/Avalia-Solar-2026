module VoiceReviews
  class ContinuationLink
    def self.gateway(provider: nil)
      case provider.to_s.presence || VoiceReviews::Config.provider
      when 'meta' then MetaGateway.new
      when 'waha' then WahaGateway.new
      else FakeGateway.new
      end
    end

    def self.send!(session, transcript)
      raw_token = session.raw_session_token
      return if raw_token.blank?

      edit_url = "#{Config.frontend_origin}/voice-review/#{session.id}?token=#{CGI.escape(raw_token)}"
      gateway(provider: session.provider).send_message(session, build_review_card(session, transcript, edit_url))
    end

    def self.build_review_card(session, transcript, edit_url)
      rating = session.draft_rating || transcript&.inferred_rating || 5
      headline = transcript&.headline.presence || "Avaliação sobre #{session.company.name}"
      comment = transcript&.text.to_s.strip
      intro = 'Transformamos seu áudio em uma avaliação estruturada. ' \
              "Veja se está tudo certo antes de publicarmos na página da *#{session.company.name}*:"
      lines = [
        intro,
        '',
        "• *Título sugerido:* #{headline}",
        "• *Depoimento:* \"#{comment}\"",
        "• *Nota Geral:* #{rating}/5",
        format_criteria_line(transcript),
        format_equipment_line(transcript),
        '',
        '👉 Responda *SIM* (ou *1*) para *✅ Aprovar e Publicar*',
        '🎙️ Envie *outro áudio* para *Gravar Novo Áudio*',
        "✏️ Ou edite o texto/notas aqui: #{edit_url}"
      ].compact
      lines.join("\n")
    end

    def self.format_criteria_line(transcript)
      scored = Array(transcript&.inferred_criteria).select { |item| item['score'].to_i.between?(1, 5) }
      return nil if scored.empty?

      summary = scored.map { |item| "#{item['title']}: #{item['score']}/5" }.join(' • ')
      "• *Sub-notas inferidas pelo seu áudio:* #{summary}"
    end

    def self.format_equipment_line(transcript)
      equip = Array(transcript&.mentioned_equipment).reject(&:blank?)
      return nil if equip.empty?

      "• *Equipamento citado:* #{equip.join(', ')}"
    end

    class FakeGateway
      def send_message(session, message)
        Rails.logger.info("[VoiceReviews][fake-gateway] session=#{session.id} message=#{message}")
      end
    end

    class MetaGateway
      def send_message(session, message)
        phone_id = ENV['META_PHONE_NUMBER_ID'].presence
        token = ENV['META_ACCESS_TOKEN'].presence
        raise 'Meta Cloud API não configurada' if phone_id.blank? || token.blank? || session.provider_contact.blank?

        response = HTTParty.post("https://graph.facebook.com/#{ENV.fetch('META_GRAPH_API_VERSION', 'v23.0')}/#{phone_id}/messages",
                                 headers: { 'Authorization' => "Bearer #{token}", 'Content-Type' => 'application/json' },
                                 body: { messaging_product: 'whatsapp', to: session.provider_contact,
                                         type: 'text', text: { body: message } }.to_json)
        raise "Falha ao enviar mensagem Meta (#{response.code})" unless response.success?
        response
      end
    end

    class WahaGateway
      def send_message(session, message)
        api_key = VoiceReviews::Config.waha_api_key
        raise 'WAHA não configurado' if api_key.blank? || session.provider_contact.blank?

        response = HTTParty.post(
          "#{VoiceReviews::Config.waha_base_url}/api/sendText",
          headers: { 'X-Api-Key' => api_key, 'Content-Type' => 'application/json' },
          body: {
            session: session.provider_session.presence || VoiceReviews::Config.waha_session,
            chatId: session.provider_chat_id.presence || session.provider_contact,
            text: message
          }.to_json,
          timeout: 15
        )
        raise "Falha ao enviar mensagem WAHA (#{response.code})" unless response.success?

        response
      rescue HTTParty::Error, Net::OpenTimeout, Net::ReadTimeout => e
        raise "Falha de conexão com WAHA: #{e.class}"
      end
    end
  end
end
