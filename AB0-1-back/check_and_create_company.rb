#!/usr/bin/env ruby
require_relative 'config/environment'

puts "=== Listando Empresas ==="

companies = Company.limit(20)
if companies.empty?
  puts "Nenhuma empresa encontrada. Vou criar uma de teste..."
  
  # Primeiro criar uma categoria
  category = Category.find_or_create_by!(name: "Energia Solar") do |c|
    c.description = "Empresas de energia solar"
    c.status = 'active'
  end
  
  company = Company.create!(
    name: "Genial Solar",
    slug: "genial-solar",
    description: "Empresa de energia solar",
    email: "test@genial.com",
    email_public: "test@genial.com",
    phone: "1133334444",
    state: "SP",
    city: "São Paulo",
    verified: true,
    status: 'active'
  )
  
  company.categories << category
  
  # Adicionar badge
  badge_svg = <<~SVG
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="#4CAF50" stroke="#2E7D32" stroke-width="2"/>
      <path d="M 40 55 L 50 65 L 65 40" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  SVG

  blob = ActiveStorage::Blob.create_and_upload!(
    io: StringIO.new(badge_svg),
    filename: 'verified_badge.svg',
    content_type: 'image/svg+xml'
  )
  company.verified_badge.attach(blob)
  
  puts "✓ Criada empresa: #{company.name} (ID: #{company.id})"
else
  companies.each do |c|
    puts "ID: #{c.id}, Nome: #{c.name}, Verified: #{c.verified}, Badge: #{c.verified_badge.attached?}"
  end
  
  # Adicionar badge à primeira empresa verificada ou a todas
  companies.each do |company|
    if company.verified && !company.verified_badge.attached?
      puts "Adicionando badge a #{company.name}..."
      
      badge_svg = <<~SVG
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="#4CAF50" stroke="#2E7D32" stroke-width="2"/>
          <path d="M 40 55 L 50 65 L 65 40" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      SVG

      blob = ActiveStorage::Blob.create_and_upload!(
        io: StringIO.new(badge_svg),
        filename: 'verified_badge.svg',
        content_type: 'image/svg+xml'
      )
      company.verified_badge.attach(blob)
      puts "✓ Badge adicionado!"
    end
  end
end

