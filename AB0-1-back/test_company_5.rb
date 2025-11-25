#!/usr/bin/env ruby
# frozen_string_literal: true

require_relative 'config/environment'

puts "=" * 80
puts "Testando Company ID 5"
puts "=" * 80
puts

company = Company.find_by(id: 5)

if company.nil?
  puts "❌ ERRO: Company com ID 5 não existe!"
  puts
  puts "Companies disponíveis:"
  Company.limit(10).each do |c|
    puts "  ID: #{c.id} - #{c.name}"
  end
  exit 1
end

puts "✅ Company encontrada: #{company.name}"
puts "-" * 80
puts

# Verificar banner
puts "📸 BANNER:"
if company.banner.attached?
  puts "  ✅ Banner ANEXADO"
  puts "  Filename: #{company.banner.filename}"
  puts "  Content Type: #{company.banner.content_type}"
  puts "  Size: #{(company.banner.byte_size / 1024.0).round(2)} KB"
  
  begin
    banner_url = Rails.application.routes.url_helpers.rails_blob_url(company.banner, only_path: false)
    puts "  URL Gerada: #{banner_url}"
  rescue => e
    puts "  ❌ Erro ao gerar URL: #{e.message}"
  end
else
  puts "  ❌ Banner NÃO ANEXADO"
end

puts

# Verificar logo
puts "🏢 LOGO:"
if company.logo.attached?
  puts "  ✅ Logo ANEXADO"
  puts "  Filename: #{company.logo.filename}"
  puts "  Content Type: #{company.logo.content_type}"
  puts "  Size: #{(company.logo.byte_size / 1024.0).round(2)} KB"
  
  begin
    logo_url = Rails.application.routes.url_helpers.rails_blob_url(company.logo, only_path: false)
    puts "  URL Gerada: #{logo_url}"
  rescue => e
    puts "  ❌ Erro ao gerar URL: #{e.message}"
  end
else
  puts "  ❌ Logo NÃO ANEXADO"
end

puts
puts "=" * 80
puts "SERIALIZER OUTPUT (O QUE A API RETORNA):"
puts "=" * 80

serializer = CompanySerializer.new(company)
serialized = serializer.as_json

puts "banner_url: #{serialized[:banner_url] || 'nil'}"
puts "logo_url: #{serialized[:logo_url] || 'nil'}"

puts
puts "=" * 80
puts "JSON COMPLETO:"
puts "=" * 80
require 'json'
puts JSON.pretty_generate(serialized)

puts
puts "=" * 80
puts "CONCLUSÃO:"
puts "=" * 80

if company.banner.attached? && company.logo.attached?
  puts "✅ Company tem banner e logo anexados"
  puts "✅ As URLs devem aparecer na API"
  puts
  puts "Se as imagens não aparecem no frontend:"
  puts "1. Verifique se as URLs retornadas são acessíveis"
  puts "2. Verifique o console do navegador (F12)"
  puts "3. Verifique erros de CORS"
elsif company.banner.attached?
  puts "⚠️  Company tem banner mas NÃO tem logo"
  puts "   Adicione um logo no admin"
elsif company.logo.attached?
  puts "⚠️  Company tem logo mas NÃO tem banner"
  puts "   Adicione um banner no admin"
else
  puts "❌ Company NÃO tem banner nem logo anexados!"
  puts
  puts "SOLUÇÃO:"
  puts "1. Acesse: http://localhost:3001/admin/companies/5/edit"
  puts "2. Faça upload do banner e logo"
  puts "3. Clique em 'Update Company'"
end
