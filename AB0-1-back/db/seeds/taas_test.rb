# db/seeds/taas_test.rb
# Geração de dados para teste de TaaS (Leads e Oportunidades)

# 1. Identificar a WEG (ID 372 conforme informado pelo usuário)
weg = Company.find_by(id: 372)

unless weg
  puts "ERRO: Empresa com ID 372 não encontrada no banco."
  # Tentar buscar por slug caso o ID seja diferente no ambiente atual
  weg = Company.find_by(slug: 'weg')
  puts "Buscando por slug 'weg'..." if weg
end

if weg
  # Garantir que a WEG tenha um plano que seja detectado como PRO pelo meu fix
  # Isso garante que o Analytics e as Oportunidades não fiquem bloqueados
  active_plan = weg.current_active_plan || weg.plans.last
  if active_plan
    unless active_plan.name =~ /Pro|Enterprise/i
      puts "Ajustando nome do plano '#{active_plan.name}' para incluir 'Pro' (Tier Gating)..."
      active_plan.update!(name: "#{active_plan.name} Pro")
    end
  else
    puts "Criando plano Pro de teste para a WEG..."
    Plan.create!(
      company: weg,
      name: "Plano Pro Enterprise",
      price_cents: 69900,
      active: true,
      inferred_plan_tier: 'pro'
    )
  end

  category = weg.categories.first || Category.find_by(seo_url: 'energia-solar') || Category.first
  puts "--- Gerando dados para #{weg.name} (ID: #{weg.id}) na categoria #{category.name} ---"

  # 2. Gerar 3 Leads Diretos para a WEG (Para o Analytics Principal)
  ['Felipe Instalador', 'Ana Project Eng', 'Carlos Solar'].each_with_index do |name, i|
    email = "lead_weg_#{i}_#{Time.now.to_i}@teste.com"
    lead = Lead.find_or_create_by!(email: email) do |l|
      l.name = name
      l.phone = "119#{rand(10000000..99999999)}"
      l.company = weg
      l.category = category
      l.status = 'pending'
      l.message = "Interesse nos produtos WEG."
    end
    
    # Criar atividade para gerar score de intenção
    BuyerIntentActivity.create!(
      company: weg,
      user_id: lead.id,
      signal_type: 'contact_form_submission',
      signal_category: 'contact_intent',
      intent_weight: 50,
      tracked_at: Time.current
    )
    
    IntentScoringService.new(weg.id, lead_id: lead.id).calculate!
  end

  # 3. Gerar 10 Oportunidades de Mercado (Mesma categoria, outra empresa ou sem empresa)
  # Isso popula a aba "Oportunidades"
  outra_empresa = Company.where.not(id: weg.id).first
  10.times do |i|
    email = "oport_#{i}_#{Time.now.to_i}@mercado.com"
    lead = Lead.create!(
      name: "Oportunidade #{i+1} Mercado",
      email: email,
      phone: "119#{rand(10000000..99999999)}",
      company: (i % 2 == 0 ? outra_empresa : nil),
      category: category,
      status: 'pending',
      city: ['São Paulo', 'Curitiba', 'Joinville', 'Itajaí'].sample,
      state: ['SP', 'PR', 'SC'].sample,
      product_vertical: ['residencial', 'comercial'].sample
    )
    
    # Simular que a WEG detectou interesse nesse lead (TaaS)
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
  puts "ERRO CRÍTICO: Não foi possível encontrar a WEG para gerar os dados."
end
