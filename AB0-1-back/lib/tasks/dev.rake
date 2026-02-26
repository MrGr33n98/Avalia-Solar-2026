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

  desc 'Create test companies with diverse ranking data for Sprint 1'
  task create_test_companies_with_ranking_data: :environment do
    cat_solar = Category.find_or_create_by!(name: "Energia Solar") { |c| c.status = 'active'; c.description = "Empresas de Energia Solar" }
    cat_ev = Category.find_or_create_by!(name: "Carregadores EV") { |c| c.status = 'active'; c.description = "Empresas de Mobilidade Elétrica" }
    
    companies_data = [
      { name: "Alpha Solar Pro", score: 100, sponsored: true, rating: 4.8, reviews: 150, categories: [cat_solar] },
      { name: "Beta Energy EV", score: 80, sponsored: true, rating: 4.5, reviews: 80, categories: [cat_solar, cat_ev] },
      { name: "Gamma Solar Solutions", score: 60, sponsored: false, rating: 4.2, reviews: 30, categories: [cat_solar] },
      { name: "Delta EV Chargers", score: 10, sponsored: false, rating: 4.0, reviews: 10, categories: [cat_ev] },
      { name: "Floripa Sun", score: 120, sponsored: false, rating: 4.9, reviews: 200, categories: [cat_solar] }
    ]

    companies_data.each do |data|
      company = Company.find_or_initialize_by(slug: data[:name].parameterize)
      
      # Set basic attributes first to pass validations
      company.name = data[:name]
      company.description = "Empresa de teste para o ranking do Sprint 1 em Florianópolis."
      company.email = "test@#{company.slug}.com"
      company.email_public = "test@#{company.slug}.com"
      company.phone = "48999998888"
      company.city = "Florianópolis"
      company.state = "SC"
      company.priority_score = data[:score]
      company.sponsored = data[:sponsored]
      company.rating_avg = data[:rating]
      company.rating_count = data[:reviews]
      company.status = 'active'
      company.verified = true
      
      # Add categories before saving
      data[:categories].each do |cat|
        company.categories << cat unless company.categories.include?(cat)
      end
      
      company.save!
      puts "✓ [#{data[:name]}] Score: #{company.priority_score} | Sponsored: #{company.sponsored} | Rating: #{company.rating_avg} (#{company.rating_count} reviews)"
    end
    puts "✅ Dados de ranking populados com sucesso para o Sprint 1!"
  end
end
