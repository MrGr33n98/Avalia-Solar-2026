module PlanFeatureCatalog
  PLAN_TIERS = %w[free essential pro enterprise].freeze

  FEATURE_DEFINITIONS = {
    'premium_profile' => {
      label: 'Perfil Premium',
      description: 'Habilita recursos premium no perfil da empresa.',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'public_profile',
      aliases: %w[premium_profile_enabled]
    },
    'product_description' => {
      label: 'Descrição do Produto/Serviço',
      description: 'Exibe o bloco de texto detalhado sobre a oferta da empresa no perfil público.',
      type: :boolean,
      default: true,
      access_behavior: :toggle,
      group: 'public_profile'
    },
    'product_features_block' => {
      label: 'Bloco de Características',
      description: 'Lista de diferenciais técnicos e especificações do produto/serviço.',
      type: :boolean,
      default: true,
      access_behavior: :toggle,
      group: 'public_profile'
    },
    'ideal_customer_block' => {
      label: 'Perfil de Cliente Ideal',
      description: 'Exibe para quem o serviço é mais indicado (ex: Residencial, Industrial).',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'public_profile'
    },
    'promo_banner' => {
      label: 'Banner Promocional',
      description: 'Permite que a empresa exiba um banner de oferta personalizada no topo do perfil.',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'conversion',
      aliases: %w[banner banner_promocional]
    },
    'verified_product' => {
      label: 'Selo de Empresa Verificada',
      description: 'Exibe o selo de confiança que aumenta a taxa de conversão.',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'trust',
      aliases: %w[verified verified_badge]
    },
    'highlight_badges' => {
      label: 'Badges de Destaque',
      description: 'Exibe medalhas de conquistas (ex: Top 10, Empresa do Mês).',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'trust',
      aliases: %w[badges badges_highlight]
    },
    'custom_ctas' => {
      label: 'Botões de Orçamento (CTAs) Customizados',
      description: 'Habilita botões personalizados para WhatsApp, Telefone ou Formulário Externo.',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'conversion',
      aliases: %w[active_admin quote_feature quote_feature_enabled quote_requests quote_requests_enabled cta_whatsapp]
    },
    'pricing_table' => {
      label: 'Tabela de Preços/Planos',
      description: 'Exibe uma tabela comparativa de valores no perfil da empresa.',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'conversion',
      aliases: %w[pricing pricing_block plans_and_prices]
    },
    'special_offer' => {
      label: 'Oferta Especial Ativa',
      description: 'Bloco de destaque para promoções temporárias com cronômetro ou cupom.',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'conversion',
      aliases: %w[promo_offer offer]
    },
    'sponsored_description' => {
      label: 'Conteúdo Patrocinado',
      description: 'Permite que a empresa apareça em resultados patrocinados no blog e busca.',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'conversion',
      aliases: %w[sponsored_content sponsored_copy]
    },
    'downloadable_materials' => {
      label: 'Materiais para Download',
      description: 'Habilita o envio de PDFs, manuais e catálogos para o cliente baixar.',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'content',
      aliases: %w[downloads materials gated_downloads]
    },
    'projects_showcase' => {
      label: 'Vitrine de Projetos',
      description: 'Permite publicar projetos, cases e seus ativos visuais no perfil público.',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'content',
      aliases: %w[projects portfolio cases project_gallery]
    },
    'content_intent_analytics' => {
      label: 'Analytics de Materiais',
      description: 'Exibe funil de intenção, leads e entregas de materiais no dashboard.',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'analytics',
      aliases: %w[content_analytics material_analytics intent_data]
    },
    'media_gallery' => {
      label: 'Galeria de Mídia (Fotos/Vídeos)',
      description: 'Exibe fotos de instalações e vídeos de cases no perfil.',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'content',
      aliases: %w[gallery media]
    },
    'media_upload' => {
      label: 'Upload Autônomo de Mídia',
      description: 'Permite que a própria empresa suba fotos/vídeos via painel administrativo.',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'content',
      aliases: %w[allow_media_uploads gallery_uploads media_uploads]
    },
    'p2p_chat' => {
      label: 'Chat direto com clientes',
      description: 'Habilita conversas diretas entre compradores e a empresa pelo marketplace.',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'conversion',
      aliases: %w[p2p_chat_enabled direct_chat customer_chat marketplace_chat]
    },
    'product_images_limit' => {
      label: 'Limite de Imagens por Produto',
      description: 'Quantidade máxima de imagens que podem ser anexadas a cada produto.',
      type: :integer,
      default: nil,
      access_behavior: :config,
      group: 'content',
      aliases: %w[product_image_limit images_per_product_limit]
    },
    'company_categories_limit' => {
      label: 'Limite de Categorias da Empresa',
      description: 'Quantidade máxima de categorias publicáveis no perfil da empresa antes de exigir aprovação comercial.',
      type: :integer,
      default: 3,
      access_behavior: :config,
      group: 'public_profile',
      aliases: %w[category_limit categories_limit profile_categories_limit company_category_limit]
    },
    'service_area_states_limit' => {
      label: 'Limite de Estados Atendidos',
      description: 'Quantidade máxima de estados adicionais em que a empresa pode declarar atendimento.',
      type: :integer,
      default: 1,
      access_behavior: :config,
      group: 'public_profile',
      aliases: %w[coverage_states_limit states_coverage_limit service_states_limit]
    },
    'service_area_cities_limit' => {
      label: 'Limite de Cidades Atendidas',
      description: 'Quantidade máxima de cidades adicionais em que a empresa pode declarar atendimento.',
      type: :integer,
      default: 3,
      access_behavior: :config,
      group: 'public_profile',
      aliases: %w[coverage_cities_limit cities_coverage_limit service_cities_limit]
    },
    'national_coverage' => {
      label: 'Cobertura Nacional',
      description: 'Permite declarar atuação nacional sem revisão comercial adicional.',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'public_profile',
      aliases: %w[national_service_area nationwide_coverage]
    },
    'local_seo_visibility' => {
      label: 'Visibilidade em SEO Local Expandido',
      description: 'Permite usar cidades de abrangência como sinal comercial para páginas locais fora da sede.',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'public_profile',
      aliases: %w[local_pages_visibility service_area_seo local_seo]
    },
    'company_links_block' => {
      label: 'Bloco de Redes Sociais',
      description: 'Exibe links para Instagram, LinkedIn e site oficial.',
      type: :boolean,
      default: true,
      access_behavior: :toggle,
      group: 'public_profile',
      aliases: %w[company_links social_links]
    },
    'profile_media_direct_update' => {
      label: 'Atualização Direta de Mídias do Perfil',
      description: 'Permite atualizar logo e banner sem aprovação prévia.',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'public_profile',
      aliases: %w[media_direct_update direct_media_update]
    },
    'forum_highlight' => {
      label: 'Destaque no Fórum de Comunidade',
      description: 'Prioriza as respostas da empresa no fórum oficial.',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'trust'
    },
    'featured_review' => {
      label: 'Avaliação em Destaque',
      description: 'Permite fixar o melhor depoimento de cliente no topo.',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'trust',
      aliases: %w[featured_reviews review_highlight]
    },
    'social_proof' => {
      label: 'Módulo de Prova Social',
      description: 'Exibe contador de estrelas e fotos de clientes satisfeitos.',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'trust',
      aliases: %w[social_proof_enabled]
    },
    'faq_block' => {
      label: 'Bloco de Perguntas Frequentes',
      description: 'Exibe sanfona de dúvidas frequentes (FAQs) no perfil.',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'public_profile',
      aliases: %w[faq faqs]
    },
    'show_alternatives' => {
      label: 'Exibir Empresas Alternativas',
      description: 'Se ativado, mostra competidores no final da página do perfil.',
      type: :boolean,
      default: true,
      access_behavior: :toggle,
      group: 'marketplace_behavior'
    },
    'show_competitor_banners' => {
      label: 'Banners de Concorrentes',
      description: 'Permite exibir anúncios de terceiros no perfil desta empresa.',
      type: :boolean,
      default: true,
      access_behavior: :toggle,
      group: 'marketplace_behavior'
    },
    'advanced_analytics' => {
      label: 'Dashboard de Analytics Avançado',
      description: 'Acesso a métricas detalhadas de visualizações, cliques e conversões.',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'insights',
      aliases: %w[analytics dashboard_access analytics_access]
    },
    'leads_marketplace' => {
      label: 'Acesso ao Marketplace de Leads',
      description: 'Permite que a empresa receba e visualize leads direto no painel.',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :hidden,
      group: 'insights',
      aliases: %w[lead_access leads_access]
    },
    'financing_simulation' => {
      label: 'Simulador de Financiamento',
      description: 'Habilita a ferramenta de simulação de parcelas no perfil.',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :locked,
      group: 'insights',
      aliases: %w[financing financing_tab_visible]
    },
    'webhooks' => {
      label: 'Integração via Webhooks (API)',
      description: 'Permite enviar leads automaticamente para o CRM da empresa.',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :hidden,
      group: 'insights',
      aliases: %w[webhook webhook_access]
    },
    'intent_scores' => {
      label: 'Score de Intenção de Compra',
      description: 'Usa IA para classificar quais leads têm maior probabilidade de fechar.',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      teaser: :hidden,
      group: 'insights',
      aliases: %w[intent_engine intent_score_access]
    },
    'sector_question_limit' => {
      label: 'Limite de Perguntas Setoriais',
      description: 'Quantas perguntas a empresa pode responder no benchmark da categoria.',
      type: :integer,
      default: nil,
      access_behavior: :config,
      group: 'insights',
      aliases: %w[sector_questions_limit]
    },
    'setup_fee' => {
      label: 'Taxa de Setup (Implementação)',
      description: 'Valor cobrado uma única vez para ativação da conta.',
      type: :integer,
      default: 0,
      access_behavior: :config,
      group: 'operations',
      aliases: %w[taxa_setup custo_implementacao]
    },
    'setup_included' => {
      label: 'Setup Incluso no Plano',
      description: 'Se marcado, o valor de setup será exibido como GRÁTIS/INCLUSO.',
      type: :boolean,
      default: false,
      access_behavior: :toggle,
      group: 'operations'
    },
    'onboarding_session' => {
      label: 'Sessão de Onboarding Assistida',
      description: 'Treinamento inicial com o time de CS para configuração da conta.',
      type: :boolean,
      default: false,
      access_behavior: :entitlement,
      group: 'operations'
    }
  }.freeze

  TIER_DEFAULT_OVERRIDES = {
    'free' => {
      'setup_included' => true, # Free plans usually don't have setup
      'premium_profile' => false,
      'company_categories_limit' => 3,
      'service_area_states_limit' => 1,
      'service_area_cities_limit' => 3,
      'national_coverage' => false,
      'local_seo_visibility' => false,
      'profile_media_direct_update' => false
    },
    'essential' => {
      'setup_fee' => 0,
      'premium_profile' => false,
      'onboarding_session' => false,
      'ideal_customer_block' => true,
      'promo_banner' => false,
      'verified_product' => true,
      'highlight_badges' => true,
      'custom_ctas' => true,
      'pricing_table' => false,
      'special_offer' => false,
      'sponsored_description' => false,
      'downloadable_materials' => false,
      'projects_showcase' => false,
      'content_intent_analytics' => false,
      'media_gallery' => false,
      'media_upload' => false,
      'p2p_chat' => false,
      'company_categories_limit' => 6,
      'service_area_states_limit' => 1,
      'service_area_cities_limit' => 10,
      'national_coverage' => false,
      'local_seo_visibility' => true,
      'product_images_limit' => 3,
      'featured_review' => false,
      'social_proof' => true,
      'faq_block' => false,
      'advanced_analytics' => false,
      'financing_simulation' => false,
      'sector_question_limit' => 0,
      'show_alternatives' => false,
      'show_competitor_banners' => false,
      'profile_media_direct_update' => false
    },
    'pro' => {
      'setup_fee' => 499,
      'premium_profile' => true,
      'onboarding_session' => true,
      'ideal_customer_block' => true,
      'promo_banner' => true,
      'verified_product' => true,
      'highlight_badges' => true,
      'custom_ctas' => true,
      'pricing_table' => true,
      'special_offer' => true,
      'sponsored_description' => true,
      'downloadable_materials' => true,
      'projects_showcase' => true,
      'content_intent_analytics' => true,
      'media_gallery' => true,
      'media_upload' => true,
      'p2p_chat' => true,
      'company_categories_limit' => 12,
      'service_area_states_limit' => 3,
      'service_area_cities_limit' => 30,
      'national_coverage' => false,
      'local_seo_visibility' => true,
      'product_images_limit' => 5,
      'featured_review' => true,
      'social_proof' => true,
      'faq_block' => true,
      'advanced_analytics' => true,
      'financing_simulation' => true,
      'sector_question_limit' => 10,
      'show_alternatives' => false,
      'show_competitor_banners' => false,
      'profile_media_direct_update' => false
    },
    'enterprise' => {
      'setup_fee' => 1499,
      'premium_profile' => true,
      'onboarding_session' => true,
      'ideal_customer_block' => true,
      'promo_banner' => true,
      'verified_product' => true,
      'highlight_badges' => true,
      'custom_ctas' => true,
      'pricing_table' => true,
      'special_offer' => true,
      'sponsored_description' => true,
      'downloadable_materials' => true,
      'projects_showcase' => true,
      'content_intent_analytics' => true,
      'media_gallery' => true,
      'media_upload' => true,
      'p2p_chat' => true,
      'company_categories_limit' => 999,
      'service_area_states_limit' => 999,
      'service_area_cities_limit' => 999,
      'national_coverage' => true,
      'local_seo_visibility' => true,
      'product_images_limit' => 10,
      'featured_review' => true,
      'social_proof' => true,
      'faq_block' => true,
      'advanced_analytics' => true,
      'leads_marketplace' => true,
      'financing_simulation' => true,
      'webhooks' => true,
      'intent_scores' => true,
      'sector_question_limit' => 25,
      'show_alternatives' => false,
      'show_competitor_banners' => false,
      'profile_media_direct_update' => true
    }
  }.freeze

  class << self
    def known_keys
      FEATURE_DEFINITIONS.keys
    end

    def defaults_for_tier(plan_tier = 'free')
      defaults.merge(TIER_DEFAULT_OVERRIDES.fetch(normalize_plan_tier(plan_tier), {}))
    end

    def defaults
      FEATURE_DEFINITIONS.transform_values do |definition|
        definition[:default]
      end
    end

    def normalize(features, plan_tier: 'free', apply_defaults: true)
      raw = stringify_hash(features)
      normalized =
        if apply_defaults
          defaults_for_tier(plan_tier).merge(preserve_unknown_entries(raw))
        else
          preserve_unknown_entries(raw)
        end

      FEATURE_DEFINITIONS.each do |key, definition|
        explicit = explicit_value(raw, key)
        normalized[key] = explicit.nil? ? normalized[key] : cast_value(explicit, definition)
      end

      normalized
    rescue StandardError
      apply_defaults ? defaults_for_tier(plan_tier) : {}
    end

    def explicit_value(features, key)
      raw = stringify_hash(features)
      candidates_for(key).each do |candidate|
        return raw[candidate] if raw.key?(candidate)
      end
      nil
    end

    def canonical_key_for(key)
      normalized_key = key.to_s
      return normalized_key if FEATURE_DEFINITIONS.key?(normalized_key)

      FEATURE_DEFINITIONS.each do |canonical_key, definition|
        return canonical_key if aliases_for_definition(definition).include?(normalized_key)
      end

      normalized_key
    end

    def feature_definition(key)
      FEATURE_DEFINITIONS[canonical_key_for(key)] || {}
    end

    def access_state_for(key, value)
      definition = feature_definition(key)
      behavior = definition[:access_behavior]

      return 'enabled' if %i[toggle config].include?(behavior)
      return 'enabled' if ActiveModel::Type::Boolean.new.cast(value)

      definition[:teaser] == :hidden ? 'hidden' : 'locked'
    end

    def normalize_plan_tier(plan_tier)
      candidate = plan_tier.to_s
      PLAN_TIERS.include?(candidate) ? candidate : 'free'
    end

    def infer_plan_tier(name:, price:, features: {})
      raw = stringify_hash(features)
      explicit_tier = raw['plan_tier'] || raw['tier']
      normalized_explicit_tier = normalize_plan_tier(explicit_tier)
      return normalized_explicit_tier if explicit_tier.present? && normalized_explicit_tier != 'free'
      return 'free' if explicit_tier.present? && explicit_tier.to_s == 'free'

      lower_name = name.to_s.downcase
      return 'enterprise' if lower_name.include?('enterprise')
      return 'pro' if lower_name.match?(/\b(pro|premium|pago)\b/)
      return 'essential' if lower_name.match?(/\b(essential|essencial)\b/)
      return 'free' if lower_name.match?(/\b(free|gratis|gratuito|basic|basico)\b/)

      return 'enterprise' if enterprise_capabilities?(raw)
      return 'pro' if price.to_f.positive? || paid_capabilities?(raw)

      'free'
    end

    private

    def stringify_hash(features)
      case features
      when Hash
        features.transform_keys(&:to_s)
      else
        {}
      end
    end

    def preserve_unknown_entries(raw)
      known_inputs = FEATURE_DEFINITIONS.each_with_object([]) do |(key, definition), memo|
        memo << key
        memo.concat(aliases_for_definition(definition))
      end

      raw.each_with_object({}) do |(key, value), memo|
        memo[key] = value unless known_inputs.include?(key)
      end
    end

    def candidates_for(key)
      definition = feature_definition(key)
      [canonical_key_for(key)] + aliases_for_definition(definition)
    end

    def aliases_for_definition(definition)
      Array(definition[:aliases]).map(&:to_s)
    end

    def cast_value(value, definition)
      case definition[:type]
      when :integer
        integer = value.to_i
        integer.positive? ? integer : nil
      else
        ActiveModel::Type::Boolean.new.cast(value)
      end
    end

    def enterprise_capabilities?(raw)
      %w[webhooks webhook webhook_access intent_scores intent_engine intent_score_access].any? do |key|
        ActiveModel::Type::Boolean.new.cast(raw[key])
      end
    end

    def paid_capabilities?(raw)
      %w[
        custom_ctas
        active_admin
        quote_feature
        social_proof
        social_proof_enabled
        advanced_analytics
        analytics
        dashboard_access
        pricing_table
        promo_banner
      ].any? do |key|
        ActiveModel::Type::Boolean.new.cast(raw[key])
      end
    end
  end
end
