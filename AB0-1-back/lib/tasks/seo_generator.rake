namespace :seo do
  desc "Gera landing pages de SEO para as principais cidades do Brasil"
  task generate_pages: :environment do
    cities = [
      { name: "São Paulo", state: "SP" },
      { name: "Rio de Janeiro", state: "RJ" },
      { name: "Belo Horizonte", state: "MG" },
      { name: "Brasília", state: "DF" },
      { name: "Salvador", state: "BA" },
      { name: "Fortaleza", state: "CE" },
      { name: "Curitiba", state: "PR" },
      { name: "Manaus", state: "AM" },
      { name: "Recife", state: "PE" },
      { name: "Porto Alegre", state: "RS" },
      { name: "Belém", state: "PA" },
      { name: "Goiânia", state: "GO" },
      { name: "Guarulhos", state: "SP" },
      { name: "Campinas", state: "SP" },
      { name: "São Luís", state: "MA" },
      { name: "São Gonçalo", state: "RJ" },
      { name: "Maceió", state: "AL" },
      { name: "Duque de Caxias", state: "RJ" },
      { name: "Natal", state: "RN" },
      { name: "Teresina", state: "PI" },
      { name: "São Bernardo do Campo", state: "SP" },
      { name: "Nova Iguaçu", state: "RJ" },
      { name: "Campo Grande", state: "MS" },
      { name: "João Pessoa", state: "PB" },
      { name: "Santo André", state: "SP" },
      { name: "São José dos Campos", state: "SP" },
      { name: "Jaboatão dos Guararapes", state: "PE" },
      { name: "Osasco", state: "SP" },
      { name: "Ribeirão Preto", state: "SP" },
      { name: "Uberlândia", state: "MG" },
      { name: "Sorocaba", state: "SP" },
      { name: "Contagem", state: "MG" },
      { name: "Aracaju", state: "SE" },
      { name: "Feira de Santana", state: "BA" },
      { name: "Cuiabá", state: "MT" },
      { name: "Joinville", state: "SC" },
      { name: "Aparecida de Goiânia", state: "GO" },
      { name: "Londrina", state: "PR" },
      { name: "Juiz de Fora", state: "MG" },
      { name: "Porto Velho", state: "RO" },
      { name: "Ananindeua", state: "PA" },
      { name: "Serra", state: "ES" },
      { name: "Caxias do Sul", state: "RS" },
      { name: "Niterói", state: "RJ" },
      { name: "Belford Roxo", state: "RJ" },
      { name: "Macapá", state: "AP" },
      { name: "Campos dos Goytacazes", state: "RJ" },
      { name: "Florianópolis", state: "SC" },
      { name: "Vila Velha", state: "ES" },
      { name: "Mauá", state: "SP" }
    ]

    # Busca a categoria base (ajusta conforme seu banco)
    # Tenta por SEO URL primeiro, depois por nome
    category = Category.find_by(seo_url: 'energia-solar') || Category.find_by(name: 'Energia Solar')
    
    if category.nil?
      puts "ERRO: Categoria 'Energia Solar' não encontrada. Abortando."
      return
    end

    puts "Iniciando geração para #{cities.count} cidades na categoria #{category.name}..."

    created_count = 0
    skipped_count = 0

    cities.each do |city|
      city_name = city[:name]
      state_abbr = city[:state]
      
      # Gera o slug: paineis-solares-em-cidade-uf
      # Remove acentos e espaços
      slug_city = city_name.parameterize
      slug = "paineis-solares-em-#{slug_city}-#{state_abbr.downcase}"
      
      if SeoLandingPage.exists?(slug: slug)
        skipped_count += 1
        next
      end

      # Dados simulados baseados em médias brasileiras (podem ser enriquecidos via API externa depois)
      metadata = {
        solar_radiation: (4.5 + rand * 1.5).round(2), # 4.5 a 6.0 kWh/m2
        estimated_roi: (3.5 + rand * 1.5).round(1),    # 3.5 a 5 anos
        avg_price_per_kw: (3200 + rand * 800).round(2),
        faq: [
          {
            question: "Vale a pena instalar energia solar em #{city_name}?",
            answer: "Sim, #{city_name} possui excelentes índices de radiação solar, permitindo um retorno sobre o investimento em média de #{4 + rand(2)} anos."
          },
          {
            question: "Quanto custa um sistema solar médio em #{city_name}?",
            answer: "O custo varia conforme o consumo, mas sistemas residenciais padrão costumam variar entre R$ 15.000 e R$ 35.000 na região."
          }
        ]
      }

      SeoLandingPage.create!(
        slug: slug,
        category: category,
        city_name: city_name,
        state_abbr: state_abbr,
        metadata_cache: metadata
      )
      
      created_count += 1
      print "." if created_count % 5 == 0
    end

    puts "\nConcluído!"
    puts "Páginas criadas: #{created_count}"
    puts "Páginas puladas (já existiam): #{skipped_count}"
  end
end
