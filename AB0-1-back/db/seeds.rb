# db/seeds.rb
# Seed único, idempotente e seguro para Avalia Solar (reviews-only)
# - Mantém compatibilidade com mobilidade elétrica existente
# - Adiciona hub Energia Solar + subcategorias
# - Cria perfis de financiamento informativos (reviews-only)
# - Banners de categoria apenas se ActiveStorage/attachment existir
# - Atualiza métricas via update_metrics! quando disponível

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
  # 1x1 PNG transparente
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
# Hubs e Categorias
# ================================
puts "\n==> Categorias / Hubs"

category_counts = { created: 0, updated: 0 }

# Hub: Mobilidade Elétrica (mantém compatibilidade)
root_mob = Category.find_or_initialize_by(seo_url: 'mobilidade-eletrica')
root_mob.assign_attributes(
  name: 'Mobilidade Elétrica',
  seo_title: 'Mobilidade Elétrica no Brasil 2026 | Carregadores, Veículos e Reviews',
  short_description: 'Reviews e empresas de carregadores EV, eletropostos e mobilidade elétrica no Brasil.',
  description: 'Guia de mobilidade elétrica no Brasil com avaliações reais. Encontre carregadores residenciais e comerciais, eletropostos rápidos, instaladores especializados, veículos elétricos e integração solar + EV. Conteúdo focado em reviews e experiências, sem venda ou intermediação.',
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
    seo_title: 'Carregadores Residenciais no Brasil 2026 | Reviews de Wallbox',
    short_description: 'Compare wallbox e carregadores residenciais com reviews e empresas.',
    description: 'Encontre empresas e avaliações de carregadores residenciais (wallbox), instalação e suporte. Reviews-only: foco em experiências e qualidade de serviço.'
  },
  {
    name: 'Carregadores Comerciais e Condomínios',
    seo_url: 'carregadores-comerciais',
    seo_title: 'Carregadores Comerciais no Brasil 2026 | Reviews e Empresas',
    short_description: 'Soluções de recarga para empresas e condomínios com avaliações reais.',
    description: 'Avaliações de projetos de recarga em empresas, estacionamentos e condomínios. Encontre instaladores e integradores com base em reviews.'
  },
  {
    name: 'Estações Públicas e Postos Rápidos',
    seo_url: 'estacoes-publicas',
    seo_title: 'Eletropostos e Recarga Rápida 2026 | Reviews no Brasil',
    short_description: 'Mapa de eletropostos e avaliações de recarga rápida.',
    description: 'Encontre eletropostos públicos e avaliações de experiência de recarga rápida. Conteúdo informativo e reviews.'
  },
  {
    name: 'Instaladores de Carregadores EV',
    seo_url: 'instaladores-carregadores',
    seo_title: 'Instaladores de Carregadores EV 2026 | Reviews e Melhores',
    short_description: 'Instaladores certificados para residências e empresas.',
    description: 'Encontre instaladores e empresas especializadas em carregadores EV. Reviews e experiências reais.'
  },
  {
    name: 'Veículos Elétricos',
    seo_url: 'veiculos-eletricos',
    seo_title: 'Veículos Elétricos no Brasil 2026 | Reviews e Avaliações',
    short_description: 'Reviews de veículos elétricos e experiências reais.',
    description: 'Avaliações de veículos elétricos (carros, motos e bicicletas) e experiências dos usuários.'
  },
  {
    name: 'Integração Solar + Mobilidade Elétrica',
    seo_url: 'integracao-solar-ev',
    seo_title: 'Solar + Mobilidade Elétrica 2026 | Reviews e Integrações',
    short_description: 'Integração de energia solar com recarga de EV.',
    description: 'Como integrar energia solar com mobilidade elétrica (V2H/V2G), com reviews e relatos de usuários.'
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

# Hub: Energia Solar (novo)
root_solar = Category.find_or_initialize_by(seo_url: 'energia-solar')
root_solar.assign_attributes(
  name: 'Energia Solar',
  seo_title: 'Energia Solar no Brasil 2026 | Instaladores, Equipamentos, Armazenamento e Reviews',
  short_description: 'Guia de energia solar com reviews de instaladores, equipamentos e soluções no Brasil.',
  description: 'O hub completo de energia solar no Brasil: instaladores, projetos residenciais e comerciais, armazenamento em baterias, inversores, painéis, estruturas e O&M. Conteúdo focado em reviews, avaliações e experiências reais — sem venda ou intermediação.' ,
  kind: 'main',
  status: 'active',
  featured: true
)
if root_solar.save
  category_counts[root_solar.previous_changes.key?('id') ? :created : :updated] += 1
end

solar_children = [
  {
    name: 'Instaladores de Energia Solar',
    seo_url: 'instaladores-energia-solar',
    seo_title: 'Instaladores de Energia Solar 2026 | Reviews no Brasil',
    short_description: 'Avaliações de empresas e instaladores de energia solar no Brasil.',
    description: 'Encontre empresas de energia solar e instaladores com avaliações reais. Compare experiência, qualidade do serviço e suporte técnico.'
  },
  {
    name: 'Energia Solar Residencial',
    seo_url: 'energia-solar-residencial',
    seo_title: 'Energia Solar Residencial 2026 | Reviews e Melhores Empresas',
    short_description: 'Soluções solares para casa com reviews e avaliações.',
    description: 'Sistemas de energia solar residencial com foco em reviews de empresas e instaladores. Placa/painel/módulo fotovoltaico para casa, com experiências reais.'
  },
  {
    name: 'Energia Solar Comercial e Industrial',
    seo_url: 'energia-solar-comercial-industrial',
    seo_title: 'Energia Solar Comercial e Industrial 2026 | Reviews e Projetos',
    short_description: 'Projetos solares para empresas e indústria com avaliações reais.',
    description: 'Projetos de geração distribuída (GD) para empresas e indústria. Reviews de integradores e EPCs, com foco em performance e atendimento.'
  },
  {
    name: 'Energia Solar Rural / Agronegócio',
    seo_url: 'energia-solar-rural',
    seo_title: 'Energia Solar Rural 2026 | Reviews para Agronegócio',
    short_description: 'Energia solar para fazendas e irrigação com reviews.',
    description: 'Soluções solares para fazendas, bombeamento e irrigação. Reviews e experiências de produtores e integradores.'
  },
  {
    name: 'Carport Solar / Coberturas Solares',
    seo_url: 'carport-solar',
    seo_title: 'Carport Solar 2026 | Reviews de Coberturas Solares',
    short_description: 'Carport solar e coberturas para estacionamento com avaliações.',
    description: 'Coberturas solares e carports para estacionamentos residenciais e comerciais, com reviews e experiências reais.'
  },
  {
    name: 'Baterias e Armazenamento de Energia',
    seo_url: 'baterias-armazenamento',
    seo_title: 'Baterias e Armazenamento Solar 2026 | Reviews',
    short_description: 'Baterias solares e armazenamento com avaliações reais.',
    description: 'Baterias, armazenamento e backup energético. Reviews de soluções on-grid e híbridas, com foco em confiabilidade.'
  },
  {
    name: 'Inversores',
    seo_url: 'inversores-solares',
    seo_title: 'Inversores Solares 2026 | Reviews de Marcas e Modelos',
    short_description: 'Inversores solares e microinversores com reviews.',
    description: 'Inversores solares, microinversores e híbridos. Avaliações e experiências de usuários e integradores.'
  },
  {
    name: 'Painéis Solares',
    seo_url: 'paineis-solares',
    seo_title: 'Painéis Solares 2026 | Reviews e Avaliações no Brasil',
    short_description: 'Painel/placa/módulo fotovoltaico com reviews reais.',
    description: 'Módulos fotovoltaicos, placas e painéis solares. Reviews de marcas, desempenho e durabilidade.'
  },
  {
    name: 'Estruturas e Fixação',
    seo_url: 'estruturas-fixacao',
    seo_title: 'Estruturas e Fixação Solar 2026 | Reviews e Empresas',
    short_description: 'Estruturas para telhado e solo com avaliações reais.',
    description: 'Estruturas e sistemas de fixação para telhados e solo. Reviews de fabricantes e instaladores.'
  },
  {
    name: 'Monitoramento e O&M',
    seo_url: 'monitoramento-operacao-manutencao',
    seo_title: 'Monitoramento e O&M Solar 2026 | Reviews e Serviços',
    short_description: 'Monitoramento e manutenção solar com reviews.',
    description: 'Operação e manutenção (O&M), monitoramento e performance. Reviews e relatos de clientes.'
  },
  {
    name: 'Financiamento de Energia Solar',
    seo_url: 'financiamento-energia-solar',
    seo_title: 'Financiamento de Energia Solar 2026 | Reviews e Experiências',
    short_description: 'Conteúdo informativo e reviews de financiamento solar.',
    description: 'Categoria informativa sobre opções de financiamento para energia solar, com reviews e experiências reais. O Avalia Solar não vende nem intermedia crédito.'
  }
]

solar_children_records = {}

solar_children.each do |data|
  cat = Category.find_or_initialize_by(seo_url: data[:seo_url])
  cat.assign_attributes(
    name: data[:name],
    parent_id: root_solar.id,
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
  solar_children_records[data[:seo_url]] = cat
end

puts "  ✓ Categorias criadas/atualizadas: #{category_counts[:created]} criadas, #{category_counts[:updated]} atualizadas"

# ================================
# Empresas (Mobilidade + Solar)
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
  # Mobilidade elétrica (mantém compatibilidade com seed atual)
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

  # Energia solar (novo hub)
  { name: 'Intelbras Solar', website: 'https://www.intelbras.com.br', state: 'SC', notes: 'Soluções solares residenciais e comerciais', categories: %w[energia-solar instaladores-energia-solar energia-solar-residencial] },
  { name: 'Canadian Solar Brasil', website: 'https://www.canadiansolar.com', state: 'SP', notes: 'Fabricante de módulos e soluções solares', categories: %w[energia-solar paineis-solares] },
  { name: 'Fronius Brasil', website: 'https://www.fronius.com', state: 'SP', notes: 'Inversores solares e soluções híbridas', categories: %w[energia-solar inversores-solares baterias-armazenamento] },
  { name: 'Solis Brasil', website: 'https://www.ginlong.com', state: 'SP', notes: 'Inversores solares para GD', categories: %w[energia-solar inversores-solares energia-solar-comercial-industrial] },
  { name: 'Growatt Brasil', website: 'https://www.growatt.com', state: 'SP', notes: 'Inversores e armazenamento', categories: %w[energia-solar inversores-solares baterias-armazenamento] },
  { name: 'Origo Energia', website: 'https://origoenergia.com.br', state: 'MG', notes: 'Energia solar compartilhada e GD', categories: %w[energia-solar energia-solar-comercial-industrial] },
  { name: 'Helecon', website: 'https://www.helecon.com', state: 'PR', notes: 'Integrador e instalador solar', categories: %w[energia-solar instaladores-energia-solar energia-solar-residencial] },
  { name: 'Revo Energia', website: 'https://revoenergia.com.br', state: 'SP', notes: 'Projetos solares e O&M', categories: %w[energia-solar monitoramento-operacao-manutencao energia-solar-comercial-industrial] },
  { name: 'Eletrobras Chesf Solar', website: 'https://www.chesf.gov.br', state: 'PE', notes: 'Projetos solares de grande porte', categories: %w[energia-solar energia-solar-comercial-industrial] },
  { name: 'Sicredi Solar', website: 'https://www.sicredi.com.br', state: 'RS', notes: 'Conteúdo informativo e reviews sobre crédito solar', categories: %w[energia-solar financiamento-energia-solar] }
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
  company.featured = data[:categories].include?('energia-solar') || data[:categories].include?('mobilidade-eletrica')
  company.financing_enabled = data[:categories].include?('energia-solar')
  company.project_types = Company::PROJECT_TYPES
  company.services_offered = Company::SERVICES_OFFERED

  if company.save
    companies_created += 1 if company.previous_changes.key?('id')
    companies_updated += 1 if company.previous_changes.any? && !company.previous_changes.key?('id')

    # associa categorias de forma aditiva
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
# Financiamento Solar (reviews-only)
# ================================
puts "\n==> Financiamento Solar (informativo)"

fin_profile_count = { created: 0, updated: 0 }
fin_partner_count = { created: 0, updated: 0 }
fin_offer_count = { created: 0, updated: 0 }

fin_disclaimer = 'Condições variam por parceiro e perfil. O Avalia Solar não vende, não intermedia e não garante financiamento. Conteúdo informativo para reviews/experiências.'

solar_companies = Company.joins(:categories).where(categories: { id: [root_solar.id, solar_children_records['financiamento-energia-solar']&.id].compact }).distinct

solar_companies.find_each do |company|
  profile = company.company_financing_profile || company.build_company_financing_profile
  profile.assign_attributes(
    title: 'Simule e compare opções (informativo)',
    subtitle: 'Conteúdo educativo baseado em reviews e experiências',
    disclaimer: fin_disclaimer,
    status: (CompanyFinancingProfile.defined_enums.dig('status', 'published') ? 'published' : profile.status),
    amortization_type: 'price',
    show_bank_logos: true,
    show_fee_inputs: false
  )
  if profile.save
    fin_profile_count[profile.previous_changes.key?('id') ? :created : :updated] += 1
  end

  # Partners (instituições reais)
  partners_data = [
    { name: 'CAIXA', website: 'https://www.caixa.gov.br', partner_type: 'bank', priority: 1, badge: 'Instituição pública' },
    { name: 'Banco do Brasil', website: 'https://www.bb.com.br', partner_type: 'bank', priority: 2, badge: 'Banco tradicional' },
    { name: 'Santander', website: 'https://www.santander.com.br', partner_type: 'bank', priority: 3, badge: 'Banco privado' },
    { name: 'Sicredi', website: 'https://www.sicredi.com.br', partner_type: 'cooperative', priority: 4, badge: 'Cooperativa' }
  ]

  if active_storage_available?
    partners_data.each_with_index do |pdata, idx|
      partner = company.company_financing_partners.find_or_initialize_by(name: pdata[:name])
      partner.assign_attributes(
        website: pdata[:website],
        partner_type: pdata[:partner_type],
        priority: pdata[:priority],
        position: idx,
        active: true,
        badge: pdata[:badge]
      )

      # CompanyFinancingPartner exige logo anexado
      if !partner.logo.attached?
        partner.logo.attach(
          io: placeholder_png_io,
          filename: "#{generate_slug(pdata[:name])}-logo.png",
          content_type: 'image/png'
        )
      end

      if partner.save
        fin_partner_count[partner.previous_changes.key?('id') ? :created : :updated] += 1
      end
    end
  else
    puts "  • ActiveStorage indisponível: parceiros de financiamento não foram criados para #{company.name}"
  end

  # Offers (templates informativos, sem taxa fixa)
  offers_data = [
    { name: 'Crédito com garantia / imóvel', offer_type: 'template', notes: 'Modelo informativo baseado em experiências de usuários.' },
    { name: 'CDC / Crédito pessoal', offer_type: 'template', notes: 'Condições variam conforme perfil e instituição.' },
    { name: 'Linha PJ / capital de giro para energia', offer_type: 'template', notes: 'Opção para empresas e projetos comerciais.' },
    { name: 'Consórcio (quando aplicável)', offer_type: 'template', notes: 'Formato alternativo, sujeito a disponibilidade.' }
  ]

  offers_data.each_with_index do |odata, idx|
    offer = company.company_financing_offers.find_or_initialize_by(name: odata[:name])
    offer.assign_attributes(
      offer_type: odata[:offer_type],
      notes: odata[:notes],
      active: true,
      position: idx
    )

    if offer.save
      fin_offer_count[offer.previous_changes.key?('id') ? :created : :updated] += 1
    end
  end
end

puts "  ✓ Perfis: #{fin_profile_count[:created]} criados, #{fin_profile_count[:updated]} atualizados"
puts "  ✓ Parceiros: #{fin_partner_count[:created]} criados, #{fin_partner_count[:updated]} atualizados"
puts "  ✓ Ofertas: #{fin_offer_count[:created]} criadas, #{fin_offer_count[:updated]} atualizadas"

# ================================
# Banners de Categoria (opcional)
# ================================
puts "\n==> Banners de Categoria (placeholder local)"

if active_storage_available? && Category.reflect_on_attachment(:banner)
  ([root_mob, root_solar] + mob_children_records.values + solar_children_records.values).compact.each do |cat|
    attach_banner_if_missing(cat, cat.seo_url)
  end
  puts "  ✓ Banners anexados quando ausentes"
else
  puts "  • ActiveStorage/banner indisponível. Skipping banners."
end

# ================================
# Atualizar métricas
# ================================
puts "\n==> Atualizando métricas"

([root_mob, root_solar] + mob_children_records.values + solar_children_records.values).compact.each do |cat|
  if cat.respond_to?(:update_metrics!)
    cat.update_metrics!
    puts "  ✓ #{cat.name}: #{cat.companies_count} empresas"
  else
    cat.touch
    puts "  • #{cat.name}: update_metrics! indisponível (touch)"
  end
end

puts "\n=== SEED CONCLUÍDO ==="
