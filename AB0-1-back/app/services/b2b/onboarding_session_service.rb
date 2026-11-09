# frozen_string_literal: true

module B2b
  class OnboardingSessionService
    class Error < StandardError; end

    def self.find_active_by_contact(contact)
      CompanyOnboardingSession.find_by_contact(contact)
    end

    def self.open!(contact:, provider: 'waha', provider_session: nil, provider_chat_id: nil, sender_name: nil, skip_greeting: false)
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

      unless skip_greeting
        fname = sender_name.to_s.split.first.presence
        hello = fname ? "Olá, *#{fname}*! 👋" : 'Olá! 👋'
        msg = "#{hello} Boas-vindas ao portal *Avalia Solar*! ☀️\n\n" \
              "Vamos cadastrar sua empresa integradora para conectar sua equipe a novos clientes de energia solar e permitir a coleta de avaliações auditadas no pós-venda.\n\n" \
              "Para preenchermos 80% dos dados automaticamente pela Receita Federal:\n" \
              "👉 *Digite o CNPJ da sua empresa* (apenas números):"

        send_message(session, msg)
      end

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
      if @text.match?(/\A(?:cancelar|sair|parar)\z/i)
        @session.update!(state: 'abandoned')
        send_message(@session, 'Cadastro cancelado. Quando quiser recomeçar, basta enviar *CADASTRAR*! ☀️')
        return
      end

      if @text.match?(/\A(?:reiniciar|recomecar|recomeçar)\z/i) || (@session.current_step != 'ask_cnpj' && @text.match?(/\A(?:cadastrar|cadastro|novo cadastro)\z/i))
        @session.update!(
          state: 'awaiting_cnpj',
          current_step: 'ask_cnpj',
          cnpj: nil,
          draft_payload: {}
        )
        send_message(@session, "Vamos iniciar o cadastro da sua empresa integradora no Avalia Solar! ☀️\n\n👉 Digite o *CNPJ da sua empresa* (14 dígitos, apenas números):")
        return
      end

      case @session.current_step
      when 'ask_cnpj'
        handle_ask_cnpj
      when 'confirm_data'
        handle_confirm_data
      when 'ask_email'
        handle_ask_email
      when 'ask_segment'
        handle_ask_segment
      when 'ask_coverage'
        handle_ask_coverage
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
      result = B2b::BrasilApiClient.fetch(@text.gsub(/\D/, ''))
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

    CATEGORY_COMBOS = {
      '1' => { primary_id: 71, category_ids: [71, 72], name: 'Residencial' },
      '2' => { primary_id: 71, category_ids: [71, 73], name: 'Comercial e Industrial (C&I)' },
      '3' => { primary_id: 71, category_ids: [71, 74], name: 'Usinas Rurais / Solo' },
      '4' => { primary_id: 71, category_ids: [71, 72, 73, 74, 76], name: 'Multi-segmento' }
    }.freeze

    def handle_confirm_data
      clean_digits = @text.gsub(/\D/, '')
      if clean_digits.length == 14
        return handle_ask_cnpj
      end

      if @text.match?(/\A(?:1|sim|s|ok|correto|confirmo|positivo)\b/i)
        # Mantém o nome fantasia retornado pela API
      elsif @text.length >= 3 && !@text.match?(/\A(?:cadastr|novo)\b/i)
        @session.merge_draft!(custom_name: @text)
      end

      @session.update!(
        current_step: 'ask_email',
        state: 'awaiting_email'
      )

      prompt = "Perfeito! Dados cadastrais confirmados. 👍\n\n" \
               "👉 *Qual é o seu melhor e-mail profissional?*\n\n" \
               "Ele será usado para acessar o Painel do Integrador e receber as solicitações de orçamento de novos clientes.\n\n" \
               "*(Ex: contato@suaempresa.com.br)*"

      send_message(@session, prompt)
    end

    def handle_ask_email
      email_candidate = @text.to_s.strip.downcase
      unless email_candidate.match?(Company::SIMPLE_EMAIL_REGEX)
        send_message(@session, "⚠️ O e-mail digitado parece inválido.\n\nPor favor, digite seu e-mail profissional completo (ex: contato@suaempresa.com.br):")
        return
      end

      @session.merge_draft!(user_email: email_candidate)
      @session.update!(
        current_step: 'ask_segment',
        state: 'awaiting_segment'
      )

      prompt = "E-mail registrado com sucesso! ✉️\n\n" \
               "⭐ *Em quais áreas sua empresa atua?*\n*(Vincularemos seu perfil a pelo menos 2 categorias do portal)*:\n\n" \
               "1️⃣ Residencial *(Instaladores + Residencial)*\n" \
               "2️⃣ Comercial e Industrial *(Instaladores + C&I)*\n" \
               "3️⃣ Usinas Rurais / Solo *(Instaladores + Usinas de Solo)*\n" \
               "4️⃣ Multi-segmento *(Residencial, Comercial, Rural e Baterias)*\n\n" \
               "*(Responda 1, 2, 3 ou 4)*"

      send_message(@session, prompt)
    end

    def handle_ask_segment
      combo = case @text.strip.downcase
              when '1', /\Aresidencial/ then CATEGORY_COMBOS['1']
              when '2', /\Acomercial/, /industrial/ then CATEGORY_COMBOS['2']
              when '3', /\Ausina/, /rural/, /solo/ then CATEGORY_COMBOS['3']
              when '4', /\Amulti/, /todos/ then CATEGORY_COMBOS['4']
              end

      unless combo
        send_message(@session, "Não entendi a opção. 🤔\n\n" \
                               "⭐ *Em quais áreas sua empresa atua?*\n\n" \
                               "1️⃣ Residencial *(Instaladores + Residencial)*\n" \
                               "2️⃣ Comercial e Industrial *(Instaladores + C&I)*\n" \
                               "3️⃣ Usinas Rurais / Solo *(Instaladores + Usinas de Solo)*\n" \
                               "4️⃣ Multi-segmento *(Residencial, Comercial, Rural e Baterias)*\n\n" \
                               '*(Responda 1, 2, 3 ou 4)*')
        return
      end

      @session.merge_draft!(
        category_ids: combo[:category_ids],
        primary_category_id: combo[:primary_id],
        segment_focus: combo[:name]
      )

      draft = @session.draft_data
      cnpj_data = draft['cnpj_data'] || {}
      city = cnpj_data['municipio'].presence || 'sua cidade'
      state_code = cnpj_data['uf'].presence || 'seu estado'

      @session.update!(
        current_step: 'ask_coverage',
        state: 'awaiting_coverage'
      )

      prompt = "Categorias definidas! ⚡\n\n" \
               "⭐ *Qual é a região / cidades onde sua equipe atende e instala usinas?*\n\n" \
               "1️⃣ Apenas em *#{city}/#{state_code}* e região metropolitana\n" \
               "2️⃣ Em *todo o estado de #{state_code}*\n" \
               "3️⃣ Cidades vizinhas específicas (digite os nomes separados por vírgula)\n\n" \
               "*(Responda 1, 2 ou digite as cidades)*"

      send_message(@session, prompt)
    end

    def handle_ask_coverage
      draft = @session.draft_data
      cnpj_data = draft['cnpj_data'] || {}
      state_code = Locations::CoverageNormalizer.normalize_state(cnpj_data['uf']).presence || 'SP'
      raw_city = cnpj_data['municipio'].presence || 'São Paulo'
      city = Locations::CoverageNormalizer.normalize_city(raw_city, state: state_code).presence || raw_city

      coverage_cities = nil
      coverage_states = state_code

      case @text.strip.downcase
      when '1', /\A(apenas|regi|metropol)/
        coverage_cities = city
      when '2', /\A(todo|estado)/
        coverage_cities = nil
        coverage_states = state_code
      else
        normalized = Locations::CoverageNormalizer.normalize_cities(@text, state: state_code)
        coverage_cities = normalized.any? ? normalized.join(', ') : @text.strip.truncate(200)
      end

      @session.merge_draft!(
        coverage_cities: coverage_cities,
        coverage_states: coverage_states
      )
      @session.update!(
        current_step: 'ask_brands',
        state: 'awaiting_brands'
      )

      prompt = "Região de atendimento registrada! 📍\n\n" \
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
        state_code = Locations::CoverageNormalizer.normalize_state(cnpj_data['uf']).presence || 'SP'
        raw_city = cnpj_data['municipio'].presence || 'São Paulo'
        city = Locations::CoverageNormalizer.normalize_city(raw_city, state: state_code).presence ||
               (Locations::BrLocations.valid_city?(state_code, raw_city) ? raw_city : 'São Paulo')
        cep_part = cnpj_data['cep'].present? ? "CEP #{cnpj_data['cep']}" : nil
        address_line = [cnpj_data['logradouro'], cnpj_data['numero'], cnpj_data['bairro'], cep_part].reject(&:blank?).join(', ')

        raw_phone = @session.provider_contact.to_s.gsub(/\D/, '')
        contact_phone = raw_phone.length.between?(10, 15) ? raw_phone : cnpj_data['telefone'].to_s.gsub(/\D/, '').presence
        contact_phone = nil unless contact_phone&.match?(/\A\d{10,15}\z/)

        category_ids = Array(draft['category_ids']).presence || [71, 72]
        primary_cat_id = draft['primary_category_id'] || category_ids.first

        user_email = draft['user_email'].presence || cnpj_data['email'].to_s.strip.downcase.presence
        email_domain = user_email&.split('@', 2)&.last
        valid_corp_email = user_email.present? &&
                           Company::SIMPLE_EMAIL_REGEX.match?(user_email) &&
                           !User::PUBLIC_EMAIL_DOMAINS.include?(email_domain)
        final_email = valid_corp_email ? user_email : "contato_#{@session.id.first(8)}@avaliasolar.com.br"

        company = Company.create!(
          name: company_name,
          cnpj: @session.cnpj,
          city: city,
          state: state_code,
          address: address_line.presence || city,
          coverage_cities: draft['coverage_cities'],
          coverage_states: draft['coverage_states'] || state_code,
          category_ids: category_ids,
          primary_category_id: primary_cat_id,
          segment: 'installer',
          status: 'pending',
          moderation_status: 'pending_review',
          phone: contact_phone,
          whatsapp: contact_phone,
          email: final_email,
          description: "Empresa integradora de energia solar atuante em #{city}/#{state_code}. Especialista em instalações #{draft['segment_focus'] || 'residenciais e comerciais'}. Equipamentos: #{draft['brands'] || 'Principais marcas do mercado'}."
        )

        user = User.find_by(email: final_email)
        unless user
          raw_user_name = (draft['sender_name'].presence || company_name).to_s.strip.truncate(100, omission: '')
          user_name = raw_user_name.length >= 3 ? raw_user_name : 'Responsável Integrador'
          user = User.create!(
            name: user_name,
            email: final_email,
            password: "Aa1!#{SecureRandom.urlsafe_base64(16)}",
            role: 'company',
            city: city,
            state: state_code,
            terms_accepted: true,
            public_name_consent: true,
            display_full_name_consent: true,
            review_name_consent: true,
            lgpd_name_consent: true,
            confirmed_at: Time.current
          )
        end

        CompanyMember.find_or_create_by!(company: company, user: user) do |m|
          m.role = :owner
          m.status = :active
        end

        # Dispara instruções para o e-mail do usuário
        user.send_reset_password_instructions rescue nil
        ::CompanyMailer.registration_received(company).deliver_later rescue nil

        @session.update!(
          state: 'completed',
          current_step: 'finish',
          company: company,
          user: user
        )

        slug = company.slug.presence || company.id
        site_url = "https://avaliasolar.com.br/empresa/#{slug}"
        dashboard_url = 'https://app.avaliasolar.com.br/dashboard'

        cats_names = company.categories.pluck(:name).join(', ')
        success_msg = "🎉 *Parabéns! Sua empresa foi cadastrada com sucesso no Avalia Solar!* ☀️\n\n" \
                      "🏢 *Empresa:* #{company.name}\n" \
                      "🏷️ *Categorias:* #{cats_names.presence || 'Instaladores de Energia Solar'}\n" \
                      "📍 *Atuação:* #{company.coverage_cities.presence || company.city} (#{company.state})\n" \
                      "🔗 *Sua página pública:* #{site_url}\n" \
                      "🔑 *Painel do Integrador:* #{dashboard_url}\n" \
                      "📧 *Acesso ao Painel:* Enviamos as instruções de ativação e login para seu e-mail: *#{user.email}*.\n\n" \
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

