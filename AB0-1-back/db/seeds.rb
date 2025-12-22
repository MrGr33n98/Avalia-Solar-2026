# ================================
# Admin User
# ================================
if ENV['SEED_ADMIN_EMAIL'] && ENV['SEED_ADMIN_PASSWORD']
  AdminUser.find_or_create_by!(email: ENV['SEED_ADMIN_EMAIL']) do |admin|
    admin.password = ENV['SEED_ADMIN_PASSWORD']
    admin.password_confirmation = ENV['SEED_ADMIN_PASSWORD']
    puts "Admin user created: #{admin.email}"
  end
end

# ================================
# Empresas de Energia Solar
# ================================
companies = [
  { name: 'BSol Energia Solar', description: 'Especialista em projetos residenciais e comerciais de energia solar.', phone: '(48) 3232-1111', address: 'Florianópolis, SC' },
  { name: 'SunPower Brasil', description: 'Distribuidora de painéis solares de alta eficiência.', phone: '(11) 4000-2000', address: 'São Paulo, SP' },
  { name: 'EcoVolt', description: 'Consultoria e instalação de sistemas fotovoltaicos.', phone: '(21) 3555-1212', address: 'Rio de Janeiro, RJ' },
  { name: 'SolarMax', description: 'Especializada em sistemas on-grid e off-grid.', phone: '(31) 3222-9898', address: 'Belo Horizonte, MG' }
]

companies.each do |company_attrs|
  Company.find_or_create_by!(name: company_attrs[:name]) do |company|
    company.assign_attributes(company_attrs)
    puts "Criada empresa: #{company.name}"
  end
end

all_companies = Company.all

# Criando categorias iniciais

categories_data = [
  {
    name: 'Painéis Solares',
    seo_url: 'paineis-solares',
    seo_title: 'Painéis Solares | Compare Solar',
    short_description: 'Categoria dedicada a todos os tipos de módulos fotovoltaicos, incluindo monocristalinos e policristalinos.',
    description: 'Explore nossa seleção completa de painéis solares de alta eficiência. Encontre os melhores módulos fotovoltaicos para sua instalação, com opções monocristalinas e policristalinas dos principais fabricantes.',
    kind: 'main',
    status: 'active',
    featured: true
  },
  {
    name: 'Inversores Solares',
    seo_url: 'inversores-solares',
    seo_title: 'Inversores Solares | Compare Solar',
    short_description: 'Dispositivos para conversão da energia solar em corrente alternada.',
    description: 'Conheça nossa linha de inversores solares de alta qualidade. Encontre o inversor ideal para seu sistema fotovoltaico, com opções monofásicas e trifásicas das melhores marcas.',
    kind: 'main',
    status: 'active',
    featured: true
  },
  {
    name: 'Baterias de Armazenamento',
    seo_url: 'baterias-armazenamento',
    seo_title: 'Baterias de Armazenamento | Compare Solar',
    short_description: 'Soluções de armazenamento de energia com baterias de lítio e outras tecnologias.',
    description: 'Descubra as melhores opções em baterias para armazenamento de energia solar. Compare diferentes tecnologias e capacidades para encontrar a solução ideal para seu sistema.',
    kind: 'main',
    status: 'active',
    featured: true
  },
  {
    name: 'Sistemas Off-Grid',
    seo_url: 'sistemas-off-grid',
    seo_title: 'Sistemas Off-Grid | Compare Solar',
    short_description: 'Soluções completas para locais sem acesso à rede pública de energia.',
    description: 'Encontre sistemas solares completos para independência energética. Ideal para locais remotos ou sem acesso à rede elétrica, com soluções personalizadas para suas necessidades.',
    kind: 'main',
    status: 'active',
    featured: true
  },
  {
    name: 'Hardware',
    seo_url: 'hardware',
    seo_title: 'Hardware Solar | Compare Solar',
    short_description: 'Categoria para todos os tipos de hardware e equipamentos complementares.',
    description: 'Todos os componentes necessários para sua instalação solar, incluindo estruturas de montagem, cabos, conectores e equipamentos de proteção.',
    kind: 'main',
    status: 'active',
    featured: true
  }
]

categories_data.each do |category_data|
  Category.find_or_create_by!(name: category_data[:name]) do |category|
    category.assign_attributes(category_data)
  end
end

puts "Categorias criadas com sucesso!"

# ================================
# Produtos de Energia Solar
# ================================
products = [
  { name: 'Painel Solar 550W', description: 'Painel fotovoltaico monocristalino de alta eficiência.', short_description: 'Painel 550W Mono', price: 1200.00, sku: 'PS550M', stock: 200, status: 'active', featured: true, company: all_companies.sample },
  { name: 'Inversor Solar 5kW', description: 'Inversor on-grid trifásico de 5kW.', short_description: 'Inversor 5kW On-Grid', price: 4500.00, sku: 'INV5000', stock: 50, status: 'active', featured: true, company: all_companies.sample },
  { name: 'Bateria Solar 10kWh', description: 'Bateria de lítio para armazenamento de energia solar.', short_description: 'Bateria 10kWh', price: 15000.00, sku: 'BAT10K', stock: 30, status: 'active', featured: false, company: all_companies.sample },
  { name: 'Kit Solar Off-Grid 2kWp', description: 'Sistema completo off-grid para residências em áreas remotas.', short_description: 'Kit Solar Off-Grid', price: 18000.00, sku: 'KIT2KW', stock: 10, status: 'active', featured: true, company: all_companies.sample }
]

products.each do |product_attrs|
  Product.find_or_create_by!(name: product_attrs[:name]) do |product|
    product.assign_attributes(product_attrs)
    puts "Criado produto: #{product.name}"
  end
end

# ================================
# Banners
# ================================
banners = [
  { title: 'Economize até 95% na conta de luz', image_url: 'https://www.avaliasolar.com.br/images/banner1.png', link: '/categorias/paineis-solares', active: true },
  { title: 'Financiamento Solar Facilitado', image_url: 'https://www.avaliasolar.com.br/images/banner2.png', link: '/financiamento', active: true },
  { title: 'Kit Off-Grid Completo', image_url: 'https://www.avaliasolar.com.br/images/banner3.png', link: '/categorias/sistemas-off-grid', active: true }
]

banners.each do |banner_attrs|
  Banner.find_or_create_by!(title: banner_attrs[:title]) do |banner|
    banner.assign_attributes(banner_attrs)
    puts "Criado banner: #{banner.title}"
  end
end

# ================================
# Extra: +6 empresas para totalizar 10
# ================================
more_companies = [
  { name: 'Energia Viva', description: 'Projetos solares residenciais e comerciais.', phone: '(12) 3456-7890', address: 'Taubaté, SP', state: 'SP', city: 'Taubaté', website: 'https://energiaviva.com.br', email_public: 'contato@energiaviva.com.br', whatsapp: '+5512987654321', status: 'active', verified: true },
  { name: 'Lumen Solar', description: 'Especialistas em fotovoltaico industrial.', phone: '(31) 98765-4321', address: 'Contagem, MG', state: 'MG', city: 'Contagem', website: 'https://lumensolar.com.br', email_public: 'contato@lumensolar.com.br', whatsapp: '+5531981234567', status: 'active' },
  { name: 'Sol & Tech', description: 'Consultoria e manutenção de sistemas solares.', phone: '(41) 3344-5566', address: 'Curitiba, PR', state: 'PR', city: 'Curitiba', website: 'https://soltech.com.br', email_public: 'contato@soltech.com.br', whatsapp: '+5541998877665', status: 'active' },
  { name: 'Helio Power', description: 'Distribuição e instalação fotovoltaica completa.', phone: '(61) 4002-8922', address: 'Brasília, DF', state: 'DF', city: 'Brasília', website: 'https://heliopower.com.br', email_public: 'contato@heliopower.com.br', whatsapp: '+5561998877665', status: 'active' },
  { name: 'Nord Solar', description: 'Soluções solares para regiões sul e sudeste.', phone: '(51) 3555-7788', address: 'Porto Alegre, RS', state: 'RS', city: 'Porto Alegre', website: 'https://nordsolar.com.br', email_public: 'contato@nordsolar.com.br', whatsapp: '+5551994455667', status: 'active' },
  { name: 'Amazônia Solar', description: 'Projetos solares sustentáveis na região norte.', phone: '(92) 3123-4567', address: 'Manaus, AM', state: 'AM', city: 'Manaus', website: 'https://amazoniasolar.com.br', email_public: 'contato@amazoniasolar.com.br', whatsapp: '+5592987654321', status: 'active' }
]

more_companies.each do |attrs|
  Company.find_or_create_by!(name: attrs[:name]) do |c|
    c.assign_attributes(attrs)
    puts "Criada empresa: #{c.name}"
  end
end

# ================================
# Extra: +5 categorias para totalizar 10
# ================================
extra_categories = [
  { name: 'Estruturas e Suportes', seo_url: 'estruturas-suportes', seo_title: 'Estruturas e Suportes | Compare Solar', short_description: 'Estruturas de fixação e suportes para painéis.', description: 'Componentes estruturais para montagem segura de módulos, incluindo suportes inclinados, fixadores e trilhos.', kind: 'main', status: 'active', featured: true },
  { name: 'Cabos e Conectores', seo_url: 'cabos-conectores', seo_title: 'Cabos e Conectores | Compare Solar', short_description: 'Cabos fotovoltaicos e conectores MC4.', description: 'Itens essenciais para conexão de sistemas fotovoltaicos com segurança e eficiência.', kind: 'main', status: 'active', featured: false },
  { name: 'Microinversores', seo_url: 'microinversores', seo_title: 'Microinversores | Compare Solar', short_description: 'Conversão por módulo para maior confiabilidade.', description: 'Soluções com microinversores que simplificam a instalação e otimizam o desempenho.', kind: 'main', status: 'active', featured: true },
  { name: 'Controladores de Carga', seo_url: 'controladores-carga', seo_title: 'Controladores de Carga | Compare Solar', short_description: 'MPPT e PWM para sistemas off-grid.', description: 'Controladores que gerenciam a carga de baterias, garantindo longevidade e segurança.', kind: 'main', status: 'active', featured: false },
  { name: 'Monitoramento e IoT', seo_url: 'monitoramento-iot', seo_title: 'Monitoramento e IoT | Compare Solar', short_description: 'Plataformas e dispositivos de telemetria.', description: 'Ferramentas de monitoramento em tempo real e análise de desempenho para sistemas solares.', kind: 'main', status: 'active', featured: false }
]

extra_categories.each do |cat|
  Category.find_or_create_by!(name: cat[:name]) do |c|
    c.assign_attributes(cat)
  end
end

# ================================
# Usuários associados às empresas
# ================================
Company.find_each do |comp|
  email = "company#{comp.id}@example.com"
  User.find_or_create_by!(email: email) do |u|
    u.name = "#{comp.name} Representante"
    u.password = 'Password1!'
    u.password_confirmation = 'Password1!'
    u.role = 'company'
    u.company = comp
    u.terms_accepted = true
    u.confirmed_at = Time.current
    puts "Criado usuário da empresa: #{u.email} -> #{comp.name}"
  end
end

puts "Seeds concluídos com sucesso para o mercado solar!"
