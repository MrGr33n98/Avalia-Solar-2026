#!/usr/bin/env ruby
# Script simples para testar badges

require_relative 'config/environment'

puts "=== Analisando Empresa 794 ==="

company = Company.find(794)
puts "ID: #{company.id}"
puts "Nome: #{company.name}"
puts "Verified: #{company.verified.inspect}"
puts "Badge Attached: #{company.verified_badge.attached?}"

# Se não estiver verificada, vamos marcar como verificada
if !company.verified
  puts "\nMarcando como verificada..."
  company.update(verified: true)
  puts "✓ Atualizado!"
end

# Se não tiver badge, vamos adicionar um
if !company.verified_badge.attached?
  puts "\nAdicionando badge..."
  
  badge_svg = <<~SVG
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="#4CAF50" stroke="#2E7D32" stroke-width="2"/>
      <path d="M 40 55 L 50 65 L 65 40" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  SVG

  begin
    blob = ActiveStorage::Blob.create_and_upload!(
      io: StringIO.new(badge_svg),
      filename: 'verified_badge.svg',
      content_type: 'image/svg+xml'
    )
    company.verified_badge.attach(blob)
    puts "✓ Badge adicionado!"
  rescue => e
    puts "✗ Erro ao adicionar badge: #{e.message}"
  end
end

# Verificar resultado final
puts "\n=== Estado Final ==="
puts "Verified: #{company.reload.verified}"
puts "Badge Attached: #{company.verified_badge.attached?}"
puts "Badge URL seria: #{company.verified_badge.attached? ? 'SIM' : 'NÃO'}"
