#!/usr/bin/env ruby
# Script para adicionar verified_badge a empresas verificadas

require_relative 'config/environment'

# SVG de um selo simples em base64 (ou você pode usar uma imagem real)
BADGE_SVG = <<~SVG.freeze
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="45" fill="#4CAF50" stroke="#2E7D32" stroke-width="2"/>
    <path d="M 40 55 L 50 65 L 65 40" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
SVG

# Criar arquivo temporário com o SVG
temp_file = Rails.root.join('tmp', 'verified_badge.svg')
File.write(temp_file, BADGE_SVG)

puts 'Adicionando verified_badge a empresas verificadas...'

Company.where(verified: true).each do |company|
  if company.verified_badge.attached?
    puts "- Badge já existe: #{company.name} (ID: #{company.id})"
  else
    File.open(temp_file) do |file|
      company.verified_badge.attach(
        io: file,
        filename: 'verified_badge.svg',
        content_type: 'image/svg+xml'
      )
    end
    puts "✓ Badge adicionado: #{company.name} (ID: #{company.id})"
  end
end

FileUtils.rm_f(temp_file)
puts 'Concluído!'
