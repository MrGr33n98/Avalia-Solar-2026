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

# Criar usuário específico felipe@avaliasolar.com.br
AdminUser.find_or_create_by!(email: 'felipe@avaliasolar.com.br') do |admin|
  admin.password = 'ZAbgbZeVAK+!5!'
  admin.password_confirmation = 'ZAbgbZeVAK+!5!'
  puts "Admin user criado: felipe@avaliasolar.com.br"
end

# ================================
# Empresas de Energia Solar
# ================================
companies = [
  { name: 'BSol Energia Solar', description: 'Especialista em projetos residenciais e comerciais de energia solar.', phone: '4832321111', address: 'Florianópolis, SC', city: 'Florianópolis', state: 'SC', email: 'contato@bsol.com.br', status: 'pending' },
  { name: 'SunPower Brasil', description: 'Distribuidora de painéis solares de alta eficiência.', phone: '1140002000', address: 'São Paulo, SP', city: 'São Paulo', state: 'SP', email: 'contato@sunpower.com.br', status: 'pending' },
  { name: 'EcoVolt', description: 'Consultoria e instalação de sistemas fotovoltaicos.', phone: '2135551212', address: 'Rio de Janeiro, RJ', city: 'Rio de Janeiro', state: 'RJ', email: 'contato@ecovolt.com.br', status: 'pending' },
  { name: 'SolarMax', description: 'Especializada em sistemas on-grid e off-grid.', phone: '3132229898', address: 'Belo Horizonte, MG', city: 'Belo Horizonte', state: 'MG', email: 'contato@solarmax.com.br', status: 'pending' }
]

companies.each do |company_attrs|
  Company.find_or_create_by!(name: company_attrs[:name]) do |company|
    company.assign_attributes(company_attrs)
    puts "Criada empresa: #{company.name}"
  end
end

all_companies = Company.all

# ================================
# Categorias Solar (Hierárquicas)
# ================================
load Rails.root.join('db', 'seeds', 'categories_solar.rb')

# ================================
# Empresas a partir do JSON (Nova Carga)
# ================================
load Rails.root.join('db', 'seeds', 'companies_from_json.rb')

puts "Seeds concluídos com sucesso para o mercado solar!"

# ================================
# Seed Articles from JSON
# ================================
require 'json'
require 'open-uri'

json_path = Rails.root.join('..', 'seed_articles.json')

if File.exist?(json_path)
  puts "\n📖 Carregando artigos de #{json_path}..."
  json_data = JSON.parse(File.read(json_path))
  articles_data = json_data['articles'] || []

  articles_data.each do |article_data|
    # Find Category
    category = Category.find_by(name: article_data['category_name'])
    unless category
      puts "⚠️ Categoria '#{article_data['category_name']}' não encontrada. Criando..."
      category = Category.create!(name: article_data['category_name'], kind: 'main', status: 'active')
    end

    # Find or Create Author (AdminUser)
    author_data = article_data['author']
    # Ensure author_data is present to avoid errors
    if author_data
      author_email = author_data['name'].parameterize + "@example.com"
      author = AdminUser.find_or_create_by!(email: author_email) do |u|
        u.password = 'password123'
        u.password_confirmation = 'password123'
        u.name = author_data['name']
        u.bio = author_data['bio']
      end
      
      # Attach avatar if new or not attached (optional check)
      if author_data['avatar'].present? && !author.avatar_photo.attached?
        # begin
        #   file = URI.open(author_data['avatar'])
        #   author.avatar_photo.attach(io: file, filename: "avatar_#{author.id}.jpg", content_type: 'image/jpeg')
        # rescue => e
        #   puts "⚠️ Erro ao baixar avatar do autor #{author.name}: #{e.message}"
        # end
      end
    else
      author = AdminUser.first # Fallback
    end

    # Create Article
    article = Article.find_or_initialize_by(slug: article_data['slug'])
    article.title = article_data['title']
    article.content = article_data['content']
    article.excerpt = article_data['excerpt']
    article.category = category
    article.author = author
    article.published_at = article_data['published_at']
    article.status = article_data['status']
    # Handle nested meta if present
    if article_data['meta']
      article.meta_title = article_data['meta']['title']
      article.meta_description = article_data['meta']['description']
    end

    if article.save
      puts "✅ Artigo criado/atualizado: #{article.title}"
      
      # Attach Featured Image (Banner)
      if article_data['featured_image'].present? && !article.banner.attached?
        # begin
        #   # puts "   📸 Baixando imagem destaque..." # Less verbose
        #   file = URI.open(article_data['featured_image'])
        #   article.banner.attach(io: file, filename: "#{article.slug}.jpg", content_type: 'image/jpeg')
        # rescue => e
        #   puts "   ❌ Erro ao anexar banner: #{e.message}"
        # end
      end
    else
      puts "❌ Erro ao salvar artigo '#{article.title}': #{article.errors.full_messages.join(', ')}"
    end
  end
else
  puts "⚠️ Arquivo seed_articles.json não encontrado em #{json_path}"
end

# ================================
# Enterprise spec templates (Solar + EV)
# ================================
begin
  SpecTemplates::EnterpriseSeedService.call
  puts "✅ Templates enterprise de specs semeados/atualizados."
rescue => e
  puts "⚠️ Falha ao semear templates enterprise: #{e.message}"
end

