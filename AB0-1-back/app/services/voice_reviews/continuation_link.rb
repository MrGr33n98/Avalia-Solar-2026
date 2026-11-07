module VoiceReviews
  class ContinuationLink
    def self.gateway(provider: nil)
      case provider.to_s.presence || VoiceReviews::Config.provider
      when 'meta' then MetaGateway.new
      when 'waha' then WahaGateway.new
      else FakeGateway.new
      end
    end

    def self.send!(session, _transcript)
      raw_token = session.raw_session_token
      return if raw_token.blank?

      gateway(provider: session.provider).send_message(
        session, "Revise e confirme sua avaliação: #{Config.frontend_origin}/voice-review/#{session.id}?token=#{CGI.escape(raw_token)}"
      )
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
