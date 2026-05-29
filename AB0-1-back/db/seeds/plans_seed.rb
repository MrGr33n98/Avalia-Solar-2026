# db/seeds/plans_seed.rb
puts "--- Iniciando Seed de Planos ---"

# 1. Limpeza opcional
# Plan.destroy_all 

plans_data = [
  {
    name: "Plano Gratuito",
    description: "Ideal para novas empresas garantirem presença básica no maior portal de energia solar do Brasil.",
    price: 0.0,
    tier: 'free',
    display_order: 0,
    stripe_price_id_monthly: nil,
    features_override: {
      'product_description' => true,
      'product_features_block' => true,
      'company_links_block' => true,
      'setup_included' => true
    }
  },
  {
    name: "Plano Essencial",
    description: "Ideal para empresas que querem sair do perfil básico e aparecer com mais destaque na Avalia Solar.",
    price: 59.90,
    tier: 'essential',
    display_order: 1,
    stripe_price_id_monthly: nil,
    features_override: {
      'custom_ctas' => true,
      'verified_product' => true,
      'highlight_badges' => true,
      'social_proof' => true,
      'product_images_limit' => 3,
      'show_alternatives' => false,
      'show_competitor_banners' => false
    }
  },
  {
    name: "Plano Pro",
    description: "Vitrine comercial completa com conversão otimizada, sem anúncios de concorrentes e mais destaque.",
    price: 149.90,
    tier: 'pro',
    display_order: 2,
    stripe_price_id_monthly: 'price_pro123', # Mantém compatibilidade com testes de checkout
    features_override: {
      'custom_ctas' => true,
      'verified_product' => true,
      'highlight_badges' => true,
      'social_proof' => true,
      'promo_banner' => true,
      'pricing_table' => true,
      'special_offer' => true,
      'sponsored_description' => true,
      'downloadable_materials' => true,
      'media_gallery' => true,
      'media_upload' => true,
      'product_images_limit' => 5,
      'featured_review' => true,
      'faq_block' => true,
      'advanced_analytics' => true,
      'financing_simulation' => true,
      'sector_question_limit' => 10,
      'show_alternatives' => false,
      'show_competitor_banners' => false
    }
  },
  {
    name: "Plano Enterprise",
    description: "Inteligência de mercado completa, leads qualificados, integrações via webhook e governança avançada.",
    price: 1499.00,
    tier: 'enterprise',
    display_order: 3,
    stripe_price_id_monthly: 'price_enterprise123', # Mantém compatibilidade com testes de faturamento
    features_override: {
      'advanced_analytics' => true,
      'leads_marketplace' => true,
      'intent_scores' => true,
      'webhooks' => true,
      'setup_fee' => 1499,
      'onboarding_session' => true,
      'show_alternatives' => false,
      'show_competitor_banners' => false
    }
  }
]

plans_data.each do |data|
  # Busca pelo slug se mapeado ou pelo nome
  plan = Plan.find_or_initialize_by(name: data[:name])
  
  # Pegamos os defaults do Tier
  base_features = PlanFeatureCatalog.defaults_for_tier(data[:tier])
  
  # Mesclamos com os overrides específicos do seed
  final_features = base_features.merge(data[:features_override])
  
  plan.assign_attributes(
    description: data[:description],
    price: data[:price],
    is_public: true,
    display_order: data[:display_order]
  )

  # Atribui o ID do Stripe seguro
  if plan.respond_to?(:stripe_price_id_monthly=)
    plan.stripe_price_id_monthly = data[:stripe_price_id_monthly]
  end

  # Fallback defensivo para evitar UnknownAttributeError
  if plan.respond_to?(:features_json=)
    plan.features_json = final_features
  elsif plan.respond_to?(:features=)
    plan.features = final_features.to_json
  end

  # Define o tier correspondente no plano se o modelo possuir
  if plan.respond_to?(:plan_tier_template=)
    plan.plan_tier_template = data[:tier]
  end

  if plan.save
    puts "✅ Plano '#{plan.name}' (#{data[:tier]}) criado/atualizado com sucesso!"
  else
    puts "❌ Erro ao criar plano '#{data[:name]}': #{plan.errors.full_messages.join(', ')}"
  end
end

puts "--- Seed Finalizado ---"

