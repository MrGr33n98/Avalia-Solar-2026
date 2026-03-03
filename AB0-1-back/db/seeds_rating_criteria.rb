# db/seeds_rating_criteria.rb

puts "--- SEEDING RATING CRITERIA ---"

# 1. Categoria Raiz: Energia Solar
solar = Category.find_by(seo_url: 'energia-solar') || Category.find_by(name: 'Energia Solar')
if solar
  puts "Creating criteria for Energia Solar (ID: #{solar.id})"
  [
    { title: 'Qualidade Técnica', slug: 'qualidade_tecnica', position: 1, required: true },
    { title: 'Atendimento', slug: 'atendimento', position: 2, required: true },
    { title: 'Prazo de Entrega', slug: 'prazo', position: 3, required: true },
    { title: 'Custos e Transparência', slug: 'custo_beneficio', position: 4, required: false }
  ].each do |attr|
    solar.rating_criteria.find_or_create_by!(slug: attr[:slug]) do |rc|
      rc.title = attr[:title]
      rc.position = attr[:position]
      rc.required = attr[:required]
    end
  end
else
  puts "WARNING: Root category 'Energia Solar' not found."
end

# 2. Categoria Raiz: Mobilidade Elétrica
mobility = Category.find_by(seo_url: 'mobilidade-eletrica') || Category.find_by(name: 'Mobilidade Elétrica')
if mobility
  puts "Creating criteria for Mobilidade Elétrica (ID: #{mobility.id})"
  [
    { title: 'Velocidade de Carga', slug: 'velocidade_carga', position: 1, required: true },
    { title: 'Facilidade de Uso', slug: 'facilidade_uso', position: 2, required: true },
    { title: 'Confiabilidade', slug: 'confiabilidade', position: 3, required: true },
    { title: 'Atendimento', slug: 'atendimento', position: 4, required: false }
  ].each do |attr|
    mobility.rating_criteria.find_or_create_by!(slug: attr[:slug]) do |rc|
      rc.title = attr[:title]
      rc.position = attr[:position]
      rc.required = attr[:required]
    end
  end
else
  puts "WARNING: Root category 'Mobilidade Elétrica' not found."
end

puts "--- DONE ---"
