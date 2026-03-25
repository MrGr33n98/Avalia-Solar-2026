begin
  # Identificar a WEG (ID 372 conforme informado pelo usuário)
  weg = Company.find_by(id: 372) || Company.find_by(slug: 'weg')

  unless weg
    puts "Empresa WEG não encontrada. Criando para teste..."
    weg = Company.create!(
      id: 372,
      name: 'WEG',
      slug: 'weg',
      status: 'active',
      active_admin: true,
      email: 'contato@weg.net',
      email_public: 'vendas@weg.net',
      phone: '4732764000',
      description: 'Test description for WEG.',
      state: 'SC',
      city: 'Jaraguá do Sul',
      categories: [Category.first].compact
    )
  end

  if weg
    # Garantir que a WEG tenha um plano que seja detectado como PRO pelo meu fix
    active_plan = weg.plan
    if active_plan
      unless active_plan.name =~ /Pro|Enterprise/i
        puts "Ajustando nome do plano '#{active_plan.name}' para incluir 'Pro' (Tier Gating)..."
        active_plan.update!(name: "#{active_plan.name} Pro")
      end
    else
      puts "Garantindo plano Pro de teste para a WEG..."
      pro_plan = Plan.find_or_create_by!(name: "Plano Pro Enterprise") do |p|
        p.price = 699.00
        p.features_json = { analytics: true, opportunities: true }
      end
      weg.update!(plan: pro_plan)
    end

    category = weg.categories.first || Category.find_by(seo_url: 'energia-solar') || Category.first
    puts "--- Gerando dados para #{weg.name} (ID: #{weg.id}) na categoria #{category.name} ---"

    # 2. Gerar 3 Leads Diretos para a WEG (Para o Analytics Principal)
    ['Felipe Instalador', 'Ana Project Eng', 'Carlos Solar'].each_with_index do |name, i|
      email = "lead_weg_#{i}_#{Time.now.to_i}@teste.com"
      lead = Lead.find_or_create_by!(email: email) do |l|
        l.name = name
        l.phone = "119#{rand(10000000..99999999)}"
        l.company_id = weg.id
        l.product_vertical = 'Energia Solar'
        l.project_profile = 'residencial'
        l.quote_type = 'complete_system'
        l.system_size_band = 'small'
        l.decision_timeline = 'imediato'
        l.address_full = 'Rua Teste, 123'
        l.city = 'Jaraguá do Sul'
        l.state = 'SC'
        l.wizard_status = 'distributed'
        l.message = "Interesse nos produtos WEG."
        l.consent_at = Time.current
      end
      
      # Criar atividade para gerar score de intenção
      BuyerIntentActivity.create!(
        company: weg,
        user_id: lead.id,
        signal_type: 'contact_form_submission',
        signal_category: 'contact_intent',
        intent_weight: 50,
        session_id: "session_#{lead.id}",
        page_path: "/products/weg-solar",
        metadata: { source: 'organic' },
        tracked_at: Time.current
      )
      
      IntentScoringService.new(weg.id, lead_id: lead.id).calculate!
    end

    # 3. Gerar 10 Oportunidades de Mercado (Mesma categoria, outra empresa ou sem empresa)
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
rescue => e
  puts "ERRO DURANTE O SEED: #{e.class} - #{e.message}"
  puts e.backtrace.first(5).join("\n")
end
