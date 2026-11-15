# frozen_string_literal: true

module Whatsapp
  class ConversationRouter
    TransientSession = Struct.new(:id, :provider, :provider_session, :provider_chat_id, :provider_contact, keyword_init: true)

    def self.call(provider:, provider_session:, contact:, message:, record: nil)
      new(provider: provider, provider_session: provider_session, contact: contact, message: message, record: record).call
    end

    def initialize(provider:, provider_session:, contact:, message:, record: nil)
      @provider = provider.to_s.presence || 'waha'
      @provider_session = provider_session
      @contact = contact.to_s.strip
      @message = message.is_a?(Hash) ? message : {}
      @record = record
      @text = extract_text(@message)
    end

    def call
      return false if @text.blank?

      classification = Whatsapp::HybridIntentClassifier.call(@text)
      case classification[:intent]
      when 'human_support'
        handle_human_support
        true
      when 'register_company'
        handle_register_company(classification[:slots])
        true
      when 'claim_company'
        handle_claim_company(classification[:slots])
        true
      when 'check_brand_page'
        handle_check_brand_page(classification[:slots])
        true
      when 'ask_plans_pricing'
        handle_ask_plans_pricing
        true
      when 'evaluate_company'
        handle_evaluate_company(classification[:slots])
        true
      when 'welcome_menu'
        send_welcome_menu
        true
      else
        send_welcome_menu
        true
      end
    end

    private

    def handle_human_support
      active_onboarding = B2b::OnboardingSessionService.find_active_by_contact(@contact)
      active_onboarding&.update!(state: 'needs_human_review')

      msg = "👩‍💻 *Atendimento Humano — Avalia Solar*\n\n" \
            "Recebemos sua solicitação de ajuda! Nossa equipe de suporte e consultoria já foi sinalizada.\n\n" \
            "• Para urgências comerciais ou suporte ao integrador, você também pode escrever para *growth@avaliasolar.com.br*.\n" \
            "• Para voltar ao menu automático a qualquer momento, digite *MENU*."
      send_reply(msg)
    end

    def handle_register_company(slots)
      has_cnpj = slots[:cnpj].present?
      session = B2b::OnboardingSessionService.open!(
        contact: @contact,
        provider: @provider,
        provider_session: @provider_session,
        provider_chat_id: @message['chat_id'],
        sender_name: @message['sender_name'],
        skip_greeting: has_cnpj
      )
      B2b::OnboardingSessionService.process_message!(session, @message) if has_cnpj
    end

    def handle_claim_company(slots)
      B2b::OnboardingSessionService.open_claim!(
        contact: @contact,
        provider: @provider,
        provider_session: @provider_session,
        provider_chat_id: @message['chat_id'],
        sender_name: @message['sender_name'],
        cnpj: slots[:cnpj]
      )
    end

    def handle_check_brand_page(slots)
      company = resolve_company(slots)
      if company
        url = B2b::OnboardingSessionService.company_public_url(company)
        rating = company.rating_avg.to_f.round(1)
        count = company.rating_count.to_i
        status_label = company.moderation_approved? ? 'Verificado ✅' : 'Em análise de moderação ⏳'

        msg = "🏢 *Perfil no Avalia Solar — #{company.name}*\n\n" \
              "• *Localização:* #{company.city}/#{company.state}\n" \
              "• *Status do Perfil:* #{status_label}\n" \
              "• *Nota Auditada:* ⭐ #{rating} / 5.0 (#{count} avaliações)\n" \
              "• *Página Pública (Brand Page):* #{url}\n\n" \
              "Deseja gerenciar este perfil? Responda *REIVINDICAR* ou *PLANOS* para conhecer os recursos de destaque."
        send_reply(msg)
      else
        msg = "🔎 *Consultar Página de Empresa*\n\n" \
              "Para ver como uma empresa aparece no Avalia Solar, envie:\n" \
              "• O *CNPJ* (14 dígitos), ou\n" \
              "• Acesse o diretório completo em: https://www.avaliasolar.com.br/companies"
        send_reply(msg)
      end
    end

    def handle_ask_plans_pricing
      msg = "🚀 *Planos & Destaque para Integradores — Avalia Solar*\n\n" \
            "Impulsione sua autoridade e receba orçamentos qualificados na sua região:\n\n" \
            "1️⃣ *Perfil Básico (Gratuito):* Página pública indexada no Google + Coleta de avaliações.\n" \
            "2️⃣ *Plano Pro / Parceiro Verificado:* Selo de Confiança 🛡️, destaque nas buscas da sua cidade, botão oficial de Avaliação por Voz no WhatsApp e recebimento de leads qualificados.\n" \
            "3️⃣ *Plano Enterprise:* Destaque regional multi-cidades, integração CRM e consultoria dedicada.\n\n" \
            "👉 *Compare os planos em:* https://www.avaliasolar.com.br/pricing\n" \
            "👉 Para cadastrar sua empresa agora, envie *CADASTRAR*. Para falar com nosso time comercial, envie *AJUDA*."
      send_reply(msg)
    end

    def handle_evaluate_company(slots)
      company = resolve_company(slots)
      if company
        invite = provision_or_find_invite(company)
        if invite
          session = VoiceReviews::SessionService.open!(
            invite: invite,
            provider_contact: @contact,
            provider_message_id: @message['id'].to_s,
            provider: @provider,
            provider_session: @provider_session,
            provider_chat_id: @message['chat_id']
          )
          @record&.update!(voice_review_session: session) if @record && @record.voice_review_session_id.blank?
          privacy_url = "#{VoiceReviews::Config.frontend_origin}/privacy"
          send_reply(
            "Sou o assistente de avaliações do Avalia Solar. Você pode avaliar *#{company.name}* " \
            "por texto ou áudio. Suas mensagens serão tratadas para registrar a avaliação; " \
            "áudios poderão ser transcritos e organizados com auxílio de IA. " \
            "Nada será publicado sem sua confirmação e moderação. " \
            "Veja o aviso de privacidade: #{privacy_url}\n\n" \
            "Para começar, responda *ACEITO*. Para encerrar, responda *PARAR*."
          )
          return
        end
      end

      msg = "⭐ *Avaliar uma Empresa de Energia Solar*\n\n" \
            "Você pode registrar sua avaliação por *áudio ou texto* de duas formas:\n" \
            "1️⃣ Escaneando o QR Code ou clicando em *Avaliar pelo WhatsApp* na página da empresa em: https://www.avaliasolar.com.br/companies\n" \
            "2️⃣ Ou respondendo aqui: *Quero avaliar a [Nome da Empresa]*"
      send_reply(msg)
    end

    def send_welcome_menu
      fname = @message['sender_name'].to_s.split.first.presence
      hello = fname ? "Olá, *#{fname}*! 👋" : 'Olá! 👋'
      msg = "#{hello} Sou o assistente oficial do *Avalia Solar* ☀️\n\n" \
            "Como posso ajudar você hoje? Responda com o número ou com a palavra em destaque:\n\n" \
            "1️⃣ *AVALIAR* uma empresa (por áudio ou texto)\n" \
            "2️⃣ *CADASTRAR* minha empresa gratuitamente\n" \
            "3️⃣ *REIVINDICAR* uma empresa já cadastrada\n" \
            "4️⃣ *PERFIL* — consultar como uma empresa aparece no portal\n" \
            "5️⃣ *PLANOS* — conhecer destaque e geração de leads\n\n" \
            "*(Para falar com nossa equipe a qualquer momento, envie *AJUDA*)*"
      send_reply(msg)
    end

    def resolve_company(slots)
      if slots[:cnpj].present?
        found = Company.find_by(cnpj: slots[:cnpj].to_s.gsub(/\D/, ''))
        return found if found
      end

      if slots[:company_query].present?
        q = slots[:company_query].to_s.strip
        found = Company.where(status: 'active').where('LOWER(name) = ? OR LOWER(slug) = ?', q.downcase, q.parameterize).first
        found ||= Company.where(status: 'active').where('name ILIKE ?', "%#{ActiveRecord::Base.sanitize_sql_like(q)}%").order(rating_count: :desc).first
        return found if found
      end

      latest = CompanyOnboardingSession.find_latest_by_contact(@contact)
      return latest.company if latest&.company.present?

      nil
    end

    def provision_or_find_invite(company)
      if defined?(ReviewCollection::BrandPageInviteProvisioner)
        invite = ReviewCollection::BrandPageInviteProvisioner.call(company: company)
        return invite if invite&.claimable?
      end

      form = company.review_forms.where(status: 'active').first
      return nil unless form

      actor = company.users.first || User.first
      return nil unless actor

      VoiceReviews::InviteService.call(
        company: company,
        review_form: form,
        actor: actor,
        kind: 'reusable_qr',
        idempotency_key: "whatsapp-router-invite-#{company.id}"
      )
    rescue StandardError => e
      Rails.logger.warn("[Whatsapp::ConversationRouter] Could not provision invite for company=#{company.id}: #{e.message}")
      nil
    end

    def send_reply(text)
      transient = TransientSession.new(
        id: "transient-#{SecureRandom.hex(4)}",
        provider: @provider,
        provider_session: @provider_session,
        provider_chat_id: @message['chat_id'].presence || @contact,
        provider_contact: @contact
      )
      VoiceReviews::ContinuationLink.gateway(provider: @provider).send_message(transient, text)
    rescue StandardError => e
      Rails.logger.error("[Whatsapp::ConversationRouter] Failed to send reply: #{e.class} - #{e.message}")
    end

    def extract_text(message)
      raw = message['body'] || message['text']
      if raw.is_a?(Hash)
        raw['body'].to_s.strip
      else
        raw.to_s.strip
      end
    end
  end
end
