# db/seeds/taas_test.rb
# Geração de dados para teste de TaaS (Leads e Oportunidades)

# 1. Identificar a WEG (ID 372 conforme informado pelo usuário)
weg = Company.find_by(id: 372)

unless weg
  puts "ERRO: Empresa com ID 372 não encontrada no banco."
  weg = Company.find_by(slug: 'weg')
  puts "Buscando por slug 'weg'..." if weg
end

if weg
  puts "--- Ativando recursos Premium para #{weg.name} ---"
  # Habilitar Plano Pro e Active Admin (Requisito para receber leads/Gating)
  weg.update!(active_admin: true) if weg.respond_to?(:active_admin)
  
  active_plan = weg.plan
  if active_plan
    unless active_plan.name =~ /Pro|Enterprise/i
      active_plan.update!(name: "#{active_plan.name} Pro")
    end
  else
    plan = Plan.find_by("name ILIKE ?", "%Pro%") || Plan.create!(
      name: "Plano Pro Enterprise",
      price: 699.00,
      features_json: { "advanced_analytics" => true, "intent_scores" => true }
    )
    weg.update!(plan: plan)
  end

  category = weg.categories.first || Category.find_by(seo_url: 'energia-solar') || Category.first
  puts "--- Gerando dados para #{weg.name} (ID: #{weg.id}) na categoria #{category.name} ---"

  # 2. Gerar 3 Leads Diretos (Satisfazendo validações de produção)
  ['Felipe Instalador', 'Ana Project Eng', 'Carlos Solar'].each_with_index do |name, i|
    email = "lead_weg_#{i}_#{Time.now.to_i}@teste.com"
    lead = Lead.find_or_create_by!(email: email) do |l|
      l.name = name
      l.phone = "119#{rand(10000000..99999999)}"
      l.company = weg
      l.category = category
      l.wizard_status = 'distributed'
      l.product_vertical = 'mobilidade_eletrica'
      l.project_profile = 'residencial'
      l.quote_type = 'standard'
      l.system_size_band = 'pequeno'
      l.decision_timeline = 'imediato'
      l.address_full = 'Rua Teste, 123, São Paulo - SP'
      l.consent_at = Time.current
      l.message = "Interesse nos produtos WEG."
    end

    # Atividade de intenção
    BuyerIntentActivity.create!(
      company: weg,
      user_id: lead.id,
      signal_type: 'pricing_interaction',
      signal_category: 'financial_intent',
      session_id: "seed_#{Time.now.to_i}",
      page_path: "/produtos/weg-solar-v1",
      tracked_at: Time.current
    )
    
    IntentScoringService.new(weg.id, lead_id: lead.id).calculate!
  end

  # 3. Gerar 10 Oportunidades de Mercado
  outra_empresa = Company.where.not(id: weg.id).first
  # Também habilitar para a concorrente não dar erro de validação
  outra_empresa.update!(active_admin: true) if outra_empresa && outra_empresa.respond_to?(:active_admin)

  10.times do |i|
    email = "oport_#{i}_#{Time.now.to_i}@mercado.com"
    lead = Lead.create!(
      name: "Oportunidade #{i+1} Mercado",
      email: email,
      phone: "119#{rand(10000000..99999999)}",
      company: (i % 2 == 0 ? outra_empresa : nil),
      category: category,
      wizard_status: 'distributed',
      product_vertical: 'residencial',
      project_profile: 'residencial',
      quote_type: 'standard',
      system_size_band: 'medio',
      decision_timeline: '30_dias',
      address_full: 'Rua Mercado, 999, Curitiba - PR',
      consent_at: Time.current,
      city: 'Curitiba',
      state: 'PR'
    )

    IntentScore.create!(
      company_id: weg.id,
      lead_id: lead.id,
      total_score: rand(50..98),
      intent_level: ['hot', 'boiling', 'immediate'].sample,
      total_signals_count: rand(8..30),
      last_interaction_at: Time.current,
      recommended_action: 'Enviar orçamento prioritário',
      scoring_version: 'v1'
    )
  end

  puts "✅ SUCESSO! 13 leads gerados. Verifique o dashboard da WEG."
else
  puts "ERRO: WEG não encontrada."
end
