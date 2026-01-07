#!/usr/bin/env ruby
# Script para verificar e criar banners de teste

require_relative 'config/environment'

puts "=" * 80
puts "VERIFICAÇÃO DE BANNERS"
puts "=" * 80

# Verifica banners existentes
puts "\n1. Verificando banners existentes..."
total_banners = Banner.count
puts "   Total de banners: #{total_banners}"

active_banners = Banner.where(active: true).count
puts "   Banners ativos: #{active_banners}"

if Banner.column_names.include?('moderation_status')
  approved_banners = Banner.where(moderation_status: 'approved').count
  puts "   Banners aprovados: #{approved_banners}"
  
  currently_active = Banner.currently_active.count
  puts "   Banners currently_active (escopo): #{currently_active}"
end

# Lista banners por posição
puts "\n2. Banners por posição:"
%w[navbar sidebar categories_top].each do |position|
  count = Banner.where(position: position).count
  active_count = Banner.where(position: position, active: true).count
  puts "   - #{position}: #{count} (#{active_count} ativos)"
end

# Verifica se há banners em categories_top
categories_top_banners = Banner.currently_active.where(position: 'categories_top')
puts "\n3. Banners ativos em 'categories_top': #{categories_top_banners.count}"

if categories_top_banners.any?
  puts "   Listando:"
  categories_top_banners.each do |banner|
    puts "   - ID: #{banner.id}, Título: #{banner.title}, Status: #{banner.moderation_status rescue 'N/A'}"
  end
else
  puts "   ⚠️  PROBLEMA IDENTIFICADO: Não há banners ativos em 'categories_top'"
  puts "\n4. Criando banners de teste..."
  
  # Pega primeira categoria para associar
  category = Category.first
  
  if category
    begin
      # Cria banner de teste
      banner = Banner.new(
        title: "Banner Teste - Categorias Top",
        banner_type: "rectangular_large",
        position: "categories_top",
        link: "https://avaliasolar.com.br",
        active: true,
        category_id: category.id,
        sponsored: false
      )
      
      # Se existe moderation_status, define como approved
      if Banner.column_names.include?('moderation_status')
        banner.moderation_status = 'approved'
      end
      
      # Cria uma imagem de placeholder
      # Você precisará substituir por uma imagem real
      placeholder_path = Rails.root.join('public', 'placeholder-banner.jpg')
      
      if File.exist?(placeholder_path)
        banner.image.attach(
          io: File.open(placeholder_path),
          filename: 'placeholder-banner.jpg',
          content_type: 'image/jpeg'
        )
        
        if banner.save
          puts "   ✅ Banner criado com sucesso! ID: #{banner.id}"
        else
          puts "   ❌ Erro ao criar banner: #{banner.errors.full_messages.join(', ')}"
        end
      else
        puts "   ⚠️  Arquivo de imagem não encontrado: #{placeholder_path}"
        puts "   💡 Para criar banners, você precisa:"
        puts "      1. Adicionar uma imagem em: public/placeholder-banner.jpg"
        puts "      2. Ou criar banners via interface admin"
        puts "      3. Ou usar Active Storage para anexar imagens"
      end
    rescue => e
      puts "   ❌ Erro ao criar banner: #{e.message}"
      puts "   Stack trace: #{e.backtrace.first(5).join("\n   ")}"
    end
  else
    puts "   ❌ Nenhuma categoria encontrada no banco de dados"
  end
end

puts "\n" + "=" * 80
puts "RESUMO"
puts "=" * 80
puts "Para que os banners apareçam no frontend, eles precisam:"
puts "1. Ter active: true"
puts "2. Ter moderation_status: 'approved' (se a coluna existir)"
puts "3. Ter uma imagem anexada (via Active Storage)"
puts "4. Estar dentro do período de datas (se as colunas existirem)"
puts "5. Ter position: 'categories_top' para aparecer na página de categorias"
puts "\n💡 Acesse o admin panel para criar e gerenciar banners:"
puts "   https://api.avaliasolar.com.br/admin/banners"
puts "=" * 80
