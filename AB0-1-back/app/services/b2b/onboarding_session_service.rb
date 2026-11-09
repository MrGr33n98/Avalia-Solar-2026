# frozen_string_literal: true

module B2b
  class OnboardingSessionService
    class Error < StandardError; end

    def self.find_active_by_contact(contact)
      CompanyOnboardingSession.find_by_contact(contact)
    end

    def self.open!(contact:, provider: 'waha', provider_session: nil, provider_chat_id: nil, sender_name: nil)
      contact_clean = contact.to_s.strip
      older = find_active_by_contact(contact_clean)
      older&.update(state: 'abandoned')

      hash = Digest::SHA256.hexdigest(contact_clean)
      encryptor = ActiveSupport::MessageEncryptor.new(Rails.application.key_generator.generate_key('b2b-onboarding-contact', 32))
      ciphertext = encryptor.encrypt_and_sign(contact_clean)
      token = SecureRandom.urlsafe_base64(32)
      digest = CompanyOnboardingSession.digest_token(token)

      session = CompanyOnboardingSession.create!(
        provider: provider.presence || 'waha',
        provider_session: provider_session,
        provider_contact_hash: hash,
        provider_contact_ciphertext: ciphertext,
        provider_chat_id: provider_chat_id,
        session_token_digest: digest,
        state: 'awaiting_cnpj',
        current_step: 'ask_cnpj',
        draft_payload: { 'sender_name' => sender_name }.compact,
        expires_at: 24.hours.from_now
      )

      fname = sender_name.to_s.split.first.presence
      hello = fname ? "Olá, *#{fname}*! 👋" : 'Olá! 👋'
      msg = "#{hello} Boas-vindas ao portal *Avalia Solar*! ☀️\n\n" \
            "Vamos cadastrar sua empresa integradora para conectar sua equipe a novos clientes de energia solar e permitir a coleta de avaliações auditadas no pós-venda.\n\n" \
            "Para preenchermos 80% dos dados automaticamente pela Receita Federal:\n" \
            "👉 *Digite o CNPJ da sua empresa* (apenas números):"

      send_message(session, msg)
      session
    end

    def self.process_message!(session, message)
      new(session, message).process!
    end

    def initialize(session, message)
      @session = session
      @message = message
      raw = message['body'] || message['text']
      @text = (raw.is_a?(Hash) ? raw['body'] : raw).to_s.strip
    end

    def process!
      if @text.match?(/\A(?:cancelar|sair|reiniciar|parar)\z/i)
        @session.update!(state: 'abandoned')
        send_message(@session, 'Cadastro cancelado. Quando quiser recomeçar, basta enviar *CADASTRAR*! ☀️')
        return
      end

      case @session.current_step
      when 'ask_cnpj'
        handle_ask_cnpj
      when 'confirm_data'
        handle_confirm_data
      when 'ask_segment'
        handle_ask_segment
      when 'ask_brands'
        handle_ask_brands
      when 'ask_photos'
        handle_ask_photos
      else
        finalize_onboarding!
      end
    end

    private

    def handle_ask_cnpj
      result = B2b::BrasilApiClient.fetch(@text)
      unless result[:success]
        send_message(@session, "⚠️ #{result[:message]}\n\nPor favor, digite novamente o *CNPJ da empresa* (14 dígitos, apenas números):")
        return
      end

      clean_cnpj = result[:cnpj]

      if result[:situacao].present? && !result[:situacao].match?(/ativa/i)
        send_message(@session, "⚠️ O CNPJ #{clean_cnpj} consta como *#{result[:situacao]}* na Receita Federal.\n" \
                              'Apenas empresas com situação ATIVA podem ser cadastradas no Avalia Solar. ' \
                              'Se tiver dúvidas, consulte seu contador ou envie outro CNPJ válido.')
        return
      end

      existing_company = Company.find_by(cnpj: clean_cnpj)
      if existing_company
        @session.update!(state: 'abandoned')
        send_message(@session, "🏢 Identificamos que a empresa *#{existing_company.name}* já possui cadastro no Avalia Solar!\n\n" \
                              "Você é o responsável por ela? Para gerenciar este perfil existente, envie *REIVINDICAR* para iniciar a validação da sua titularidade.")
        return
      end

      @session.merge_draft!(cnpj_data: result)
      @session.update!(
        cnpj: clean_cnpj,
        current_step: 'confirm_data',
        state: 'confirming_data'
      )

      prompt = "Consultamos a base oficial da Receita Federal e localizamos sua empresa:\n\n" \
               "🏢 *Razão Social:* #{result[:razao_social]}\n" \
               "🏷️ *Nome Fantasia:* #{result[:nome_fantasia]}\n" \
               "📍 *Localização:* #{result[:municipio]} / #{result[:uf]}\n" \
               "⚡ *Atividade:* #{result[:cnae_descricao]}\n\n" \
               "Os dados estão corretos?\n" \
               "👉 Responda *1* (ou *SIM*) para confirmar\n" \
               "✏️ Ou digite como prefere que o Nome Fantasia apareça publicamente no portal."

      send_message(@session, prompt)
    end

    def handle_confirm_data
      if @text.match?(/\A(?:1|sim|s|ok|correto|confirmo|positivo)\b/i)
        # Mantém o nome fantasia retornado pela API
      elsif @text.length >= 3
        @session.merge_draft!(custom_name: @text)
      end

      @session.update!(
        current_step: 'ask_segment',
        state: 'awaiting_segment'
      )

      prompt = "Perfeito! Dados confirmados. 👍\n\n" \
               "⭐ *Qual é o foco principal de atendimento da sua empresa?*\n\n" \
               "1️⃣ Residencial\n" \
               "2️⃣ Comercial e Industrial (C&I)\n" \
               "3️⃣ Usinas Rurais / Solo\n" \
               "4️⃣ Multi-segmento (atendemos todos)\n\n" \
               "*(Responda 1, 2, 3 ou 4)*"

      send_message(@session, prompt)
    end

    def handle_ask_segment
      segment_name = case @text
                     when '1' then 'Residencial'
                     when '2' then 'Comercial e Industrial (C&I)'
                     when '3' then 'Usinas Rurais / Solo'
                     when '4' then 'Multi-segmento'
                     else @text.presence || 'Residencial e Comercial'
                     end

      @session.merge_draft!(segment_focus: segment_name)
      @session.update!(
        current_step: 'ask_brands',
        state: 'awaiting_brands'
      )

      prompt = "Show de bola! ⚡\n\n" \
               "⭐ *Quais as principais marcas de inversores e módulos solares que sua equipe instala?*\n" \
               "*(Ex: WEG, Growatt, Deye, Canadian, Huawei, Fronius, Sungrow)*"

      send_message(@session, prompt)
    end

    def handle_ask_brands
      brands_text = @text.presence || 'Principais marcas Tier-1'
      @session.merge_draft!(brands: brands_text)
      @session.update!(
        current_step: 'ask_photos',
        state: 'awaiting_photos'
      )

      prompt = "Excelente portfólio! 📸\n\n" \
               "Para sua empresa se destacar nas buscas da sua região, **envie agora de 1 a 3 fotos de instalações reais** feitas pela sua equipe!\n\n" \
               "*(Envie como foto normal aqui no WhatsApp, ou responda **PULAR** se preferir adicionar depois no painel)*"

      send_message(@session, prompt)
    end

    def handle_ask_photos
      # Se for foto ou pular, finaliza o cadastro
      finalize_onboarding!
    end

    def finalize_onboarding!
      ActiveRecord::Base.transaction do
        draft = @session.draft_data
        cnpj_data = draft['cnpj_data'] || {}
        company_name = draft['custom_name'].presence || cnpj_data['nome_fantasia'].presence || cnpj_data['razao_social'].presence || 'Integrador Solar'
        city = cnpj_data['municipio'].presence || 'São Paulo'
        state_code = cnpj_data['uf'].presence || 'SP'
        address_line = [cnpj_data['logradouro'], cnpj_data['numero'], cnpj_data['bairro']].reject(&:blank?).join(', ')

        company = Company.create!(
          name: company_name,
          cnpj: @session.cnpj,
          city: city,
          state: state_code,
          address: address_line.presence || city,
          postal_code: cnpj_data['cep'],
          segment: 'installer',
          status: 'pending',
          moderation_status: 'pending_review',
          phone: @session.provider_contact,
          whatsapp: @session.provider_contact,
          description: "Empresa integradora de energia solar atuante em #{city}/#{state_code}. Especialista em instalações #{draft['segment_focus'] || 'residenciais e comerciais'}. Equipamentos: #{draft['brands'] || 'Principais marcas do mercado'}."
        )

        email = cnpj_data['email'].presence || "contato_#{company.id}@avaliasolar.com.br"
        user = User.find_by(email: email)
        unless user
          user_name = draft['sender_name'].presence || company_name
          user = User.create!(
            name: user_name,
            email: email,
            password: SecureRandom.urlsafe_base64(16),
            role: 'company',
            city: city,
            state: state_code,
            terms_accepted: true,
            public_name_consent: true,
            display_full_name_consent: true,
            review_name_consent: true,
            lgpd_name_consent: true
          )
        end

        CompanyMember.find_or_create_by!(company: company, user: user) do |m|
          m.role = :owner
          m.status = :active
        end

        @session.update!(
          state: 'completed',
          current_step: 'finish',
          company: company,
          user: user
        )

        slug = company.slug.presence || company.id
        site_url = "https://avaliasolar.com.br/empresa/#{slug}"
        dashboard_url = 'https://app.avaliasolar.com.br/dashboard'

        success_msg = "🎉 *Parabéns! Sua empresa foi cadastrada com sucesso no Avalia Solar!* ☀️\n\n" \
                      "🏢 *Empresa:* #{company.name}\n" \
                      "📍 *Cidade:* #{company.city}/#{company.state}\n" \
                      "🔗 *Sua página pública:* #{site_url}\n" \
                      "🔑 *Painel do Integrador:* #{dashboard_url}\n\n" \
                      "💡 *Dica de Ouro:* Empresas com avaliações auditadas no perfil convertem até 3x mais propostas!\n\n" \
                      "👉 Que tal gerar agora seu primeiro convite de *Voice Review* para um cliente recente pelo WhatsApp?\n" \
                      "Responda *1* para ativar seus convites!"

        send_message(@session, success_msg)
      end
    rescue ActiveRecord::RecordInvalid => e
      Rails.logger.error("[B2B::OnboardingSessionService] Erro ao criar empresa: #{e.record.errors.full_messages.join(', ')}")
      send_message(@session, "⚠️ Ocorreu uma inconsistência nos dados da empresa: #{e.record.errors.full_messages.first}. Nossa equipe técnica foi notificada.")
    end

    def send_message(session, text)
      self.class.send_message(session, text)
    end

    def self.send_message(session, text)
      VoiceReviews::ContinuationLink.gateway(provider: session.provider).send_message(session, text)
    rescue StandardError => e
      Rails.logger.error("[B2B::OnboardingSessionService] Falha ao enviar mensagem: #{e.class} - #{e.message}")
    end
  end
end

