#!/usr/bin/env ruby
# Script para corrigir imagens do Active Storage (404)
# Recria todas as imagens usando placeholders

require_relative 'config/environment'
require 'open-uri'
require 'fileutils'

puts "=" * 80
puts "CORREÇÃO AUTOMÁTICA DE IMAGENS - Active Storage"
puts "=" * 80

# Garante que a pasta storage existe
storage_path = Rails.root.join('storage')
FileUtils.mkdir_p(storage_path) unless Dir.exist?(storage_path)

def download_placeholder(width, height, text, retries = 3)
  text_encoded = URI.encode_www_form_component(text)
  url = "https://via.placeholder.com/#{width}x#{height}/4F46E5/FFFFFF?text=#{text_encoded}"
  
  retries.times do |attempt|
    begin
      puts "      Tentativa #{attempt + 1}/#{retries}..."
      data = URI.open(url, read_timeout: 10).read
      return data if data
    rescue => e
      puts "      ⚠️  Erro: #{e.message}"
      sleep(1)
    end
  end
  
  nil
end

# ========================================
# CATEGORIAS - Recreate banners
# ========================================
puts "\n" + "=" * 80
puts "1. CORRIGINDO IMAGENS DE CATEGORIAS"
puts "=" * 80

categories_fixed = 0
categories_failed = 0

Category.all.each do |category|
  puts "\n📂 Categoria: #{category.name} (ID: #{category.id})"
  
  # Verifica se já tem banner e se está OK
  if category.banner.attached?
    begin
      blob = category.banner.blob
      file_path = ActiveStorage::Blob.service.send(:path_for, blob.key)
      
      if File.exist?(file_path)
        puts "   ✅ Banner OK - ignorando"
        next
      else
        puts "   ⚠️  Banner existe mas arquivo não - recriando..."
        category.banner.purge
      end
    rescue => e
      puts "   ⚠️  Erro ao verificar banner - recriando..."
      category.banner.purge rescue nil
    end
  end
  
  # Baixa nova imagem placeholder
  puts "   📥 Baixando imagem placeholder..."
  image_data = download_placeholder(800, 400, category.name)
  
  if image_data
    begin
      category.banner.attach(
        io: StringIO.new(image_data),
        filename: "#{category.name.parameterize}-banner.png",
        content_type: 'image/png'
      )
      
      if category.save
        puts "   ✅ Banner recriado com sucesso!"
        categories_fixed += 1
      else
        puts "   ❌ Erro ao salvar: #{category.errors.full_messages.join(', ')}"
        categories_failed += 1
      end
    rescue => e
      puts "   ❌ Erro ao anexar imagem: #{e.message}"
      categories_failed += 1
    end
  else
    puts "   ❌ Não foi possível baixar imagem"
    categories_failed += 1
  end
end

# ========================================
# EMPRESAS - Recreate logos
# ========================================
puts "\n" + "=" * 80
puts "2. CORRIGINDO LOGOS DE EMPRESAS"
puts "=" * 80

companies_fixed = 0
companies_failed = 0

Company.limit(20).each do |company|
  puts "\n🏢 Empresa: #{company.name} (ID: #{company.id})"
  
  # Verifica se já tem logo e se está OK
  if company.logo.attached?
    begin
      blob = company.logo.blob
      file_path = ActiveStorage::Blob.service.send(:path_for, blob.key)
      
      if File.exist?(file_path)
        puts "   ✅ Logo OK - ignorando"
        next
      else
        puts "   ⚠️  Logo existe mas arquivo não - recriando..."
        company.logo.purge
      end
    rescue => e
      puts "   ⚠️  Erro ao verificar logo - recriando..."
      company.logo.purge rescue nil
    end
  end
  
  # Baixa nova imagem placeholder
  puts "   📥 Baixando logo placeholder..."
  image_data = download_placeholder(200, 200, company.name)
  
  if image_data
    begin
      company.logo.attach(
        io: StringIO.new(image_data),
        filename: "#{company.name.parameterize}-logo.png",
        content_type: 'image/png'
      )
      
      if company.save
        puts "   ✅ Logo recriado com sucesso!"
        companies_fixed += 1
      else
        puts "   ❌ Erro ao salvar: #{company.errors.full_messages.join(', ')}"
        companies_failed += 1
      end
    rescue => e
      puts "   ❌ Erro ao anexar imagem: #{e.message}"
      companies_failed += 1
    end
  else
    puts "   ❌ Não foi possível baixar imagem"
    companies_failed += 1
  end
end

# ========================================
# BANNERS - Recreate images
# ========================================
puts "\n" + "=" * 80
puts "3. CORRIGINDO IMAGENS DE BANNERS"
puts "=" * 80

banners_fixed = 0
banners_failed = 0

Banner.all.each do |banner|
  puts "\n🎯 Banner: #{banner.title} (ID: #{banner.id})"
  
  # Verifica se já tem imagem e se está OK
  if banner.image.attached?
    begin
      blob = banner.image.blob
      file_path = ActiveStorage::Blob.service.send(:path_for, blob.key)
      
      if File.exist?(file_path)
        puts "   ✅ Imagem OK - ignorando"
        next
      else
        puts "   ⚠️  Imagem existe mas arquivo não - recriando..."
        banner.image.purge
      end
    rescue => e
      puts "   ⚠️  Erro ao verificar imagem - recriando..."
      banner.image.purge rescue nil
    end
  end
  
  # Define dimensões baseado na posição
  width, height = case banner.position
  when 'categories_top'
    [1200, 400]
  when 'navbar'
    [1920, 200]
  when 'sidebar'
    [300, 250]
  else
    [1200, 400]
  end
  
  # Baixa nova imagem placeholder
  puts "   📥 Baixando imagem placeholder (#{width}x#{height})..."
  image_data = download_placeholder(width, height, banner.title)
  
  if image_data
    begin
      banner.image.attach(
        io: StringIO.new(image_data),
        filename: "#{banner.title.parameterize}-#{banner.position}.png",
        content_type: 'image/png'
      )
      
      if banner.save
        puts "   ✅ Imagem recriada com sucesso!"
        banners_fixed += 1
      else
        puts "   ❌ Erro ao salvar: #{banner.errors.full_messages.join(', ')}"
        banners_failed += 1
      end
    rescue => e
      puts "   ❌ Erro ao anexar imagem: #{e.message}"
      banners_failed += 1
    end
  else
    puts "   ❌ Não foi possível baixar imagem"
    banners_failed += 1
  end
end

# ========================================
# RESUMO
# ========================================
puts "\n" + "=" * 80
puts "RESUMO DA CORREÇÃO"
puts "=" * 80

puts "\n📊 Estatísticas:"
puts "   Categorias corrigidas: #{categories_fixed}"
puts "   Categorias com erro: #{categories_failed}"
puts "   Empresas corrigidas: #{companies_fixed}"
puts "   Empresas com erro: #{companies_failed}"
puts "   Banners corrigidos: #{banners_fixed}"
puts "   Banners com erro: #{banners_failed}"

total_fixed = categories_fixed + companies_fixed + banners_fixed
total_failed = categories_failed + companies_failed + banners_failed

puts "\n   Total corrigido: #{total_fixed}"
puts "   Total com erro: #{total_failed}"

if total_fixed > 0
  puts "\n✅ Imagens recriadas com sucesso!"
  puts "\n🧪 Teste agora:"
  puts "   1. Frontend: https://avaliasolar.com.br/categories"
  puts "   2. API: curl 'https://api.avaliasolar.com.br/api/v1/categories'"
  puts "   3. Banners: curl 'https://api.avaliasolar.com.br/api/v1/banners?position=categories_top'"
end

if total_failed > 0
  puts "\n⚠️  Algumas imagens não puderam ser recriadas"
  puts "   Possíveis causas:"
  puts "   - Problema de conexão com via.placeholder.com"
  puts "   - Permissões de escrita na pasta storage/"
  puts "   - Validações do modelo falhando"
  puts "\n   Execute novamente ou crie manualmente via admin panel"
end

# Limpar blobs órfãos
puts "\n" + "=" * 80
puts "LIMPEZA DE BLOBS ÓRFÃOS"
puts "=" * 80

orphan_count = 0
ActiveStorage::Blob.find_each do |blob|
  key = blob.key
  file_path = ActiveStorage::Blob.service.send(:path_for, key)
  
  unless File.exist?(file_path)
    # Verifica se o blob não está sendo usado
    if blob.attachments.empty?
      puts "   🗑️  Removendo blob órfão: #{blob.filename} (ID: #{blob.id})"
      blob.destroy rescue nil
      orphan_count += 1
    end
  end
end

puts "\n   Blobs órfãos removidos: #{orphan_count}"

puts "\n" + "=" * 80
puts "✅ CORREÇÃO CONCLUÍDA!"
puts "=" * 80
