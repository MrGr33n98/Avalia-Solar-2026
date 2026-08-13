# frozen_string_literal: true

class NextBestActionService
  ACTION_METADATA = {
    "add_categories" => ["profile_add_categories", "CATEGORIES_MISSING", "product-categories"],
    "add_contact_info" => ["profile_add_contact_info", "CONTACT_INFO_MISSING", "product-general"],
    "reply_to_reviews" => ["reputation_reply_to_reviews", "UNREPLIED_REVIEWS_PRESENT", "reviews"],
    "add_description" => ["profile_add_description", "DESCRIPTION_MISSING", "product-general"],
    "add_logo" => ["profile_add_logo", "LOGO_MISSING", "product-general"],
    "add_banner" => ["profile_add_banner", "BANNER_MISSING", "product-general"],
    "invite_reviews" => ["reputation_invite_reviews", "LOW_REVIEW_COUNT", "reviews"],
    "configure_webhook" => ["integration_configure_webhook", "WEBHOOKS_UNCONFIGURED", "integrations"],
    "add_products" => ["content_add_products", "PRODUCTS_MISSING", "product-catalog"],
    "add_projects" => ["content_add_projects", "PROJECTS_MISSING", "product-downloads"],
    "renew_campaigns" => ["advertising_renew_campaigns", "CAMPAIGNS_EXPIRING", "product-banner"]
  }.freeze
  def initialize(company)
    @company = company
  end

  def self.call(company)
    new(company).call
  end

  def call
    return [] if @company.nil?

    actions = []

    # 1. Categories (High Priority)
    if @company.categories.empty?
      actions << {
        id: 'add_categories',
        title: 'Associe sua empresa a categorias',
        description: 'Selecione as verticais de atuação para começar a aparecer nas buscas e receber leads.',
        category: 'profile',
        action_type: 'navigate',
        action_params: { tab: 'product-categories' },
        priority: 95,
        severity: 'high'
      }
    end

    # 2. Contact details (High Priority)
    if [@company.website, @company.phone, @company.whatsapp, @company.email_public].all?(&:blank?)
      actions << {
        id: 'add_contact_info',
        title: 'Adicione canais de contato',
        description: 'Clientes precisam de formas de contato (WhatsApp, telefone, e-mail) para solicitar orçamentos.',
        category: 'profile',
        action_type: 'navigate',
        action_params: { tab: 'product-general' },
        priority: 90,
        severity: 'high'
      }
    end

    # 3. Reviews requiring reply (Medium/High Priority)
    unreplied_reviews_count = @company.reviews.where(reply: nil).count rescue 0
    if unreplied_reviews_count > 0
      actions << {
        id: 'reply_to_reviews',
        title: "Responda a #{unreplied_reviews_count} avaliação#{unreplied_reviews_count == 1 ? '' : 'ões'} pendente#{unreplied_reviews_count == 1 ? '' : 's'}",
        description: 'Responder a avaliações demonstra profissionalismo e aumenta a confiança de novos clientes.',
        category: 'reputation',
        action_type: 'navigate',
        action_params: { tab: 'reviews' },
        priority: 85,
        severity: 'medium'
      }
    end

    # 4. Profile description missing (Medium Priority)
    if @company.description.blank?
      actions << {
        id: 'add_description',
        title: 'Escreva uma descrição da empresa',
        description: 'Apresente sua empresa, especialidades e diferenciais para potenciais clientes.',
        category: 'profile',
        action_type: 'navigate',
        action_params: { tab: 'product-general' },
        priority: 80,
        severity: 'medium'
      }
    end

    # 5. Logo missing (Medium Priority)
    if !@company.logo.attached?
      actions << {
        id: 'add_logo',
        title: 'Adicione a logo da sua empresa',
        description: 'Uma imagem de perfil reconhecível transmite muito mais credibilidade.',
        category: 'profile',
        action_type: 'navigate',
        action_params: { tab: 'product-general' },
        priority: 75,
        severity: 'medium'
      }
    end

    # 6. Banner missing (Low Priority)
    if !@company.banner.attached?
      actions << {
        id: 'add_banner',
        title: 'Defina uma imagem de capa (banner)',
        description: 'Personalize o topo do seu perfil com uma imagem de capa atraente.',
        category: 'profile',
        action_type: 'navigate',
        action_params: { tab: 'product-general' },
        priority: 60,
        severity: 'low'
      }
    end

    # 7. Reviews count < 5 (Medium/Low Priority)
    reviews_count = @company.reviews.count rescue 0
    if reviews_count < 5
      actions << {
        id: 'invite_reviews',
        title: 'Consiga mais avaliações',
        description: "Você tem #{reviews_count} avaliação#{reviews_count == 1 ? '' : 'ões'}. Perfis com pelo menos 5 avaliações têm 3x mais cliques.",
        category: 'reputation',
        action_type: 'navigate',
        action_params: { tab: 'reviews' },
        priority: 70,
        severity: 'medium'
      }
    end

    # 8. Webhook missing (if entitled but not configured) (Low Priority)
    if @company.respond_to?(:can_use_webhooks?) && @company.can_use_webhooks? && @company.company_webhooks.empty?
      actions << {
        id: 'configure_webhook',
        title: 'Configure a integração de Webhooks',
        description: 'Automatize o envio de novos leads diretamente para o seu CRM ou sistema de vendas.',
        category: 'integration',
        action_type: 'navigate',
        action_params: { tab: 'integrations' },
        priority: 55,
        severity: 'low'
      }
    end

    # 9. No products (Low Priority)
    if (@company.products.empty? rescue true)
      actions << {
        id: 'add_products',
        title: 'Cadastre produtos ou serviços',
        description: 'Exiba seus produtos no catálogo para atrair leads qualificados.',
        category: 'content',
        action_type: 'navigate',
        action_params: { tab: 'product-catalog' },
        priority: 50,
        severity: 'low'
      }
    end

    # 10. No projects (Low Priority)
    if (@company.company_projects.empty? rescue true)
      actions << {
        id: 'add_projects',
        title: 'Publique projetos realizados',
        description: 'Mostre seu portfólio de instalações e projetos solares concluídos para comprovar experiência.',
        category: 'content',
        action_type: 'navigate',
        action_params: { tab: 'product-downloads' },
        priority: 45,
        severity: 'low'
      }
    end

    # 11. Banners/Expiring Campaigns (High Priority)
    # Check if there are active banners expiring in less than 3 days
    expiring_banners = @company.banners
                               .where(active: true)
                               .where(moderation_status: 'approved')
                               .where(end_date: Time.current..3.days.from_now)
    if expiring_banners.any?
      actions << {
        id: 'renew_campaigns',
        title: 'Campanha de anúncios expirando',
        description: 'Uma ou mais campanhas de banners estão perto de expirar. Renove para manter sua veiculação ativa.',
        category: 'advertising',
        action_type: 'navigate',
        action_params: { tab: 'product-banner' },
        priority: 95,
        severity: 'high'
      }
    end

    actions.each { |action| enrich_action(action) }
    actions.sort_by { |a| -a[:priority] }
  end

  def enrich_action(action)
    key, reason_code, destination = ACTION_METADATA.fetch(action[:id])
    action.merge!(key: key, reason_code: reason_code, destination: destination, entity_context: {})
  end
end
