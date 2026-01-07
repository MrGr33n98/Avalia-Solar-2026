#!/usr/bin/env ruby
# Script para criar banners de teste com imagens placeholder

require_relative 'config/environment'
require 'open-uri'
require 'net/http'

puts "=" * 80
puts "CRIANDO BANNERS DE TESTE"
puts "=" * 80

def download_placeholder_image(width, height, text)
  url = "https://via.placeholder.com/#{width}x#{height}/4F46E5/FFFFFF?text=#{URI.encode_www_form_component(text)}"
  puts "   📥 Baixando imagem: #{url}"
  
  begin
    URI.open(url).read
  rescue => e
    puts "   ❌ Erro ao baixar imagem: #{e.message}"
    nil
  end
end

def create_banner(title:, position:, width:, height:, category: nil)
  puts "\n🔨 Criando banner: #{title}"
  
  # Verifica se já existe
  existing = Banner.find_by(title: title, position: position)
  if existing
    puts "   ⚠️  Banner já existe (ID: #{existing.id})"
    
    # Ativa e aprova se não estiver
    if !existing.active || (Banner.column_names.include?('moderation_status') && existing.moderation_status != 'approved')
      existing.update!(active: true)
      if Banner.column_names.include?('moderation_status')
        existing.update!(moderation_status: 'approved')
      end
      puts "   ✅ Banner atualizado para ativo e aprovado"
    end
    
    return existing
  end
  
  # Cria novo banner
  banner = Banner.new(
    title: title,
    banner_type: 'rectangular_large',
    position: position,
    link: 'https://avaliasolar.com.br',
    active: true,
    category_id: category&.id,
    sponsored: false
  )
  
  # Define moderation_status se a coluna existir
  if Banner.column_names.include?('moderation_status')
    banner.moderation_status = 'approved'
  end
  
  # Baixa e anexa imagem placeholder
  image_data = download_placeholder_image(width, height, title)
  
  if image_data
    banner.image.attach(
      io: StringIO.new(image_data),
      filename: "#{title.parameterize}.png",
      content_type: 'image/png'
    )
  else
    puts "   ⚠️  Não foi possível baixar a imagem, criando sem imagem"
  end
  
  if banner.save
    puts "   ✅ Banner criado com sucesso! (ID: #{banner.id})"
    banner
  else
    puts "   ❌ Erro ao criar banner: #{banner.errors.full_messages.join(', ')}"
    nil
  end
end

# Pega primeira categoria
category = Category.first

if category
  puts "\n📂 Usando categoria: #{category.name} (ID: #{category.id})"
else
  puts "\n⚠️  Nenhuma categoria encontrada"
end

puts "\n" + "=" * 80
puts "Criando banners para diferentes posições..."
puts "=" * 80

# Criar banners para categories_top
banners_created = []

banners_created << create_banner(
  title: 'Energia Solar - Soluções Completas',
  position: 'categories_top',
  width: 1200,
  height: 400,
  category: category
)

banners_created << create_banner(
  title: 'Painéis Solares de Alta Eficiência',
  position: 'categories_top',
  width: 1200,
  height: 400,
  category: category
)

banners_created << create_banner(
  title: 'Inversores Fotovoltaicos',
  position: 'categories_top',
  width: 1200,
  height: 400,
  category: category
)

# Criar banners para navbar
banners_created << create_banner(
  title: 'Navbar - Promoção Especial',
  position: 'navbar',
  width: 1920,
  height: 200,
  category: category
)

# Criar banner para sidebar
banners_created << create_banner(
  title: 'Sidebar - Contato WhatsApp',
  position: 'sidebar',
  width: 300,
  height: 250,
  category: category
)

puts "\n" + "=" * 80
puts "RESUMO"
puts "=" * 80

successful_banners = banners_created.compact
puts "✅ Banners criados/atualizados: #{successful_banners.count}"

puts "\n📊 Status dos banners por posição:"
%w[categories_top navbar sidebar].each do |position|
  active_count = Banner.currently_active.where(position: position).count
  total_count = Banner.where(position: position).count
  puts "   #{position}: #{active_count}/#{total_count} ativos"
end

puts "\n" + "=" * 80
puts "TESTE DA API"
puts "=" * 80

# Testa a API para categories_top
categories_banners = Banner.currently_active.where(position: 'categories_top')
puts "\n📍 Banners em 'categories_top' (como a API retorna):"
puts "   Total: #{categories_banners.count}"

if categories_banners.any?
  puts "   Listando:"
  categories_banners.each do |banner|
    puts "   - ID: #{banner.id}, Título: #{banner.title}"
    puts "     Image attached: #{banner.image.attached?}"
    puts "     Image URL: #{banner.image_url.present? ? 'OK' : 'MISSING'}"
  end
else
  puts "   ⚠️  PROBLEMA: Ainda não há banners ativos!"
  puts "\n🔍 Debug:"
  
  all_banners = Banner.where(position: 'categories_top')
  puts "   Total de banners (incluindo inativos): #{all_banners.count}"
  
  if all_banners.any?
    all_banners.each do |banner|
      issues = []
      issues << "inactive" unless banner.active
      issues << "not approved (#{banner.moderation_status})" if Banner.column_names.include?('moderation_status') && banner.moderation_status != 'approved'
      issues << "no image" unless banner.image.attached?
      
      puts "   - ID #{banner.id}: #{banner.title}"
      puts "     Problemas: #{issues.join(', ')}" if issues.any?
    end
  end
end

puts "\n" + "=" * 80
puts "PRÓXIMOS PASSOS"
puts "=" * 80
puts "1. Teste a API: curl 'https://api.avaliasolar.com.br/api/v1/banners?position=categories_top'"
puts "2. Acesse o frontend: https://avaliasolar.com.br/categories"
puts "3. Verifique o admin panel: https://api.avaliasolar.com.br/admin/banners"
puts "=" * 80
