namespace :dev do
  desc 'Create test company with verified badge'
  task create_test_company: :environment do
    # Criar categoria se não existir
    category = Category.find_or_create_by!(name: "Energia Solar") do |c|
      c.description = "Empresas de energia solar"
      c.status = 'active'
    end

    # Criar ou atualizar empresa (inicialmente inativa)
    company = Company.find_or_initialize_by(slug: "genial-solar")
    
    if company.new_record?
      company.name = "Genial Solar"
      company.description = "Empresa de energia solar"
      company.email = "contact@genial.com"
      company.email_public = "contact@genial.com"
      company.phone = "1133334444"
      company.state = "SP"
      company.city = "São Paulo"
      company.status = 'inactive'  # Start inactive
      company.save!
    end

    # Adicionar categoria
    company.categories << category unless company.categories.include?(category)
    
    # Agora marcar como verified e active
    company.update(verified: true, status: 'active')

    # Adicionar badge se não tiver
    unless company.verified_badge.attached?
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
      puts "✓ Badge adicionado à empresa!"
    end

    puts "✓ Empresa criada/atualizada: #{company.name} (ID: #{company.id})"
    puts "  Verified: #{company.verified}"
    puts "  Status: #{company.status}"
    puts "  Badge: #{company.verified_badge.attached?}"
    puts "  Acesse em: http://localhost:3000/companies/#{company.slug}"
  end
end
