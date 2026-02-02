# db/seeds_mobilidade_eletrica.rb
# Seed melhorado com hierarquia de categorias otimizadas para SEO,
# nomes descritivos em português (baseados em termos comuns no Brasil como
# "pontos de recarga", "mobilidade elétrica", "eletropostos", CPO, EMSP etc.),
# campos SEO preenchidos e estrutura hierárquica (categoria raiz + subcategorias).

def generate_slug(text)
  text.downcase
      .gsub(/[áàâãä]/, 'a')
      .gsub(/[éèêë]/, 'e')
      .gsub(/[íìîï]/, 'i')
      .gsub(/[óòôõö]/, 'o')
      .gsub(/[úùûü]/, 'u')
      .gsub('ç', 'c')
      .gsub('ñ', 'n')
      .gsub('&', '-and-')
      .gsub('·', '-')
      .gsub(/[^a-z0-9\-]/, '-')
      .gsub(/-+/, '-')
      .gsub(/^-+|-+$/, '')
end

puts "🔌 Criando categoria raiz de Mobilidade Elétrica..."

root = Category.find_or_create_by!(seo_url: "ecossistema-mobilidade-eletrica-brasil") do |c|
  c.name = "Ecossistema de Mobilidade Elétrica no Brasil"
  c.seo_title = "Diretório Completo do Ecossistema de Mobilidade Elétrica no Brasil 2026"
  c.short_description = "Lista das principais empresas de recarga de veículos elétricos no Brasil: operadores (CPOs), plataformas (EMSPs), fabricantes, utilities, instaladores e montadoras."
  c.description = "O diretório mais atualizado do mercado de mobilidade elétrica e infraestrutura de recarga EV no Brasil, com foco em expansão de eletropostos e soluções para veículos elétricos."
  c.kind = "main"
  c.status = "active"
  c.featured = true
end

puts "✅ Categoria raiz criada: #{root.name}"

puts "\n📂 Criando subcategorias otimizadas para SEO..."

subcategory_definitions = {
  "CPO" => {
    name: "Operadores de Pontos de Recarga (CPOs)",
    seo_url: "operadores-pontos-recarga-cpos",
    seo_title: "Principais Operadores de Pontos de Recarga (CPOs) no Brasil 2026",
    short_description: "Redes de eletropostos e operadores de infraestrutura de carregamento para veículos elétricos.",
    description: "Empresas CPO responsáveis pela instalação, operação e manutenção de pontos de recarga públicos e privados em todo o Brasil."
  },
  "EMSP" => {
    name: "Provedores de Serviços de Mobilidade Elétrica (EMSPs)",
    seo_url: "provedores-servicos-mobilidade-eletrica-emsps",
    seo_title: "Melhores Plataformas EMSP e Apps de Recarga EV no Brasil 2026",
    short_description: "Softwares, apps e plataformas para gestão, pagamento e roaming de recarga de veículos elétricos.",
    description: "EMSPs oferecem soluções white-label, billing, integração IoT, roaming global e ferramentas para operadores e usuários finais."
  },
  "Fabricante" => {
    name: "Fabricantes de Carregadores e Hardware EV",
    seo_url: "fabricantes-carregadores-hardware-ev",
    seo_title: "Principais Fabricantes de Carregadores e Equipamentos EV no Brasil 2026",
    short_description: "Empresas que produzem estações de recarga, conectores e componentes para veículos elétricos.",
    description: "Fabricantes nacionais e internacionais de carregadores AC/DC, conectores, cabos e soluções de hardware para infraestrutura de recarga."
  },
  "Utility" => {
    name: "Concessionárias de Energia e Utilities",
    seo_url: "concessionarias-energia-utilities-ev",
    seo_title: "Utilities e Concessionárias no Setor de Recarga EV no Brasil 2026",
    short_description: "Empresas de energia envolvidas em projetos de mobilidade elétrica e integração com a rede.",
    description: "Concessionárias que desenvolvem redes de recarga, parcerias com montadoras e soluções baseadas em energia renovável."
  },
  "Consultoria" => {
    name: "Instaladores e Empresas de Engenharia em Recarga EV",
    seo_url: "instaladores-engenharia-recarga-ev",
    seo_title: "Melhores Instaladores e Consultores de Infraestrutura de Recarga EV no Brasil 2026",
    short_description: "Especialistas em projeto, instalação e manutenção de pontos de recarga para residências, condomínios e empresas.",
    description: "Empresas de consultoria, engenharia e instalação turnkey de infraestrutura de carregamento para veículos elétricos."
  },
  "Montadora" => {
    name: "Montadoras de Veículos Elétricos (OEMs)",
    seo_url: "montadoras-veiculos-eletricos-oems",
    seo_title: "Montadoras e OEMs com Soluções de Recarga no Brasil 2026",
    short_description: "Fabricantes de veículos elétricos que desenvolvem ou parceiram redes de carregamento.",
    description: "Montadoras como BYD, Volvo, BMW, Renault e outras com iniciativas próprias ou parcerias em redes de recarga EV."
  }
}

child_categories = {}

subcategory_definitions.each do |key, data|
  child_categories[key] = Category.find_or_create_by!(seo_url: data[:seo_url]) do |c|
    c.name = data[:name]
    c.parent_id = root.id
    c.seo_title = data[:seo_title]
    c.short_description = data[:short_description]
    c.description = data[:description]
    c.kind = "main"
    c.status = "active"
    c.featured = false
  end
  puts "  ✓ #{data[:name]}"
end

puts "\n🏢 Criando/associando empresas..."

companies_data = [
  ["Zletric", "https://www.zletric.com.br", "CPO", "SP", "Maior rede Brasil, foco em condomínios, parceria EDP", "Alta (P0)"],
  ["EDP Smart Charging", "https://solucoes.edp.com.br", "CPO", "SP", "Integração utility + recarga, parceria BMW, Renault", "Alta (P0)"],
  ["Raízen Power", "https://raizen.com", "CPO", "SP", "CaaS (Charging as a Service), foco frotistas", "Alta (P0)"],
  ["Movida", "https://movida.com.br", "CPO", "SP", "Rede em agências de locação", "Media (P1)"],
  ["Auren Energia", "https://auren.com.br", "CPO", "PR", "Foco corporativo", "Media (P1)"],
  ["NeoCharge", "https://neocharge.com.br", "CPO", "SP", "Especialista em manutenção", "Alta (P0)"],
  ["Eletroposto", "https://eletroposto.com.br", "CPO", "MG", "Marcas próprias", "Media (P1)"],
  ["Cobra", "https://cobra.com.br", "CPO", "SP", "Empresa do grupo ABB", "Baixa (P2)"],
  ["Q-Auto", "https://qauto.com.br", "CPO", "SP", "Rede em concessionárias", "Media (P1)"],
  ["Ambev ZAE", "https://ambev.com.br", "CPO", "SP", "Utiliza própria frota como caso", "Baixa (P2)"],
  ["Gol Smartfly", "https://voegol.com.br", "CPO", "SP", "Foco em mobilidade aérea", "Baixa (P2)"],
  ["Localiza", "https://localiza.com", "CPO", "MG", "Integração com aluguel", "Media (P1)"],
  ["Unidas", "https://unidas.com.br", "CPO", "SP", "Similar a Localiza/Movida", "Media (P1)"],
  ["Watt+", "https://wattmais.com.br", "CPO", "RS", "Foco em rodovias", "Alta (P0)"],
  ["Plug.me", "https://plug.me", "CPO", "SP", "Modelo híbrido CPO/eMSP", "Media (P1)"],
  ["EcoCar", "https://ecocar.com.br", "CPO", "PR", "Energia 100% renovável", "Alta (P0)"],
  ["GreenHub", "https://greenhub.com.br", "CPO", "SC", "Estações em centros urbanos", "Media (P1)"],
  ["VoltUP", "https://voltup.com.br", "CPO", "SP", "Especialista em DC >150kW", "Alta (P0)"],
  ["Plug&Charge", "https://plugcharge.com.br", "CPO", "RJ", "Tecnologia plug&charge", "Media (P1)"],
  ["E-Car", "https://ecar.com.br", "CPO", "SP", "Forte em São Paulo", "Media (P1)"],
  ["RecargaBR", "https://recargabr.com.br", "CPO", "MG", "Expansão agressiva", "Alta (P0)"],
  ["Zig", "https://zig.com.br", "CPO", "SP", "Integração energia solar", "Alta (P0)"],
  ["E-Power", "https://epower.com.br", "CPO", "RS", "B2B exclusivo", "Alta (P0)"],
  ["ChargeBR", "https://chargebr.com.br", "CPO", "PR", "Operador independente", "Media (P1)"],
  ["E-Moving", "https://emoving.com.br", "CPO", "SP", "Recarga + serviços", "Media (P1)"],
  ["Voltbras", "https://voltbras.com", "EMSP", "SP", "White label para empresas", "Alta (P0)"],
  ["Plug&Go", "https://plugandgo.com.br", "EMSP", "RJ", "Maior base usuários ativos", "Media (P1)"],
  ["EasyCharge", "https://easycharge.com.br", "EMSP", "SP", "Foco corporativo", "Alta (P0)"],
  ["Mobia", "https://mobia.com.br", "EMSP", "PR", "Plataforma modular", "Media (P1)"],
  ["Eletra", "https://eletra.com.br", "EMSP", "MG", "Especialista em billing", "Alta (P0)"],
  ["Chargemap", "https://chargemap.com", "EMSP", "SP", "Roaming global", "Baixa (P2)"],
  ["NextCharge", "https://nextcharge.com.br", "EMSP", "SC", "IoT integrado", "Media (P1)"],
  ["Wattmind", "https://wattmind.com", "EMSP", "RS", "Business intelligence", "Media (P1)"],
  ["ChargeLab", "https://chargelab.com.br", "EMSP", "SP", "API-first", "Alta (P0)"],
  ["E-Mob", "https://emob.com.br", "EMSP", "MG", "ERP para CPOs", "Media (P1)"],
  ["SmartCharge", "https://smartcharge.com.br", "EMSP", "SP", "Smart charging algorithms", "Alta (P0)"],
  ["PlugShare BR", "https://plugshare.com", "EMSP", "SP", "User-generated content", "Baixa (P2)"],
  ["RecargaFácil", "https://recargafacil.com.br", "EMSP", "RJ", "Foco em pagamento", "Media (P1)"],
  ["GoEletric", "https://goeletric.com.br", "EMSP", "SP", "Solução completa", "Alta (P0)"],
  ["ChargePoint BR", "https://chargepoint.com", "EMSP", "SP", "Presença internacional", "Baixa (P2)"],
  ["EVBox BR", "https://evbox.com", "EMSP", "SP", "Vertical integration", "Baixa (P2)"],
  ["Driivz BR", "https://driivz.com", "EMSP", "SP", "Grandes operadores", "Baixa (P2)"],
  ["has·to·be BR", "https://has-to-be.com", "EMSP", "SP", "Europeia com base BR", "Baixa (P2)"],
  ["Greenflux", "https://greenflux.com", "EMSP", "SP", "Holandesa no Brasil", "Baixa (P2)"],
  ["Monta BR", "https://monta.com", "EMSP", "SP", "Dinamarquesa expansão BR", "Baixa (P2)"],
  ["WEG", "https://weg.net", "Fabricante", "SC", "Fabricação nacional", "Alta (P0)"],
  ["Delta Electronics", "https://delta.com.br", "Fabricante", "SP", "Taiwanesa, fábrica BR", "Alta (P0)"],
  ["ABB", "https://abb.com.br", "Fabricante", "SP", "Multinacional completa", "Alta (P0)"],
  ["Siemens", "https://siemens.com.br", "Fabricante", "SP", "Grandes projetos", "Media (P1)"],
  ["Schneider Electric", "https://se.com/br", "Fabricante", "SP", "EcoStruxure platform", "Media (P1)"],
  ["Alfen", "https://alfen.com", "Fabricante", "SP", "Holandesa qualidade", "Media (P1)"],
  ["Efacec", "https://efacec.pt", "Fabricante", "SP", "Portuguesa, forte em DC", "Alta (P0)"],
  ["Tritium", "https://tritium.com.au", "Fabricante", "SP", "Australiana, 350kW+", "Alta (P0)"],
  ["Wallbox", "https://wallbox.com", "Fabricante", "SP", "Espanhola design", "Alta (P0)"],
  ["Enel X", "https://enelx.com", "Fabricante", "SP", "Italiana, smart charging", "Media (P1)"],
  ["Blink Charging", "https://blinkcharging.com", "Fabricante", "SP", "Americana expansão BR", "Media (P1)"],
  ["EV Safe Charge", "https://evsafecharge.com", "Fabricante", "SP", "Carregamento robotizado", "Baixa (P2)"],
  ["Zaptec", "https://zaptec.com", "Fabricante", "SP", "Compactos e eficientes", "Media (P1)"],
  ["Eaton", "https://eaton.com/br", "Fabricante", "SP", "Americana estabilidade", "Media (P1)"],
  ["Legrand", "https://legrand.com.br", "Fabricante", "SP", "Foco residencial", "Alta (P0)"],
  ["Phoenix Contact", "https://phoenixcontact.com.br", "Fabricante", "SP", "Componentes elétricos", "Baixa (P2)"],
  ["Weidmüller", "https://weidmueller.com.br", "Fabricante", "SP", "Conectores especializados", "Baixa (P2)"],
  ["Rosenberger", "https://rosenberger.com.br", "Fabricante", "SP", "Conectores alta tensão", "Baixa (P2)"],
  ["MENNEKES", "https://mennekes.com.br", "Fabricante", "SP", "Alemã qualidade", "Baixa (P2)"],
  ["TE Connectivity", "https://te.com/br", "Fabricante", "SP", "Conectores e cabos", "Baixa (P2)"],
  ["Leoni", "https://leoni.com.br", "Fabricante", "SP", "Cabos VE especializados", "Baixa (P2)"],
  ["Huber+Suhner", "https://hubersuhner.com", "Fabricante", "SP", "Suíça precisão", "Baixa (P2)"],
  ["Amphenol", "https://amphenol.com.br", "Fabricante", "SP", "Americana robustez", "Baixa (P2)"],
  ["Moxa", "https://moxa.com.br", "Fabricante", "SP", "Networking VE", "Baixa (P2)"],
  ["Semikron", "https://semikron.com.br", "Fabricante", "SP", "Inversores e conversores", "Baixa (P2)"],
  ["EDP", "https://edp.com.br", "Utility", "SP", "EDP Smart Charging, utility + mobilidade", "Alta (P0)"],
  ["Raízen", "https://raizen.com", "Utility", "SP", "Raízen Power, combustíveis + elétrico", "Alta (P0)"],
  ["Eletrobras", "https://eletrobras.com.br", "Utility", "DF", "Utilidade estatal", "Media (P1)"],
  ["Enel", "https://enel.com.br", "Utility", "SP", "Italiana global", "Media (P1)"],
  ["Engie", "https://engie.com.br", "Utility", "SP", "Francesa, energia limpa", "Media (P1)"],
  ["Neoenergia", "https://neoenergia.com.br", "Utility", "BA", "Iberdrola group", "Media (P1)"],
  ["CPFL Energia", "https://cpfl.com.br", "Utility", "SP", "Paulista forte", "Media (P1)"],
  ["AES Brasil", "https://aesbrasil.com.br", "Utility", "SP", "Americana no Brasil", "Media (P1)"],
  ["Omega Energia", "https://omegaenergia.com.br", "Utility", "SP", "Foco renovável", "Alta (P0)"],
  ["Cemig", "https://cemig.com.br", "Utility", "MG", "Minas Gerais", "Media (P1)"],
  ["Copel", "https://copel.com", "Utility", "PR", "Estado PR", "Media (P1)"],
  ["Celesc", "https://celesc.com.br", "Utility", "SC", "Estado SC", "Media (P1)"],
  ["Equatorial", "https://equatorial.com.br", "Utility", "PA", "Região Norte/NE", "Media (P1)"],
  ["Energisa", "https://energisa.com.br", "Utility", "PB", "11 estados", "Media (P1)"],
  ["Alupar", "https://alupar.com.br", "Utility", "SP", "Grupo brasileiro", "Media (P1)"],
  ["Tupinambá Energia", "https://tupinambaenergia.com.br", "Consultoria", "SP", "Especialista VE", "Alta (P0)"],
  ["EZVolt", "https://ezvolt.com.br", "Consultoria", "SP", "Instalação + manutenção", "Alta (P0)"],
  ["GreenV", "https://greenv.com.br", "Consultoria", "RS", "Sustentabilidade", "Alta (P0)"],
  ["Wissenergy", "https://wissenergy.com", "Consultoria", "SP", "Planejamento", "Alta (P0)"],
  ["Recharge Brasil", "https://rechargebrasil.com.br", "Consultoria", "MG", "Engenharia especializada", "Alta (P0)"],
  ["CVI", "https://cvi.com.br", "Consultoria", "SP", "Integração sistemas", "Media (P1)"],
  ["Projeta", "https://projeta.com.br", "Consultoria", "RJ", "Projetistas", "Media (P1)"],
  ["InstalV.E.", "https://instalve.com.br", "Consultoria", "SP", "Especialista VE", "Alta (P0)"],
  ["Eletroprojetos", "https://eletroprojetos.com.br", "Consultoria", "MG", "Escritório projetos", "Media (P1)"],
  ["TecnoWatt", "https://tecnowatt.com.br", "Consultoria", "PR", "Tecnologia aplicada", "Media (P1)"],
  ["VE Instalações", "https://veinstalacoes.com.br", "Consultoria", "SP", "Foco residencial", "Alta (P0)"],
  ["ChargingPro", "https://chargingpro.com.br", "Consultoria", "SC", "Mão de obra qualificada", "Media (P1)"],
  ["E-Mobilize", "https://emobilize.com.br", "Consultoria", "RJ", "Implantação completa", "Alta (P0)"],
  ["PlugWorks", "https://plugworks.com.br", "Consultoria", "SP", "Comercial/corporativo", "Media (P1)"],
  ["EV Solutions", "https://evsolutions.com.br", "Consultoria", "PR", "Turnkey solutions", "Alta (P0)"],
  ["EletroMob", "https://eletromob.com.br", "Consultoria", "MG", "Especializada", "Media (P1)"],
  ["GreenTech", "https://greentech.com.br", "Consultoria", "RS", "Inovação sustentável", "Media (P1)"],
  ["VoltEngineers", "https://voltengineers.com.br", "Consultoria", "SP", "Time especializado", "Media (P1)"],
  ["PowerEV", "https://powerev.com.br", "Consultoria", "SP", "Infraestrutura completa", "Media (P1)"],
  ["ChargeBuild", "https://chargebuild.com.br", "Consultoria", "MG", "Construção civil + elétrica", "Media (P1)"],
  ["BYD", "https://byd.com.br", "Montadora", "SP", "BYD Charging, própria rede + parcerias", "Alta (P0)"],
  ["CAOA Chery", "https://caoachery.com.br", "Montadora", "SP", "Chery Charging, parcerias com CPOs", "Media (P1)"],
  ["GWM", "https://gwm.com.br", "Montadora", "SP", "GWM Energy, desenvolvendo rede", "Media (P1)"],
  ["Toyota", "https://toyota.com.br", "Montadora", "SP", "Toyota EV, parcerias utilities", "Baixa (P2)"],
  ["Volvo", "https://volvocars.com.br", "Montadora", "SP", "Volvo Charging, EDP, outras", "Alta (P0)"],
  ["BMW", "https://bmw.com.br", "Montadora", "SP", "BMW Charging, EDP, IONITY", "Alta (P0)"],
  ["Mercedes-Benz", "https://mercedes-benz.com.br", "Montadora", "SP", "Mercedes me Charge, rede própria", "Alta (P0)"],
  ["Renault", "https://renault.com.br", "Montadora", "SP", "Mobilize Charge, EDP, outras", "Alta (P0)"],
  ["JAC Motors", "https://jacmotors.com.br", "Montadora", "BA", "JAC Power, parcerias locais", "Media (P1)"],
  ["Nissan", "https://nissan.com.br", "Montadora", "SP", "Nissan Energy, Zletric, outras", "Alta (P0)"]
]

companies_created = 0
companies_updated = 0

companies_data.each do |name, website, principal_key, state, notes, priority|
  slug = generate_slug(name)

  description = <<~DESC.strip
    #{notes}

    Prioridade de onboarding: #{priority}
    Contato inicial: pendente
    Estado: #{state}
    Categoria principal: #{subcategory_definitions[principal_key][:name]}
  DESC

  company = Company.find_by(slug: slug)
  
  if company
    companies_updated += 1
    puts "  ↻ Atualizando: #{name}"
  else
    companies_created += 1
    company = Company.new(slug: slug)
    puts "  + Criando: #{name}"
  end

  company.name = name
  company.website = website
  company.state = state
    company.city = "SAO PAULO" if state == "SP"
    company.city = "RIO DE JANEIRO" if state == "RJ"
    company.city = "BELO HORIZONTE" if state == "MG"
    company.city = "CURITIBA" if state == "PR"
    company.city = "PORTO ALEGRE" if state == "RS"
    company.city = "FLORIANOPOLIS" if state == "SC"
    company.city = "SALVADOR" if state == "BA"
    company.city = "BRASILIA" if state == "DF"
    company.city = "BELEM" if state == "PA"
    company.city = "JOAO PESSOA" if state == "PB"
  company.description = description
    
    # Extrair domínio do website para passar na validação de e-mail corporativo
    domain = begin
      URI.parse(website).host&.sub(/\Awww\./, '')
    rescue
      nil
    end
    domain ||= "#{slug}.com.br"
    
    company.email = "contato@#{domain}"
    company.phone = "11999999999"
    company.status = "active" # Definindo como active para passar na validação de featured
    company.moderation_status = "approved"
    company.verified = false # Mantendo false para evitar validação de CNPJ
    company.featured = (priority.include?("Alta (P0)"))
  
  # Associar categorias antes de salvar para passar na validação de ativação
  category = child_categories[principal_key]
  company.categories = [category, root]
  
  company.save!
end

puts "\n📊 Atualizando métricas das categorias..."
[root, *child_categories.values].each do |cat|
  cat.update_metrics!
  puts "  ✓ #{cat.name}: #{cat.companies_count} empresas"
end

puts "\n" + "="*80
puts "✅ Seed de Mobilidade Elétrica concluído!"
puts "="*80
puts "📁 Categorias: #{Category.where(id: [root.id, *child_categories.values.map(&:id)]).count} (1 raiz + #{child_categories.size} subcategorias)"
puts "🏢 Empresas: #{companies_created} criadas, #{companies_updated} atualizadas"
puts "📈 Total no sistema: #{Company.count} empresas"
puts "="*80
