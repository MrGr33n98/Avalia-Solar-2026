# db/seeds.rb
# Seed ÚNICO e OTIMIZADO para Mobilidade Elétrica (prioridade máxima para dominar o mercado em 2026)
# Este arquivo cria:
# - Admin users (incluindo o seu)
# - Categoria raiz "Mobilidade Elétrica" com SEO/AEO/GEO forte
# - Subcategorias hierárquicas otimizadas para buscas reais no Brasil (CPO, EMSP, Fabricante, Utility, Instaladores, Montadoras)
# - Empresas reais do ecossistema brasileiro (prioridade P0 = alta conversão, foco inicial em SC/SP)
# - Associação automática de empresas às categorias
# - Atualização de métricas
# - Banners automáticos (download de imagens de alta qualidade via Unsplash/placeholders otimizados)
#
# Rode com: rails db:seed
# Ou individual: rails runner db/seeds.rb

require 'open-uri'
require 'uri'

# ================================
# Helper: Gerar slug SEO-friendly
# ================================
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

# ================================
# Admin Users
# ================================
if ENV['SEED_ADMIN_EMAIL'] && ENV['SEED_ADMIN_PASSWORD']
  AdminUser.find_or_create_by!(email: ENV['SEED_ADMIN_EMAIL']) do |admin|
    admin.password = ENV['SEED_ADMIN_PASSWORD']
    admin.password_confirmation = ENV['SEED_ADMIN_PASSWORD']
    puts "Admin user created: #{admin.email}"
  end
end

AdminUser.find_or_create_by!(email: 'felipe@avaliasolar.com.br') do |admin|
  admin.password = 'ZAbgbZeVAK+!5!'
  admin.password_confirmation = 'ZAbgbZeVAK+!5!'
  puts "Admin user criado: felipe@avaliasolar.com.br"
end

# ================================
# Categoria Raiz: Mobilidade Elétrica (Hub Mestre)
# ================================
puts "\n🔌 Criando categoria raiz de Mobilidade Elétrica..."

root = Category.find_or_create_by!(seo_url: "mobilidade-eletrica") do |c|
  c.name = "Mobilidade Elétrica"
  c.seo_title = "Mobilidade Elétrica no Brasil 2026 | Carregadores, Veículos e Instaladores"
  c.short_description = "Tudo sobre veículos elétricos e recarga: wallbox residencial, eletropostos públicos, instaladores certificados e integração com energia solar."
  c.description = "O guia definitivo para mobilidade elétrica no Brasil. Encontre as melhores soluções de carregamento, veículos e serviços com avaliações reais de usuários."
  c.kind = "main"
  c.status = "active"
  c.featured = true
end

puts "✅ Categoria raiz criada: #{root.name}"

# ================================
# Subcategorias (Otimizadas para SEO/AEO/GEO)
# ================================
puts "\n📂 Criando subcategorias..."

subcategories = {
  carregadores_residenciais: {
    name: "Carregadores Residenciais / Wallbox",
    seo_url: "carregadores-residenciais",
    seo_title: "Melhores Carregadores Residenciais (Wallbox) no Brasil 2026",
    short_description: "Compare wallbox para casa e condomínio com avaliações reais e preços."
  },
  carregadores_comerciais: {
    name: "Carregadores Comerciais e Condomínios",
    seo_url: "carregadores-comerciais",
    seo_title: "Carregadores para Empresas e Condomínios no Brasil 2026",
    short_description: "Soluções de recarga para estacionamentos, empresas e condomínios."
  },
  estacoes_publicas: {
    name: "Estações Públicas e Postos Rápidos",
    seo_url: "estacoes-publicas",
    seo_title: "Eletropostos Públicos e Postos de Recarga Rápida no Brasil 2026",
    short_description: "Mapa de eletropostos DC rápido em rodovias e cidades."
  },
  instaladores_carregadores: {
    name: "Instaladores de Carregadores EV",
    seo_url: "instaladores-carregadores",
    seo_title: "Melhores Instaladores de Carregadores Elétricos no Brasil 2026",
    short_description: "Instaladores certificados para residências, empresas e condomínios."
  },
  veiculos_eletricos: {
    name: "Veículos Elétricos",
    seo_url: "veiculos-eletricos",
    seo_title: "Melhores Veículos Elétricos no Brasil 2026 | Reviews e Comparativos",
    short_description: "Reviews de carros, motos e bicicletas elétricas."
  },
  integracao_solar_ev: {
    name: "Integração Solar + Mobilidade Elétrica",
    seo_url: "integracao-solar-ev",
    seo_title: "Carregue Seu EV com Energia Solar | Sistemas Híbridos 2026",
    short_description: "Soluções V2H/V2G: carregue grátis com painéis solares."
  }
}

child_categories = {}

subcategories.each do |key, data|
  child_categories[key] = Category.find_or_create_by!(seo_url: data[:seo_url]) do |c|
    c.name = data[:name]
    c.parent_id = root.id
    c.seo_title = data[:seo_title]
    c.short_description = data[:short_description]
    c.description = data[:short_description] # Pode expandir depois
    c.kind = "main"
    c.status = "active"
    c.featured = true
  end
  puts "  ✓ #{data[:name]} (slug: #{data[:seo_url]})"
end

# ================================
# Empresas do Ecossistema (Foco em Dominar o Mercado)
# ================================
puts "\n🏢 Criando/associando empresas do ecossistema de Mobilidade Elétrica..."

companies_data = [
  # Prioridade P0 - Alta conversão (foco inicial)
  ["WEG", "https://weg.net", "SC", "Fabricante nacional líder em carregadores AC/DC", "carregadores_residenciais", "Alta (P0)"],
  ["Zletric", "https://zletric.com.br", "SP", "Maior rede de condomínios no Brasil", "carregadores_comerciais", "Alta (P0)"],
  ["Voltbras", "https://voltbras.com", "SC", "Plataforma white-label EMSP líder", "integracao_solar_ev", "Alta (P0)"],
  ["EDP Smart", "https://edp.com.br", "SP", "Utility + recarga inteligente", "estacoes_publicas", "Alta (P0)"],
  ["BYD Energy", "https://byd.com.br", "SP", "Montadora com rede própria", "veiculos_eletricos", "Alta (P0)"],
  ["Wallbox Brasil", "https://wallbox.com", "SP", "Wallbox residencial premium", "carregadores_residenciais", "Alta (P0)"],
  ["Tupinambá Energia", "https://tupinambaenergia.com.br", "SC", "Instaladores especializados em SC", "instaladores_carregadores", "Alta (P0)"],

  # P1 - Média conversão
  ["Raízen Power", "https://raizen.com", "SP", "Charging as a Service para frotas", "carregadores_comerciais", "Média (P1)"],
  ["ABB", "https://abb.com.br", "SP", "Carregadores DC rápido", "estacoes_publicas", "Média (P1)"],
  ["Plug&Go", "https://plugandgo.com.br", "RJ", "App EMSP com maior base de usuários", "integracao_solar_ev", "Média (P1)"],
  ["Volvo Charging", "https://volvocars.com.br", "SP", "Rede premium para clientes Volvo", "estacoes_publicas", "Média (P1)"],
  ["EZVolt", "https://ezvolt.com.br", "SP", "Instalação turnkey", "instaladores_carregadores", "Média (P1)"],

  # Adicione mais conforme necessário (expanda a lista completa do seu código anterior)
]

companies_created = 0
companies_updated = 0

companies_data.each do |name, website, state, notes, subcat_key, priority|
  slug = generate_slug(name)

  description = "#{notes}\n\nPrioridade: #{priority}\nEstado principal: #{state}"

  company = Company.find_or_initialize_by(slug: slug)
  company.name ||= name
  company.website = website
  company.state = state
  company.city = case state
                 when "SC" then "Florianópolis"
                 when "SP" then "São Paulo"
                 when "RJ" then "Rio de Janeiro"
                 else "São Paulo"
                 end
  company.description = description
  company.email = "contato@#{URI.parse(website).host&.sub('www.', '') || "#{slug}.com.br"}"
  company.phone = "11999999999"
  company.status = "active"
  company.moderation_status = "approved"
  company.featured = priority.include?("Alta (P0)")

  # Associação de categorias
  subcat = child_categories[subcat_key.to_sym]
  company.categories = [root, subcat].compact

  if company.save!
    companies_created += 1 if company.previous_changes.key?("id")
    companies_updated += 1 if company.previous_changes.any? && !company.previous_changes.key?("id")
    puts "  #{company.new_record? ? '+' : '↻'} #{name} (#{state})"
  end
end

puts "\n📊 Empresas: #{companies_created} criadas | #{companies_updated} atualizadas"

# ================================
# Atualizar Métricas das Categorias
# ================================
puts "\n📊 Atualizando métricas das categorias..."
[root, *child_categories.values].each do |cat|
  cat.update_metrics!
  puts "  ✓ #{cat.name}: #{cat.companies_count} empresas"
end

# ================================
# Banners Automáticos (Imagens de Alta Qualidade)
# ================================
puts "\n🎨 Adicionando banners às categorias..."

banner_urls = {
  root.id => "https://images.unsplash.com/photo-1631206998461-3b7eb7e7ed49?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&h=600&q=80", # EV charging
  child_categories[:carregadores_residenciais].id => "https://images.unsplash.com/photo-1625015621761-3bb1c2bde2e4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&h=600&q=80",
  child_categories[:carregadores_comerciais].id => "https://images.unsplash.com/photo-1593941707874-ef25b8b4a92b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&h=600&q=80",
  child_categories[:estacoes_publicas].id => "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&h=600&q=80",
  child_categories[:instaladores_carregadores].id => "https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&h=600&q=80",
  child_categories[:veiculos_eletricos].id => "https://images.unsplash.com/photo-1609521241449-4b63d6f4d1e4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&h=600&q=80",
  child_categories[:integracao_solar_ev].id => "https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&h=600&q=80"
}

banner_urls.each do |cat_id, url|
  category = Category.find_by(id: cat_id)
  next unless category

  if category.banner.attached?
    puts "  ⚠️ Banner já existe para #{category.name}"
    next
  end

  begin
    file = URI.open(url)
    category.banner.attach(io: file, filename: "#{category.seo_url}-banner.jpg", content_type: "image/jpeg")
    puts "  ✅ Banner adicionado: #{category.name}"
  rescue => e
    puts "  ❌ Erro no banner de #{category.name}: #{e.message}"
  end
end

# ================================
# Finalização
# ================================
puts "\n" + "="*80
puts "🚀 SEED DE MOBILIDADE ELÉTRICA CONCLUÍDO COM SUCESSO!"
puts "   • Raiz: Mobilidade Elétrica"
puts "   • #{subcategories.size} subcategorias criadas"
puts "   • Empresas semeadas (pronto para expansão)"
puts "   • Banners automáticos adicionados"
puts "   • Próximo passo: Expanda com mais empresas reais e conteúdo AEO!"
puts "="*80
puts "Agora o Avalia Solar está posicionado para DOMINAR mobilidade elétrica no Brasil (especialmente SC)."
puts "Depois, adicione o seed solar como complemento."
puts "="*80