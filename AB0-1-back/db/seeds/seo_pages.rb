# Seed para testar SEO Programático
category = Category.first || Category.create!(name: 'Painéis Solares', seo_url: 'solar-panels', description: 'Melhores painéis do mercado')

SeoLandingPage.find_or_create_by!(slug: 'paineis-solares-em-sorocaba') do |page|
  page.category = category
  page.city_name = 'Sorocaba'
  page.state_abbr = 'SP'
  page.metadata_cache = {
    solar_radiation: 5.4,
    estimated_roi: 4.2,
    avg_price_per_kw: 3500,
    faq: [
      { question: 'Vale a pena em Sorocaba?', answer: 'Sim, a irradiação é alta.' },
      { question: 'Quanto custa?', answer: 'O preço médio é R$ 3.500/kWp.' }
    ]
  }
end

puts "✅ SEO Page Seeded: /solucoes/paineis-solares-em-sorocaba"
