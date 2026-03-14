# db/seeds/plans_seed.rb
puts "--- Iniciando Seed de Planos ---"

# 1. Limpeza opcional
# Plan.destroy_all 

plans_data = [
  {
    name: "Plano Free",
    description: "Ideal para novas empresas testarem a visibilidade básica na plataforma.",
    price: 0.0,
    tier: 'free',
    features_override: {
      'product_description' => true,
      'product_features_block' => true,
      'company_links_block' => true,
      'setup_included' => true
    }
  },
  {
    name: "Plano Starter",
    description: "Focado em conversão e prova social para empresas em crescimento.",
    price: 299.0,
    tier: 'pro',
    features_override: {
      'custom_ctas' => true,
      'verified_product' => true,
      'social_proof' => true,
      'media_gallery' => true,
      'setup_fee' => 299,
      'onboarding_session' => true
    }
  },
  {
    name: "Plano Pro",
    description: "A solução completa com inteligência de mercado, leads e suporte prioritário.",
    price: 699.0,
    tier: 'enterprise',
    features_override: {
      'advanced_analytics' => true,
      'leads_marketplace' => true,
      'intent_scores' => true,
      'webhooks' => true,
      'setup_fee' => 499,
      'onboarding_session' => true,
      'show_alternatives' => false, # Proteção contra concorrentes no perfil
      'show_competitor_banners' => false
    }
  }
]

plans_data.each do |data|
  plan = Plan.find_or_initialize_by(name: data[:name])
  
  # Pegamos os defaults do Tier
  base_features = PlanFeatureCatalog.defaults_for_tier(data[:tier])
  
  # Mesclamos com os overrides específicos do seed
  final_features = base_features.merge(data[:features_override])
  
  plan.assign_attributes(
    description: data[:description],
    price: data[:price]
  )

  # Fallback defensivo para evitar UnknownAttributeError
  if plan.respond_to?(:features_json=)
    plan.features_json = final_features
  elsif plan.respond_to?(:features=)
    plan.features = final_features.to_json
  end

  if plan.save
    puts "✅ Plano '#{plan.name}' (#{data[:tier]}) criado/atualizado com sucesso!"
  else
    puts "❌ Erro ao criar plano '#{data[:name]}': #{plan.errors.full_messages.join(', ')}"
  end
end

puts "--- Seed Finalizado ---"
