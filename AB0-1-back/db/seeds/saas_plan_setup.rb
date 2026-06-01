# frozen_string_literal: true

require 'uri'

module Seeds
  module SaasPlanSetup
    module_function

    PLAN_BLUEPRINTS = [
      {
        company_slug: 'genial-solar',
        company_name: 'Genial Solar',
        company_state: 'SP',
        company_city: 'São Paulo',
        company_website: 'https://genialsolar.com.br',
        company_description: 'Empresa usada como fixture para validar o fluxo SaaS Pro no admin.',
        company_category_seo_urls: %w[energia-solar instaladores-energia-solar],
        plan_name: 'Plano SaaS Pro Leads',
        plan_tier: 'pro',
        price: 1490.00,
        description: 'Plano Pro para validar recursos comerciais, analytics e operacao de assinaturas.',
        product_sku: 'seed-saas-genial-solar',
        product_name: 'Assinatura SaaS Genial Solar'
      },
      {
        company_slug: 'weg',
        company_name: 'WEG',
        company_state: 'SC',
        company_city: 'Florianópolis',
        company_website: 'https://www.weg.net',
        company_description: 'Empresa usada como fixture para validar o fluxo SaaS Enterprise no admin.',
        company_category_seo_urls: %w[mobilidade-eletrica carregadores-residenciais],
        plan_name: 'Plano SaaS Enterprise Leads',
        plan_tier: 'enterprise',
        price: 4990.00,
        description: 'Plano Enterprise para validar leads SaaS, webhooks, intent score e governanca.',
        product_sku: 'seed-saas-weg',
        product_name: 'Assinatura SaaS WEG'
      }
    ].freeze

    def run!
      puts "\n==> Planos SaaS de teste"

      PLAN_BLUEPRINTS.each do |blueprint|
        company = find_or_create_company!(blueprint)
        category = ensure_primary_category!(company, blueprint)
        plan = ensure_plan!(blueprint)
        product = ensure_product!(company, category, blueprint, plan)
        subscription = ensure_subscription!(company, category, product, plan)

        sync_company_plan!(company, plan)

        puts "  ✓ #{company.name}: plano=#{plan.name} produto=#{product.name} assinatura=#{subscription.status || 'sem status'}"
      end
    end

    def find_or_create_company!(blueprint)
      company = Company.find_or_initialize_by(slug: blueprint[:company_slug])
      company.assign_attributes(
        name: blueprint[:company_name],
        description: blueprint[:company_description],
        website: blueprint[:company_website],
        email: "contato@#{safe_domain_for(blueprint[:company_website], blueprint[:company_slug])}",
        email_public: "contato@#{safe_domain_for(blueprint[:company_website], blueprint[:company_slug])}",
        phone: '11999999999',
        state: blueprint[:company_state],
        city: blueprint[:company_city],
        status: 'active'
      )

      company.moderation_status = 'approved' if company.respond_to?(:moderation_status=)
      company.featured = true if company.respond_to?(:featured=) && company.featured.nil?

      blueprint[:company_category_seo_urls].each do |seo_url|
        category = Category.find_by(seo_url: seo_url)
        next unless category

        company.categories << category unless company.categories.include?(category)
      end

      company.save!

      company
    end

    def ensure_primary_category!(company, blueprint)
      company.categories.order(:id).first ||
        Category.find_by(seo_url: blueprint[:company_category_seo_urls].first) ||
        Category.find_by(seo_url: 'energia-solar') ||
        Category.find_by(seo_url: 'mobilidade-eletrica') ||
        raise("Nenhuma categoria encontrada para #{company.slug}")
    end

    def ensure_plan!(blueprint)
      features = PlanFeatureCatalog.defaults_for_tier(blueprint[:plan_tier]).merge(
        'plan_tier' => blueprint[:plan_tier]
      )

      plan = Plan.find_or_initialize_by(name: blueprint[:plan_name])
      plan.description = blueprint[:description]
      plan.price = blueprint[:price]
      plan.plan_tier_template = blueprint[:plan_tier]
      plan.features_json = features
      plan.save!
      plan
    end

    def ensure_product!(company, category, blueprint, plan)
      product = company.products.find_or_initialize_by(sku: blueprint[:product_sku])
      product.assign_attributes(
        name: blueprint[:product_name],
        description: "#{blueprint[:description]} Empresa vinculada: #{company.name}.",
        short_description: "Produto seed para operacao do plano #{plan.name}.",
        price: plan.price,
        status: 'active',
        featured: false
      )
      product.save!
      product.categories << category unless product.categories.exists?(category.id)
      product
    end

    def ensure_subscription!(company, category, product, plan)
      subscription = SubscriptionPlan.find_or_initialize_by(
        product: product,
        category: category,
        plan: plan
      )
      subscription.member ||= company.users.order(:id).first
      subscription.value = plan.price
      subscription.status = 'active'
      subscription.purchased_at ||= Time.current
      subscription.start_at ||= Time.current
      subscription.end_at ||= 1.year.from_now
      subscription.save!
      subscription
    end

    def sync_company_plan!(company, plan)
      changes_applied = false

      if company.respond_to?(:plan_id) && company.plan_id != plan.id
        company.plan = plan
        changes_applied = true
      end

      if company.respond_to?(:plan_status) && company.plan_status != 'active'
        company.plan_status = 'active'
        changes_applied = true
      end

      company.save! if changes_applied
    end

    def safe_domain_for(url, fallback_slug)
      host = URI.parse(url).host if url.present?
      host = host.to_s.sub(/\Awww\./, '')
      host.presence || "#{fallback_slug}.com.br"
    rescue StandardError
      "#{fallback_slug}.com.br"
    end
  end
end
