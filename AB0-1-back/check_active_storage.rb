#!/usr/bin/env ruby
# Script para diagnosticar e corrigir problemas de Active Storage (404)

require_relative 'config/environment'
require 'open-uri'
require 'fileutils'

puts "=" * 80
puts "DIAGNÓSTICO DE ACTIVE STORAGE - Imagens 404"
puts "=" * 80

# Verificar configuração do Active Storage
puts "\n📁 Configuração do Active Storage:"
puts "   Service: #{Rails.configuration.active_storage.service}"
puts "   Root: #{ActiveStorage::Blob.service.root rescue 'N/A'}"

storage_path = Rails.root.join('storage')
puts "   Storage path: #{storage_path}"
puts "   Storage exists: #{Dir.exist?(storage_path)}"

# Verificar categorias com imagens
puts "\n" + "=" * 80
puts "CATEGORIAS - Diagnóstico de Imagens"
puts "=" * 80

categories_with_images = Category.joins(:banner_image_attachment).distinct
categories_without_images = Category.where.not(id: categories_with_images.pluck(:id))

puts "\n📊 Estatísticas:"
puts "   Total de categorias: #{Category.count}"
puts "   Com banner anexado: #{categories_with_images.count}"
puts "   Sem banner anexado: #{categories_without_images.count}"

# Verificar cada categoria
puts "\n🔍 Detalhes das Categorias:"
Category.all.each do |category|
  puts "\n   Categoria: #{category.name} (ID: #{category.id})"
  
  if category.banner.attached?
    puts "   ✅ Banner anexado"
    begin
      url = category.banner_url
      puts "   📷 URL: #{url&.first(100)}..."
      
      # Verifica se o arquivo existe fisicamente
      blob = category.banner.blob
      key = blob.key
      file_path = ActiveStorage::Blob.service.send(:path_for, key)
      
      if File.exist?(file_path)
        size = File.size(file_path)
        puts "   ✅ Arquivo existe: #{file_path}"
        puts "   📦 Tamanho: #{(size / 1024.0).round(2)} KB"
      else
        puts "   ❌ PROBLEMA: Arquivo não existe no disco!"
        puts "   🔍 Path esperado: #{file_path}"
      end
    rescue => e
      puts "   ❌ Erro ao verificar: #{e.message}"
    end
  else
    puts "   ⚠️  Nenhum banner anexado"
  end
end

# Verificar empresas com logos
puts "\n" + "=" * 80
puts "EMPRESAS - Diagnóstico de Logos"
puts "=" * 80

companies_with_logos = Company.joins(:logo_attachment).distinct
companies_without_logos = Company.where.not(id: companies_with_logos.pluck(:id))

puts "\n📊 Estatísticas:"
puts "   Total de empresas: #{Company.count}"
puts "   Com logo anexado: #{companies_with_logos.count}"
puts "   Sem logo anexado: #{companies_without_logos.count}"

# Verificar banners
puts "\n" + "=" * 80
puts "BANNERS - Diagnóstico de Imagens"
puts "=" * 80

total_banners = Banner.count
banners_with_images = Banner.joins(:image_attachment).distinct.count
banners_without_images = total_banners - banners_with_images

puts "\n📊 Estatísticas:"
puts "   Total de banners: #{total_banners}"
puts "   Com imagem anexada: #{banners_with_images}"
puts "   Sem imagem anexada: #{banners_without_images}"

Banner.all.each do |banner|
  puts "\n   Banner: #{banner.title} (ID: #{banner.id})"
  
  if banner.image.attached?
    puts "   ✅ Imagem anexada"
    begin
      url = banner.image_url
      puts "   📷 URL: #{url&.first(100)}..."
      
      blob = banner.image.blob
      key = blob.key
      file_path = ActiveStorage::Blob.service.send(:path_for, key)
      
      if File.exist?(file_path)
        size = File.size(file_path)
        puts "   ✅ Arquivo existe: #{file_path}"
        puts "   📦 Tamanho: #{(size / 1024.0).round(2)} KB"
      else
        puts "   ❌ PROBLEMA: Arquivo não existe no disco!"
        puts "   🔍 Path esperado: #{file_path}"
      end
    rescue => e
      puts "   ❌ Erro ao verificar: #{e.message}"
    end
  else
    puts "   ⚠️  Nenhuma imagem anexada"
  end
end

# Contar blobs órfãos (sem arquivo físico)
puts "\n" + "=" * 80
puts "ACTIVE STORAGE BLOBS - Verificação"
puts "=" * 80

total_blobs = ActiveStorage::Blob.count
orphan_blobs = []

puts "\n📊 Verificando #{total_blobs} blobs..."

ActiveStorage::Blob.find_each do |blob|
  key = blob.key
  file_path = ActiveStorage::Blob.service.send(:path_for, key)
  
  unless File.exist?(file_path)
    orphan_blobs << {
      id: blob.id,
      key: key,
      filename: blob.filename,
      path: file_path
    }
  end
end

puts "\n📊 Resultados:"
puts "   Total de blobs: #{total_blobs}"
puts "   Blobs com arquivo: #{total_blobs - orphan_blobs.count}"
puts "   Blobs órfãos (sem arquivo): #{orphan_blobs.count}"

if orphan_blobs.any?
  puts "\n⚠️  PROBLEMAS ENCONTRADOS:"
  puts "   #{orphan_blobs.count} blobs não têm arquivo físico correspondente"
  puts "\n   Lista de blobs órfãos:"
  orphan_blobs.first(10).each do |blob_info|
    puts "   - #{blob_info[:filename]} (ID: #{blob_info[:id]})"
    puts "     Path esperado: #{blob_info[:path]}"
  end
  
  if orphan_blobs.count > 10
    puts "   ... e mais #{orphan_blobs.count - 10} blobs"
  end
end

# Sugestões de correção
puts "\n" + "=" * 80
puts "SOLUÇÕES PARA CORRIGIR"
puts "=" * 80

if orphan_blobs.any?
  puts "\n⚠️  PROBLEMA: Arquivos do Active Storage não existem no disco"
  puts "\n💡 CAUSAS POSSÍVEIS:"
  puts "   1. Pasta storage/ foi deletada"
  puts "   2. Deploy não copiou os arquivos"
  puts "   3. Banco de dados foi restaurado de backup mas arquivos não"
  puts "   4. Docker volume não está montado corretamente"
  
  puts "\n✅ SOLUÇÕES:"
  puts "\n   Opção 1: Recriar todas as imagens (RECOMENDADO)"
  puts "   Execute: bundle exec ruby fix_active_storage_images.rb"
  
  puts "\n   Opção 2: Limpar blobs órfãos"
  puts "   Execute no console Rails:"
  puts "   ActiveStorage::Blob.where(id: [#{orphan_blobs.map { |b| b[:id] }.join(', ')}]).destroy_all"
  
  puts "\n   Opção 3: Restaurar de backup"
  puts "   Se você tem backup da pasta storage/, copie para:"
  puts "   #{storage_path}"
  
  puts "\n   Opção 4: Recriar manualmente via Admin Panel"
  puts "   Acesse: https://api.avaliasolar.com.br/admin"
  puts "   E faça upload das imagens novamente"
else
  puts "\n✅ Tudo OK! Todos os blobs têm arquivos físicos"
end

# Verificar permissões da pasta storage
puts "\n" + "=" * 80
puts "VERIFICAÇÃO DE PERMISSÕES"
puts "=" * 80

if Dir.exist?(storage_path)
  stat = File.stat(storage_path)
  puts "\n📁 Pasta storage/:"
  puts "   Permissões: #{sprintf('%o', stat.mode)}"
  puts "   Owner: UID #{stat.uid}, GID #{stat.gid}"
  
  # Testar escrita
  test_file = storage_path.join('test_write.txt')
  begin
    File.write(test_file, 'test')
    File.delete(test_file)
    puts "   ✅ Pasta tem permissão de escrita"
  rescue => e
    puts "   ❌ ERRO: Não é possível escrever na pasta storage/"
    puts "   #{e.message}"
  end
else
  puts "\n❌ ERRO: Pasta storage/ não existe!"
  puts "   Criando pasta..."
  FileUtils.mkdir_p(storage_path)
  puts "   ✅ Pasta criada: #{storage_path}"
end

puts "\n" + "=" * 80
puts "PRÓXIMOS PASSOS"
puts "=" * 80
puts "1. Se houver blobs órfãos, execute: bundle exec ruby fix_active_storage_images.rb"
puts "2. Ou recrie as imagens manualmente via admin panel"
puts "3. Verifique se o Docker volume está montado: docker-compose.yml"
puts "4. Em produção, verifique se a pasta storage/ persiste entre deploys"
puts "=" * 80
