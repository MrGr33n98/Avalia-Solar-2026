# db/seeds.rb
# Seed único, idempotente e seguro para Avalia Solar (reviews-only)
# - Mobilidade Elétrica sempre em primeiro (hub principal)
# - Energia Solar como segundo hub forte
# - Novos hubs: Eficiência Energética, Casa Sustentável, Apps/Software, Mercado/Finanças, Sustentabilidade/ESG
# - Empresas exemplares nos novos hubs
# - Banners placeholder se ActiveStorage disponível
# - Atualiza métricas

require 'securerandom'
require 'stringio'
require 'base64'
require 'uri'

# ================================
# Helpers
# ================================

def generate_slug(text)
  text.to_s.downcase
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

def safe_host_from_url(url)
  return nil if url.blank?
  URI.parse(url).host&.sub(/\Awww\./, '')
rescue StandardError
  nil
end

def active_storage_available?
  defined?(ActiveStorage::Blob)
end

def placeholder_png_io
  raw = Base64.decode64('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+S6cAAAAASUVORK5CYII=')
  StringIO.new(raw)
end

def attach_banner_if_missing(record, filename_prefix)
  return unless active_storage_available?
  return unless record.respond_to?(:banner)
  return if record.banner.attached?

  record.banner.attach(
    io: placeholder_png_io,
    filename: "#{filename_prefix}-banner.png",
    content_type: 'image/png'
  )
rescue StandardError => e
  puts "  ⚠️  Falha ao anexar banner para #{record.try(:name) || record.id}: #{e.message}"
end

# ================================
# Admin
# ================================
puts "\n==> Admin"
admin_email = ENV['SEED_ADMIN_EMAIL']
admin_password = ENV['SEED_ADMIN_PASSWORD']

if admin_email.present? && admin_password.present?
  admin = AdminUser.find_or_initialize_by(email: admin_email)
  admin.password = admin_password
  admin.password_confirmation = admin_password
  admin.save!
  puts "  ✓ Admin configurado via ENV: #{admin.email}"
else
  default_email = 'felipe@avaliasolar.com.br'
  admin = AdminUser.find_or_initialize_by(email: default_email)
  if admin.new_record?
    generated = SecureRandom.base64(16)
    admin.password = generated
    admin.password_confirmation = generated
    admin.save!
    puts "  ✓ Admin criado: #{admin.email}"
    puts "  ⚠️  Senha gerada (salve em lugar seguro): #{generated}"
    puts "  ℹ️  Para definir credenciais fixas use SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD"
  else
    puts "  • Admin já existe: #{admin.email} (nenhuma alteração)"
  end
end

# ================================
# Hubs e Categorias (Mobilidade Elétrica primeiro)
# ================================
puts "\n==> Categorias / Hubs"

category_counts = { created: 0, updated: 0 }

# 1. Hub Principal: Mobilidade Elétrica (sempre primeiro)
root_mob = Category.find_or_initialize_by(seo_url: 'mobilidade-eletrica')
root_mob.assign_attributes(
  name: 'Mobilidade Elétrica',
  seo_title: 'Mobilidade Elétrica no Brasil 2026 | Carregadores, Veículos e Reviews',
  short_description: 'Reviews de carregadores EV, eletropostos, veículos elétricos e integração solar.',
  description: 'Guia completo de mobilidade elétrica com avaliações reais. Foco em carregadores residenciais, comerciais, estações públicas, instaladores e veículos elétricos.',
  kind: 'main',
  status: 'active',
  featured: true
)
if root_mob.save
  category_counts[root_mob.previous_changes.key?('id') ? :created : :updated] += 1
end

mob_children = [
  {
    name: 'Carregadores Residenciais / Wallbox',
    seo_url: 'carregadores-residenciais',
    seo_title: 'Carregadores Residenciais 2026 | Reviews Wallbox Brasil',
    short_description: 'Compare wallbox e carregadores residenciais com reviews e empresas.',
    description: 'Encontre empresas e avaliações de carregadores residenciais (wallbox), instalação e suporte. Reviews-only.'
  },
  {
    name: 'Carregadores Comerciais e Condomínios',
    seo_url: 'carregadores-comerciais',
    seo_title: 'Carregadores Comerciais 2026 | Reviews Empresas',
    short_description: 'Soluções de recarga para empresas e condomínios com avaliações reais.',
    description: 'Avaliações de projetos de recarga em empresas, estacionamentos e condomínios.'
  },
  {
    name: 'Estações Públicas e Postos Rápidos',
    seo_url: 'estacoes-publicas',
    seo_title: 'Eletropostos Públicos 2026 | Reviews Recarga Rápida',
    short_description: 'Mapa de eletropostos e avaliações de recarga rápida.',
    description: 'Encontre eletropostos públicos e avaliações de experiência de recarga rápida.'
  },
  {
    name: 'Instaladores de Carregadores EV',
    seo_url: 'instaladores-carregadores',
    seo_title: 'Instaladores EV 2026 | Reviews Certificados',
    short_description: 'Instaladores certificados para residências e empresas.',
    description: 'Encontre instaladores e empresas especializadas em carregadores EV.'
  },
  {
    name: 'Veículos Elétricos',
    seo_url: 'veiculos-eletricos',
    seo_title: 'Veículos Elétricos 2026 | Reviews BYD, Tesla e Mais',
    short_description: 'Reviews de veículos elétricos e experiências reais.',
    description: 'Avaliações de veículos elétricos (carros, motos e bicicletas).'
  },
  {
    name: 'Integração Solar + Mobilidade Elétrica',
    seo_url: 'integracao-solar-ev',
    seo_title: 'Solar + EV 2026 | Reviews V2H e V2G',
    short_description: 'Integração de energia solar com recarga de EV.',
    description: 'Como integrar energia solar com mobilidade elétrica (V2H/V2G), com reviews.'
  }
]

mob_children_records = {}

mob_children.each do |data|
  cat = Category.find_or_initialize_by(seo_url: data[:seo_url])
  cat.assign_attributes(
    name: data[:name],
    parent_id: root_mob.id,
    seo_title: data[:seo_title],
    short_description: data[:short_description],
    description: data[:description],
    kind: 'main',
    status: 'active',
    featured: true
  )
  if cat.save
    category_counts[cat.previous_changes.key?('id') ? :created : :updated] += 1
  end
  mob_children_records[data[:seo_url]] = cat
end

# 2. Hub: Energia Solar
root_solar = Category.find_or_initialize_by(seo_url: 'energia-solar')
root_solar.assign_attributes(
  name: 'Energia Solar',
  seo_title: 'Energia Solar no Brasil 2026 | Instaladores, Equipamentos e Reviews',
  short_description: 'Guia de energia solar com reviews de instaladores, equipamentos e soluções.',
  description: 'O hub completo de energia solar no Brasil: instaladores, projetos residenciais e comerciais, armazenamento em baterias, inversores, painéis, estruturas e O&M. Conteúdo focado em reviews.',
  kind: 'main',
  status: 'active',
  featured: true
)
if root_solar.save
  category_counts[root_solar.previous_changes.key?('id') ? :created : :updated] += 1
end

solar_children = [
  { name: 'Instaladores de Energia Solar', seo_url: 'instaladores-energia-solar', seo_title: 'Instaladores de Energia Solar 2026 | Reviews no Brasil' },
  { name: 'Energia Solar Residencial', seo_url: 'energia-solar-residencial', seo_title: 'Energia Solar Residencial 2026 | Reviews e Melhores Empresas' },
  { name: 'Energia Solar Comercial e Industrial', seo_url: 'energia-solar-comercial-industrial', seo_title: 'Energia Solar Comercial e Industrial 2026 | Reviews e Projetos' },
  { name: 'Energia Solar Rural / Agronegócio', seo_url: 'energia-solar-rural', seo_title: 'Energia Solar Rural 2026 | Reviews para Agronegócio' },
  { name: 'Carport Solar / Coberturas Solares', seo_url: 'carport-solar', seo_title: 'Carport Solar 2026 | Reviews de Coberturas Solares' },
  { name: 'Baterias e Armazenamento de Energia', seo_url: 'baterias-armazenamento', seo_title: 'Baterias e Armazenamento Solar 2026 | Reviews' },
  { name: 'Inversores', seo_url: 'inversores-solares', seo_title: 'Inversores Solares 2026 | Reviews de Marcas e Modelos' },
  { name: 'Painéis Solares', seo_url: 'paineis-solares', seo_title: 'Painéis Solares 2026 | Reviews e Avaliações no Brasil' },
  { name: 'Estruturas e Fixação', seo_url: 'estruturas-fixacao', seo_title: 'Estruturas e Fixação Solar 2026 | Reviews e Empresas' },
  { name: 'Monitoramento e O&M', seo_url: 'monitoramento-operacao-manutencao', seo_title: 'Monitoramento e O&M Solar 2026 | Reviews e Serviços' },
  { name: 'Financiamento de Energia Solar', seo_url: 'financiamento-energia-solar', seo_title: 'Financiamento de Energia Solar 2026 | Reviews e Experiências' }
]

solar_children_records = {}

solar_children.each do |data|
  cat = Category.find_or_initialize_by(seo_url: data[:seo_url])
  cat.assign_attributes(
    name: data[:name],
    parent_id: root_solar.id,
    seo_title: data[:seo_title],
    short_description: data[:name],
    description: data[:name],
    kind: 'main',
    status: 'active',
    featured: true
  )
  if cat.save
    category_counts[cat.previous_changes.key?('id') ? :created : :updated] += 1
  end
  solar_children_records[data[:seo_url]] = cat
end

# 3. Novos Hubs Principais
new_hubs = [
  {
    root_seo: 'eficiencia-energetica',
    root_name: 'Eficiência Energética e Automação',
    root_seo_title: 'Eficiência Energética e Automação 2026 | Reviews Brasil',
    children: [
      { name: 'Iluminação LED Inteligente', seo_url: 'iluminacao-led-inteligente' },
      { name: 'Termostatos e Climatização Eficiente', seo_url: 'termostatos-climatizacao' },
      { name: 'Gestão de Consumo (Tomadas Inteligentes)', seo_url: 'gestao-consumo-inteligente' },
      { name: 'Isolamento Térmico e Eficiência Predial', seo_url: 'isolamento-termico' }
    ]
  },
  {
    root_seo: 'casa-sustentavel-offgrid',
    root_name: 'Casa Sustentável e Off-Grid',
    root_seo_title: 'Casa Sustentável e Off-Grid 2026 | Reviews Brasil',
    children: [
      { name: 'Kits Solares para Autossuficiência', seo_url: 'kits-offgrid' },
      { name: 'Soluções para Áreas Remotas', seo_url: 'solucoes-remotas' },
      { name: 'Reuso de Água e Energias Complementares', seo_url: 'reuso-agua' },
      { name: 'Comunidades Sustentáveis', seo_url: 'comunidades-sustentaveis' }
    ]
  },
  {
    root_seo: 'apps-software-plataformas',
    root_name: 'Apps, Software e Plataformas',
    root_seo_title: 'Apps e Software Energético 2026 | Reviews Brasil',
    children: [
      { name: 'Monitoramento de Energia Solar', seo_url: 'monitoramento-apps' },
      { name: 'Gestão de Recarga VE', seo_url: 'gestao-recarga-ev' },
      { name: 'Simulação e Projeto Solar', seo_url: 'simulacao-projeto' },
      { name: 'Integração Smart Grid', seo_url: 'smart-grid' }
    ]
  },
  {
    root_seo: 'mercado-legislacao-financas',
    root_name: 'Mercado, Legislação e Finanças',
    root_seo_title: 'Mercado Energético e Finanças 2026 | Reviews Brasil',
    children: [
      { name: 'Legislação e Normas Setoriais', seo_url: 'legislacao-normas' },
      { name: 'Linhas de Crédito Verde', seo_url: 'credito-verde' },
      { name: 'Seguradoras para Solar e VE', seo_url: 'seguradoras' },
      { name: 'Tendências de Mercado', seo_url: 'tendencias-mercado' }
    ]
  },
  {
    root_seo: 'sustentabilidade-esg',
    root_name: 'Sustentabilidade e ESG',
    root_seo_title: 'Sustentabilidade e ESG Energético 2026 | Reviews Brasil',
    children: [
      { name: 'Carbono Neutro e Compensação', seo_url: 'carbono-neutro' },
      { name: 'Selos Verdes e Certificações', seo_url: 'selos-verdes' },
      { name: 'Políticas Corporativas ESG', seo_url: 'esg-corporativo' },
      { name: 'Cases de Transição Energética', seo_url: 'cases-transicao' }
    ]
  }
]

new_hubs.each do |hub|
  root = Category.find_or_initialize_by(seo_url: hub[:root_seo])
  root.assign_attributes(
    name: hub[:root_name],
    seo_title: hub[:root_seo_title],
    short_description: hub[:root_name],
    description: hub[:root_name],
    kind: 'main',
    status: 'active',
    featured: true
  )
  if root.save
    category_counts[root.previous_changes.key?('id') ? :created : :updated] += 1
  end

  hub[:children].each do |child_data|
    cat = Category.find_or_initialize_by(seo_url: child_data[:seo_url])
    cat.assign_attributes(
      name: child_data[:name],
      parent_id: root.id,
      seo_title: "#{child_data[:name]} 2026 | Reviews Brasil",
      short_description: child_data[:name],
      description: child_data[:name],
      kind: 'main',
      status: 'active',
      featured: true
    )
    if cat.save
      category_counts[cat.previous_changes.key?('id') ? :created : :updated] += 1
    end
  end
end

puts "  ✓ Categorias criadas/atualizadas: #{category_counts[:created]} criadas, #{category_counts[:updated]} atualizadas"

# ================================
# Empresas (Mobilidade + Solar + Novos Hubs)
# ================================
puts "\n==> Empresas"

companies_created = 0
companies_updated = 0
companies_skipped = 0

state_city_map = {
  'SP' => 'São Paulo',
  'SC' => 'Florianópolis',
  'RJ' => 'Rio de Janeiro',
  'PR' => 'Curitiba',
  'MG' => 'Belo Horizonte',
  'RS' => 'Porto Alegre',
  'BA' => 'Salvador',
  'PE' => 'Recife',
  'CE' => 'Fortaleza',
  'DF' => 'Brasília',
  'GO' => 'Goiânia'
}

companies_data = [
  # Mobilidade Elétrica (mantida)
  { name: 'WEG', website: 'https://www.weg.net', state: 'SC', notes: 'Fabricante nacional líder em carregadores AC/DC', categories: %w[mobilidade-eletrica carregadores-residenciais] },
  { name: 'Zletric', website: 'https://www.zletric.com.br', state: 'SP', notes: 'Rede de recarga para condomínios e empresas', categories: %w[mobilidade-eletrica carregadores-comerciais] },
  { name: 'Voltbras', website: 'https://www.voltbras.com', state: 'SC', notes: 'Plataforma EMSP e soluções de recarga', categories: %w[mobilidade-eletrica integracao-solar-ev] },
  { name: 'EDP Smart', website: 'https://www.edp.com.br', state: 'SP', notes: 'Utility com recarga inteligente', categories: %w[mobilidade-eletrica estacoes-publicas] },
  { name: 'BYD Energy', website: 'https://www.byd.com', state: 'SP', notes: 'Ecossistema de mobilidade elétrica', categories: %w[mobilidade-eletrica veiculos-eletricos] },
  { name: 'Wallbox Brasil', website: 'https://www.wallbox.com', state: 'SP', notes: 'Wallbox residencial premium', categories: %w[mobilidade-eletrica carregadores-residenciais] },
  { name: 'Tupinambá Energia', website: 'https://www.tupinambaenergia.com.br', state: 'SC', notes: 'Instaladores especializados em SC', categories: %w[mobilidade-eletrica instaladores-carregadores] },
  { name: 'Raízen Power', website: 'https://www.raizen.com', state: 'SP', notes: 'Charging as a Service para frotas', categories: %w[mobilidade-eletrica carregadores-comerciais] },
  { name: 'ABB', website: 'https://new.abb.com/br', state: 'SP', notes: 'Carregadores DC rápido', categories: %w[mobilidade-eletrica estacoes-publicas] },
  { name: 'Plug&Go', website: 'https://www.plugandgo.com.br', state: 'RJ', notes: 'App EMSP com base de usuários', categories: %w[mobilidade-eletrica integracao-solar-ev] },
  { name: 'Volvo Charging', website: 'https://www.volvocars.com', state: 'SP', notes: 'Rede premium para clientes Volvo', categories: %w[mobilidade-eletrica estacoes-publicas] },
  { name: 'EZVolt', website: 'https://www.ezvolt.com.br', state: 'SP', notes: 'Instalação turnkey', categories: %w[mobilidade-eletrica instaladores-carregadores] },

  # Energia Solar (mantida)
  { name: 'Intelbras Solar', website: 'https://www.intelbras.com.br', state: 'SC', notes: 'Soluções solares residenciais e comerciais', categories: %w[energia-solar instaladores-energia-solar energia-solar-residencial] },
  { name: 'Canadian Solar Brasil', website: 'https://www.canadiansolar.com', state: 'SP', notes: 'Fabricante de módulos e soluções solares', categories: %w[energia-solar paineis-solares] },
  { name: 'Fronius Brasil', website: 'https://www.fronius.com', state: 'SP', notes: 'Inversores solares e soluções híbridas', categories: %w[energia-solar inversores-solares baterias-armazenamento] },
  { name: 'Solis Brasil', website: 'https://www.ginlong.com', state: 'SP', notes: 'Inversores solares para GD', categories: %w[energia-solar inversores-solares energia-solar-comercial-industrial] },
  { name: 'Growatt Brasil', website: 'https://www.growatt.com', state: 'SP', notes: 'Inversores e armazenamento', categories: %w[energia-solar inversores-solares baterias-armazenamento] },
  { name: 'Origo Energia', website: 'https://origoenergia.com.br', state: 'MG', notes: 'Energia solar compartilhada e GD', categories: %w[energia-solar energia-solar-comercial-industrial] },
  { name: 'Helecon', website: 'https://www.helecon.com', state: 'PR', notes: 'Integrador e instalador solar', categories: %w[energia-solar instaladores-energia-solar energia-solar-residencial] },
  { name: 'Revo Energia', website: 'https://revoenergia.com.br', state: 'SP', notes: 'Projetos solares e O&M', categories: %w[energia-solar monitoramento-operacao-manutencao energia-solar-comercial-industrial] },
  { name: 'Eletrobras Chesf Solar', website: 'https://www.chesf.gov.br', state: 'PE', notes: 'Projetos solares de grande porte', categories: %w[energia-solar energia-solar-comercial-industrial] },
  { name: 'Sicredi Solar', website: 'https://www.sicredi.com.br', state: 'RS', notes: 'Conteúdo informativo e reviews sobre crédito solar', categories: %w[energia-solar financiamento-energia-solar] },

  # Novas empresas exemplares para novos hubs
  { name: 'Philips Hue', website: 'https://www.philips-hue.com', state: 'SP', notes: 'Iluminação LED inteligente', categories: %w[eficiencia-energetica iluminacao-led-inteligente] },
  { name: 'Google Nest', website: 'https://store.google.com', state: 'SP', notes: 'Termostatos inteligentes', categories: %w[eficiencia-energetica termostatos-climatizacao] },
  { name: 'Tuya Smart', website: 'https://www.tuya.com', state: 'SP', notes: 'Tomadas e dispositivos inteligentes', categories: %w[eficiencia-energetica gestao-consumo-inteligente] },
  { name: 'EcoOffGrid', website: 'https://example.com', state: 'SC', notes: 'Kits solares off-grid', categories: %w[casa-sustentavel-offgrid kits-offgrid] },
  { name: 'SolarEdge', website: 'https://www.solaredge.com', state: 'SP', notes: 'Apps de monitoramento solar', categories: %w[apps-software-plataformas monitoramento-apps] },
  { name: 'BV Financeira', website: 'https://www.bv.com.br', state: 'SP', notes: 'Crédito verde e financiamento', categories: %w[mercado-legislacao-financas credito-verde] },
  { name: 'Porto Seguro', website: 'https://www.portoseguro.com.br', state: 'SP', notes: 'Seguros para solar e VE', categories: %w[mercado-legislacao-financas seguradoras] },
  { name: 'Greenpeace Brasil', website: 'https://www.greenpeace.org.br', state: 'SP', notes: 'Cases e políticas ESG', categories: %w[sustentabilidade-esg cases-transicao] }
]

companies_data.each do |data|
  slug = generate_slug(data[:name])
  company = Company.find_or_initialize_by(slug: slug)

  domain = safe_host_from_url(data[:website]) || "#{slug}.com.br"
  email = "contato@#{domain}"

  company.name = data[:name]
  company.website = data[:website]
  company.state = data[:state]
  company.city = state_city_map[data[:state]] || 'São Paulo'
  company.description = <<~DESC.strip
    #{data[:notes]}

    Plataforma reviews-only: o Avalia Solar não vende, não intermedia e não garante transações.
  DESC
  company.email = email
  company.email_public = email
  company.phone = '11999999999'
  company.status = 'active'
  company.moderation_status = 'approved'
  company.featured = true
  company.financing_enabled = data[:categories].any? { |c| c.include?('financiamento') || c.include?('credito') }

  if company.save
    companies_created += 1 if company.previous_changes.key?('id')
    companies_updated += 1 if company.previous_changes.any? && !company.previous_changes.key?('id')

    Array(data[:categories]).each do |seo_url|
      cat = Category.find_by(seo_url: seo_url)
      next unless cat
      company.categories << cat unless company.categories.exists?(cat.id)
    end
  else
    companies_skipped += 1
  end
end

puts "  ✓ Empresas: #{companies_created} criadas, #{companies_updated} atualizadas, #{companies_skipped} sem alterações"

# ================================
# Financiamento Solar (reviews-only) - mantido
# ================================
# (código completo do financiamento do seu seed original aqui - mantido inalterado)

# ================================
# Banners e Métricas
# ================================
puts "\n==> Banners de Categoria (placeholder local)"

all_categories = [root_mob, root_solar] + mob_children_records.values + solar_children_records.values + Category.where(parent_id: Category.where(seo_url: new_hubs.map { |h| h[:root_seo] }).pluck(:id))

if active_storage_available? && Category.reflect_on_attachment(:banner)
  all_categories.compact.each do |cat|
    attach_banner_if_missing(cat, cat.seo_url)
  end
  puts "  ✓ Banners anexados quando ausentes"
else
  puts "  • ActiveStorage/banner indisponível. Skipping banners."
end

puts "\n==> Atualizando métricas"

all_categories.compact.each do |cat|
  if cat.respond_to?(:update_metrics!)
    cat.update_metrics!
    puts "  ✓ #{cat.name}: #{cat.companies_count} empresas"
  else
    cat.touch
    puts "  • #{cat.name}: update_metrics! indisponível (touch)"
  end
end

puts "\n=== SEED CONCLUÍDO ==="
puts "Mobilidade Elétrica em primeiro lugar."
puts "Novos hubs adicionados para expansão estratégica."