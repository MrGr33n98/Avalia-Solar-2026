# frozen_string_literal: true

module B2b
  class OnboardingSessionService
    class Error < StandardError; end

    PREVIOUS_STEPS = {
      'confirm_data' => { step: 'ask_cnpj', state: 'awaiting_cnpj' },
      'ask_email' => { step: 'confirm_data', state: 'confirming_data' },
      'ask_segment' => { step: 'ask_email', state: 'awaiting_email' },
      'ask_coverage' => { step: 'ask_segment', state: 'awaiting_segment' },
      'ask_brands' => { step: 'ask_coverage', state: 'awaiting_coverage' },
      'ask_logo' => { step: 'ask_brands', state: 'awaiting_brands' },
      'ask_photos' => { step: 'ask_logo', state: 'awaiting_logo' },
      'claim_ask_email' => { step: 'claim_ask_cnpj', state: 'claiming_cnpj' }
    }.freeze

    def self.company_public_url(company)
      slug_or_id = company.slug.presence || company.id
      "https://www.avaliasolar.com.br/companies/#{slug_or_id}"
    end

    def self.find_active_by_contact(contact)
      CompanyOnboardingSession.find_by_contact(contact)
    end

    def self.open!(contact:, provider: 'waha', provider_session: nil, provider_chat_id: nil, sender_name: nil, skip_greeting: false)
      contact_clean = contact.to_s.strip
      older = find_active_by_contact(contact_clean)
      older&.update(state: 'abandoned')

      hash = CompanyOnboardingSession.contact_hash(contact_clean)
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
        msg = "#{hello} Boas-vindas ao portal *Avalia Solar*.\n\n" \
              "Vamos cadastrar sua empresa integradora para conectar sua equipe a novos clientes e coletar avaliações auditadas no pós-venda.\n\n" \
              "Para preenchermos os dados automaticamente pela Receita Federal:\n" \
              "👉 *Digite o CNPJ da sua empresa* (apenas números):"

        send_message(session, msg)
      end

      session
    end

    def self.open_claim!(contact:, provider: 'waha', provider_session: nil, provider_chat_id: nil, sender_name: nil, cnpj: nil)
      contact_clean = contact.to_s.strip
      latest = CompanyOnboardingSession.find_latest_by_contact(contact_clean)
      older = find_active_by_contact(contact_clean)
      older&.update(state: 'abandoned')

      target_company = if cnpj.present?
                         Company.find_by(cnpj: cnpj.to_s.gsub(/\D/, ''))
                       elsif latest&.company_id.present?
                         Company.find_by(id: latest.company_id)
                       elsif latest&.draft_data.to_h['existing_company_id'].present?
                         Company.find_by(id: latest.draft_data['existing_company_id'])
                       elsif latest&.cnpj.present?
                         Company.find_by(cnpj: latest.cnpj)
                       end

      hash = CompanyOnboardingSession.contact_hash(contact_clean)
      encryptor = ActiveSupport::MessageEncryptor.new(Rails.application.key_generator.generate_key('b2b-onboarding-contact', 32))
      ciphertext = encryptor.encrypt_and_sign(contact_clean)
      token = SecureRandom.urlsafe_base64(32)
      digest = CompanyOnboardingSession.digest_token(token)

      initial_state = target_company ? 'claiming_email' : 'claiming_cnpj'
      initial_step = target_company ? 'claim_ask_email' : 'claim_ask_cnpj'

      session = CompanyOnboardingSession.create!(
        provider: provider.presence || 'waha',
        provider_session: provider_session,
        provider_contact_hash: hash,
        provider_contact_ciphertext: ciphertext,
        provider_chat_id: provider_chat_id,
        session_token_digest: digest,
        company: target_company,
        cnpj: target_company&.cnpj,
        state: initial_state,
        current_step: initial_step,
        draft_payload: {
          'sender_name' => sender_name.presence || latest&.draft_data.to_h['sender_name'],
          'existing_company_id' => target_company&.id
        }.compact,
        expires_at: 24.hours.from_now
      )

      if target_company
        msg = "🔐 *Reivindicação de Perfil — #{target_company.name}*\n\n" \
              "Para iniciarmos a validação de titularidade e liberarmos seu acesso ao Painel do Integrador:\n\n" \
              "👉 *Qual é o seu e-mail corporativo na empresa?*\n*(Ex: diretoria@suaempresa.com.br)*"
      else
        msg = "🔐 *Reivindicação de Empresa no Avalia Solar*\n\n" \
              "Para localizarmos o perfil que você deseja gerenciar:\n" \
              "👉 *Digite o CNPJ da empresa* (14 dígitos, apenas números):"
      end

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
      if @text.match?(/\A(?:cancelar|sair|parar)\z/i)
        @session.update!(state: 'abandoned')
        send_message(@session, 'Cadastro cancelado. Quando quiser recomeçar, basta enviar *CADASTRAR* ou *MENU*! ☀️')
        return
      end

      if @text.match?(/\A(?:ajuda|atendente|humano|suporte|falar com pessoa)\b/i)
        @session.update!(state: 'needs_human_review')
        send_message(
          @session,
          "👩‍💻 *Transferindo para atendimento humano*\n\n" \
          "Registramos sua solicitação. Nossa equipe de suporte ao integrador continuará seu atendimento por aqui ou pelo e-mail *contato@avaliasolar.com.br*.\n\n" \
          "*(Se desejar voltar ao assistente automático a qualquer momento, envie *MENU* ou *CADASTRAR*)*"
        )
        return
      end

      if @text.match?(/\A(?:voltar|anterior|corrigir)\z/i)
        handle_step_back
        return
      end

      if @text.match?(/\A(?:reivindicar|reivindicacao|reivindicação)\b/i)
        self.class.open_claim!(
          contact: @session.provider_contact,
          provider: @session.provider,
          provider_session: @session.provider_session,
          provider_chat_id: @session.provider_chat_id,
          sender_name: @session.draft_data['sender_name'],
          cnpj: @session.cnpj
        )
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
      when 'ask_logo'
        handle_ask_logo
      when 'ask_photos'
        handle_ask_photos
      when 'claim_ask_cnpj'
        handle_claim_ask_cnpj
      when 'claim_ask_email'
        handle_claim_ask_email
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
        @session.merge_draft!(existing_company_id: existing_company.id)
        @session.update!(
          state: 'abandoned',
          cnpj: clean_cnpj,
          company: existing_company
        )
        public_url = self.class.company_public_url(existing_company)
        send_message(
          @session,
          "🏢 Identificamos que a empresa *#{existing_company.name}* já possui cadastro no Avalia Solar!\n" \
          "🔗 Página pública: #{public_url}\n\n" \
          "Você é o responsável por ela? Para gerenciar este perfil existente, envie *REIVINDICAR* para iniciar a validação da sua titularidade."
        )
        return
      end

      @session.merge_draft!(cnpj_data: result)
      @session.update!(
        cnpj: clean_cnpj,
        current_step: 'confirm_data',
        state: 'confirming_data'
      )

      prompt = "Consultamos a base oficial da Receita Federal e localizamos sua empresa:\n\n" \
               "*Razão Social:* #{result[:razao_social]}\n" \
               "*Nome Fantasia:* #{result[:nome_fantasia]}\n" \
               "*Localização:* #{result[:municipio]} / #{result[:uf]}\n" \
               "*Atividade:* #{result[:cnae_descricao]}\n\n" \
               "Os dados estão corretos?\n" \
               "- Responda *1* (ou *SIM*) para confirmar\n" \
               "- Ou digite como prefere que o Nome Fantasia apareça no portal."

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

      prompt = "Dados cadastrais confirmados.\n\n" \
               "*Qual é o seu melhor e-mail profissional?*\n\n" \
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

      prompt = "E-mail registrado.\n\n" \
               "*Em quais áreas sua empresa atua?*\n*(Vincularemos seu perfil às categorias correspondentes no portal)*:\n\n" \
               "1 - Residencial (Instaladores + Residencial)\n" \
               "2 - Comercial e Industrial (Instaladores + C&I)\n" \
               "3 - Usinas Rurais / Solo (Instaladores + Usinas de Solo)\n" \
               "4 - Multi-segmento (Residencial, Comercial, Rural e Baterias)\n\n" \
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
                               "*Em quais áreas sua empresa atua?*\n\n" \
                               "1 - Residencial (Instaladores + Residencial)\n" \
                               "2 - Comercial e Industrial (Instaladores + C&I)\n" \
                               "3 - Usinas Rurais / Solo (Instaladores + Usinas de Solo)\n" \
                               "4 - Multi-segmento (Residencial, Comercial, Rural e Baterias)\n\n" \
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

      prompt = "Categorias definidas.\n\n" \
               "*Qual é a região de atendimento da sua equipe?*\n\n" \
               "1 - Apenas em *#{city}/#{state_code}* e região metropolitana\n" \
               "2 - Em *todo o estado de #{state_code}*\n" \
               "3 - Cidades específicas (digite os nomes separados por vírgula)\n\n" \
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

      prompt = "Região de atendimento registrada.\n\n" \
               "*Quais as principais marcas de inversores e módulos solares que sua equipe instala?*\n" \
               "*(Ex: WEG, Growatt, Deye, Canadian, Huawei, Fronius ou responda **PULAR** para adicionar depois)*"

      send_message(@session, prompt)
    end

    def handle_ask_brands
      if @text.strip.match?(/\A(?:pular|ignorar|depois|p)\z/i)
        brands_text = nil
      else
        brands_text = @text.presence
      end

      @session.merge_draft!(brands: brands_text || 'Principais marcas Tier-1')
      @session.update!(
        current_step: 'ask_logo',
        state: 'awaiting_logo'
      )

      prompt = "Marcas registradas.\n\n" \
               "*Envie agora uma imagem com o LOGO da sua empresa para destacar seu perfil no portal:*\n\n" \
               "*(Envie a imagem aqui como foto no WhatsApp, ou responda **PULAR** se preferir adicionar depois no painel)*"

      send_message(@session, prompt)
    end

    def handle_ask_logo
      image_data = @message['image'] || (@message.is_a?(Hash) && @message['type'] == 'image' ? @message : nil)
      has_image = image_data && (image_data['data'].present? || image_data['media_url'].present?)

      if has_image
        @session.merge_draft!(
          logo_data: image_data['data'],
          logo_media_url: image_data['media_url'],
          logo_mime_type: image_data['mime_type'] || 'image/jpeg'
        )
        @session.update!(
          current_step: 'ask_photos',
          state: 'awaiting_photos'
        )
        prompt = "Logotipo registrado com sucesso.\n\n" \
                 "Quer enviar de 1 a 3 fotos de instalações feitas pela sua equipe para seu portfólio?\n\n" \
                 "*(Envie fotos aqui, ou responda **PULAR** para concluir seu cadastro)*"
        send_message(@session, prompt)
      else
        @session.update!(
          current_step: 'ask_photos',
          state: 'awaiting_photos'
        )
        prompt = "Sem problemas. Você poderá adicionar ou trocar a logo pelo painel a qualquer momento.\n\n" \
                 "Quer enviar de 1 a 3 fotos de instalações feitas pela sua equipe para seu portfólio?\n\n" \
                 "*(Envie fotos aqui, ou responda **PULAR** para concluir seu cadastro)*"
        send_message(@session, prompt)
      end
    end

    def handle_ask_photos
      image_data = @message['image'] || (@message.is_a?(Hash) && @message['type'] == 'image' ? @message : nil)
      has_image = image_data && (image_data['data'].present? || image_data['media_url'].present?)

      if has_image
        @session.merge_draft!(
          portfolio_photo_data: image_data['data'],
          portfolio_photo_media_url: image_data['media_url'],
          portfolio_photo_mime_type: image_data['mime_type'] || 'image/jpeg'
        )
      end

      finalize_onboarding!
    end

    def handle_step_back
      prev = PREVIOUS_STEPS[@session.current_step]
      unless prev
        send_message(@session, "👉 Você já está no primeiro passo. Digite o *CNPJ da sua empresa* (14 dígitos, apenas números):")
        return
      end

      @session.update!(current_step: prev[:step], state: prev[:state])
      send_message(@session, "↩️ Voltamos para a etapa anterior (#{prev[:step].tr('_', ' ')}). Envie a informação atualizada:")
    end

    def handle_claim_ask_cnpj
      clean_cnpj = @text.gsub(/\D/, '')
      unless clean_cnpj.length == 14
        send_message(@session, "⚠️ Por favor, digite um *CNPJ válido com 14 números* da empresa que deseja reivindicar:")
        return
      end

      existing_company = Company.find_by(cnpj: clean_cnpj)
      unless existing_company
        @session.update!(current_step: 'ask_cnpj', state: 'awaiting_cnpj')
        send_message(
          @session,
          "ℹ️ Não encontramos uma empresa cadastrada com o CNPJ *#{clean_cnpj}*. Vamos iniciar o cadastro gratuito dela agora!"
        )
        return handle_ask_cnpj
      end

      @session.merge_draft!(existing_company_id: existing_company.id)
      @session.update!(
        company: existing_company,
        cnpj: clean_cnpj,
        current_step: 'claim_ask_email',
        state: 'claiming_email'
      )

      send_message(
        @session,
        "🏢 Localizamos o perfil da *#{existing_company.name}*!\n\n" \
        "Para registrarmos sua solicitação de titularidade, informe seu *e-mail corporativo* na empresa:\n" \
        "*(Ex: diretoria@suaempresa.com.br)*"
      )
    end

    def handle_claim_ask_email
      email_candidate = @text.to_s.strip.downcase
      unless email_candidate.match?(Company::SIMPLE_EMAIL_REGEX)
        send_message(@session, "⚠️ O e-mail digitado parece inválido.\n\nPor favor, digite seu e-mail corporativo completo (ex: diretoria@suaempresa.com.br):")
        return
      end

      target_company = @session.company || Company.find_by(id: @session.draft_data['existing_company_id']) || Company.find_by(cnpj: @session.cnpj)
      unless target_company
        @session.update!(current_step: 'claim_ask_cnpj', state: 'claiming_cnpj')
        send_message(@session, "⚠️ Precisamos confirmar o CNPJ da empresa primeiro. Digite os 14 números do CNPJ:")
        return
      end

      access_request = nil
      user = nil

      ActiveRecord::Base.transaction do
        user = User.find_by(email: email_candidate)
        unless user
          temp_password = "Solar##{SecureRandom.random_number(1000..9999)}!"
          raw_user_name = (@session.draft_data['sender_name'].presence || "Responsável #{target_company.name}").to_s.strip.truncate(100, omission: '')
          user_name = raw_user_name.length >= 3 ? raw_user_name : 'Responsável Integrador'
          user = User.new(
            name: user_name,
            email: email_candidate,
            password: temp_password,
            password_confirmation: temp_password,
            role: 'company',
            company_id: target_company.id,
            status: :pending,
            approved_by_admin: false,
            city: target_company.city.presence || 'São Paulo',
            state: target_company.state.presence || 'SP',
            terms_accepted: true,
            terms_accepted_at: Time.current,
            public_name_consent: true,
            display_full_name_consent: true,
            review_name_consent: true,
            lgpd_name_consent: true,
            confirmed_at: Time.current
          )
          user.skip_corporate_email_validation = true
          user.save!
        end

        raw_phone = @session.provider_contact.to_s.gsub(/\D/, '')
        contact_phone = raw_phone.length.between?(10, 15) ? "+#{raw_phone.start_with?('55') ? raw_phone : "55#{raw_phone}"}" : nil

        access_request = CompanyAccessRequest.where(user: user, company: target_company, status: %w[pending approved]).first
        access_request ||= CompanyAccessRequest.create!(
          user: user,
          company: target_company,
          status: 'pending',
          contact_email: email_candidate,
          contact_phone: contact_phone,
          message: "Solicitação de reivindicação de titularidade iniciada via WhatsApp (CNPJ #{target_company.cnpj})."
        )

        @session.merge_draft!(user_email: email_candidate, company_access_request_id: access_request.id)
        @session.update!(
          state: 'completed',
          current_step: 'finish',
          company: target_company,
          user: user
        )
      end

      public_url = self.class.company_public_url(target_company)
      msg = "✅ *Solicitação de Reivindicação Registrada!*\n\n" \
            "• *Empresa:* #{target_company.name}\n" \
            "• *Protocolo:* #CAR-#{access_request.id}\n" \
            "• *E-mail vinculado:* #{email_candidate}\n" \
            "• *Página pública:* #{public_url}\n\n" \
            "Nossa equipe de Trust & Safety validará sua titularidade e enviará a liberação de acesso ao Painel do Integrador no seu e-mail."
      send_message(@session, msg)
    rescue ActiveRecord::RecordInvalid => e
      Rails.logger.error("[B2B::OnboardingSessionService] Erro ao registrar reivindicação: #{e.record.errors.full_messages.join(', ')}")
      send_message(@session, "⚠️ Não foi possível concluir a solicitação: #{e.record.errors.full_messages.first}.")
    end

    def finalize_onboarding!
      company = nil
      user = nil
      existing_user_found = false
      temp_password = "Solar##{SecureRandom.random_number(1000..9999)}!"
      cats_names = ''

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
        existing_cat_ids = Category.where(id: category_ids).pluck(:id)
        if existing_cat_ids.empty? && (fallback_cat = Category.first)
          existing_cat_ids = [fallback_cat.id]
        end
        category_ids = existing_cat_ids if existing_cat_ids.any?
        primary_cat_id = (category_ids.include?(draft['primary_category_id']) ? draft['primary_category_id'] : category_ids.first)

        user_email = draft['user_email'].to_s.strip.downcase.presence || cnpj_data['email'].to_s.strip.downcase.presence
        user_email = "contato_#{@session.id.first(8)}@avaliasolar.com.br" unless user_email&.match?(Company::SIMPLE_EMAIL_REGEX)

        # Trata marcas para campos estruturados da empresa
        brands_raw = draft['brands'].presence
        brands_list = brands_raw.to_s.split(/[,;\/|]/).map(&:strip).reject(&:blank?)

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
          equipment_brands: brands_list,
          partner_brands: brands_raw,
          segment: 'installer',
          status: 'pending',
          moderation_status: 'pending_review',
          phone: contact_phone,
          whatsapp: contact_phone,
          email: user_email,
          description: "Empresa integradora de energia solar atuante em #{city}/#{state_code}. Especialista em instalações #{draft['segment_focus'] || 'residenciais e comerciais'}. Equipamentos: #{brands_raw || 'Principais marcas do mercado'}."
        )

        # Se houver logo registrada no draft, anexa (via Base64 ou download de URL)
        if draft['logo_data'].present? || draft['logo_media_url'].present?
          attach_company_logo(company, media_url: draft['logo_media_url'], base64_data: draft['logo_data'], mime_type: draft['logo_mime_type'])
        end

        if draft['portfolio_photo_data'].present? || draft['portfolio_photo_media_url'].present?
          attach_portfolio_photo(company, media_url: draft['portfolio_photo_media_url'], base64_data: draft['portfolio_photo_data'], mime_type: draft['portfolio_photo_mime_type'])
        end

        user = User.find_by(email: user_email)
        if user
          existing_user_found = true
          # RCA-001 Fix: Jamais sobrescrever a senha de um usuário existente via WhatsApp não autenticado.
          # An unauthenticated WhatsApp message is not proof of email ownership.
          # Never mutate an existing account or grant Company access here.
        else
          raw_user_name = (draft['sender_name'].presence || company_name).to_s.strip.truncate(100, omission: '')
          user_name = raw_user_name.length >= 3 ? raw_user_name : 'Responsável Integrador'
          user = User.new(
            name: user_name,
            email: user_email,
            password: temp_password,
            password_confirmation: temp_password,
            role: 'company',
            company_id: nil,
            status: :pending,
            approved_by_admin: false,
            city: city,
            state: state_code,
            terms_accepted: true,
            terms_accepted_at: Time.current,
            public_name_consent: true,
            display_full_name_consent: true,
            review_name_consent: true,
            lgpd_name_consent: true,
            confirmed_at: nil
          )
          user.skip_corporate_email_validation = true
          user.save!
        end

        # Create a reviewable claim, never an active membership. Only admin
        # approval of this request may activate the company and its owner.
        request = CompanyAccessRequest.where(
          user: user, company: company, status: %w[pending approved]
        ).first
        request ||= CompanyAccessRequest.create!(
          user: user,
          company: company,
          status: 'pending',
          contact_email: user_email,
          message: 'Cadastro pelo WhatsApp: titularidade e e-mail ainda não verificados.'
        )
        @session.merge_draft!(company_access_request_id: request.id)

        @session.update!(
          state: 'completed',
          current_step: 'finish',
          company: company,
          user: user
        )

        cats_names = company.categories.pluck(:name).join(', ')
      end

      site_url = self.class.company_public_url(company)
      msg = "*Cadastro recebido para análise!* ☀️\n\n" \
            "*Empresa:* #{company.name}\n" \
            "*Categorias:* #{cats_names.presence || 'Instaladores de Energia Solar'}\n" \
            "*Página pública (após aprovação):* #{site_url}\n\n" \
            "Para proteger sua empresa, o acesso de proprietário NÃO é liberado " \
            "pelo WhatsApp. Nossa equipe validará a titularidade e o e-mail " \
            "antes de liberar o painel. Nenhuma senha será enviada por aqui."
      send_message(@session, msg)
    rescue ActiveRecord::RecordInvalid => e
      Rails.logger.error("[B2B::OnboardingSessionService] Erro ao criar empresa: #{e.record.errors.full_messages.join(', ')}")
      send_message(@session, "⚠️ Ocorreu uma inconsistência nos dados da empresa: #{e.record.errors.full_messages.first}. Nossa equipe técnica foi notificada.")
    end

    def attach_portfolio_photo(company, media_url: nil, base64_data: nil, mime_type: nil)
      ext = mime_type.to_s.split('/').last.presence || 'jpeg'
      ext = 'jpg' if ext == 'jpeg'

      if base64_data.present?
        decoded = Base64.decode64(base64_data)
        @session.portfolio_photos.attach(
          io: StringIO.new(decoded),
          filename: "portfolio_#{company.id}_1.#{ext}",
          content_type: mime_type.presence || 'image/jpeg'
        )
        company.media_assets.attach(
          io: StringIO.new(decoded),
          filename: "portfolio_#{company.id}_1.#{ext}",
          content_type: mime_type.presence || 'image/jpeg'
        )
        return
      end

      return if media_url.blank?

      base_url = VoiceReviews::Config.waha_base_url
      api_key = VoiceReviews::Config.waha_api_key
      return if base_url.blank? || api_key.blank?

      uri = URI.parse(media_url)
      base = URI.parse(base_url)
      full_url = URI.join("#{base.scheme}://#{base.host}:#{base.port}", uri.path.to_s).to_s

      response = HTTParty.get(full_url, headers: { 'X-Api-Key' => api_key }, timeout: 15)
      if response.success? && response.body.present?
        company.media_assets.attach(
          io: StringIO.new(response.body),
          filename: "portfolio_#{company.id}_1.#{ext}",
          content_type: mime_type.presence || 'image/jpeg'
        )
      end
    rescue StandardError => e
      Rails.logger.warn("[B2B::OnboardingSessionService] Falha ao anexar foto de portfólio: #{e.message}")
    end

    def attach_company_logo(company, media_url: nil, base64_data: nil, mime_type: nil)
      ext = mime_type.to_s.split('/').last.presence || 'jpeg'
      ext = 'jpg' if ext == 'jpeg'

      if base64_data.present?
        decoded = Base64.decode64(base64_data)
        company.logo.attach(
          io: StringIO.new(decoded),
          filename: "logo_#{company.id}.#{ext}",
          content_type: mime_type.presence || 'image/jpeg'
        )
        return
      end

      return if media_url.blank?

      base_url = VoiceReviews::Config.waha_base_url
      api_key = VoiceReviews::Config.waha_api_key
      return if base_url.blank? || api_key.blank?

      uri = URI.parse(media_url)
      base = URI.parse(base_url)
      full_url = URI.join("#{base.scheme}://#{base.host}:#{base.port}", uri.path.to_s).to_s

      response = HTTParty.get(full_url, headers: { 'X-Api-Key' => api_key }, timeout: 15)
      if response.success? && response.body.present?
        company.logo.attach(
          io: StringIO.new(response.body),
          filename: "logo_#{company.id}.#{ext}",
          content_type: mime_type.presence || 'image/jpeg'
        )
      end
    rescue StandardError => e
      Rails.logger.warn("[B2B::OnboardingSessionService] Falha ao anexar logo: #{e.message}")
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

