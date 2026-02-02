# frozen_string_literal: true

require 'active_support/inflector'

def slugify(text)
  ActiveSupport::Inflector.transliterate(text.to_s)
                         .downcase
                         .gsub(/[']+/, '')
                         .gsub(/\W+/, ' ')
                         .strip
                         .gsub(' ', '-')
                         .gsub(/-+/, '-')
end

def create_category(attrs, parent = nil)
  name = attrs[:name]
  seo_url = attrs[:seo_url] || slugify(name)
  
  category = Category.find_or_initialize_by(seo_url: seo_url)
  
  category.assign_attributes({
    name: name,
    seo_title: attrs[:seo_title] || "Comprar #{name} | Avalia Solar",
    short_description: attrs[:short_description] || "Encontre #{name} com os melhores fornecedores do Brasil.",
    description: attrs[:description] || "#{name} de alta qualidade para o seu projeto de energia solar. Compare preços e especificações técnicas dos melhores fabricantes.",
    parent_id: parent&.id,
    kind: attrs[:kind] || "product",
    status: attrs[:status] || "active",
    featured: attrs[:featured] || false,
    permissions_config: attrs[:permissions_config] || {}
  })

  if category.save
    puts "✅ Categoria #{'  ' * (parent ? 1 : 0)}#{name} (#{seo_url})"
  else
    puts "❌ Erro ao salvar #{name}: #{category.errors.full_messages.join(', ')}"
  end
  
  category
end

puts "\n🚀 Seeding Solar Categories..."

# PAINÉIS
paineis = create_category(name: "Painéis")
create_category({ name: "Até 95Wp" }, paineis)
create_category({ name: "De 100Wp até 195Wp" }, paineis)
create_category({ name: "De 200Wp até 295Wp" }, paineis)
create_category({ name: "De 300Wp até 395Wp" }, paineis)
create_category({ name: "De 400Wp até 495Wp" }, paineis)
create_category({ name: "Acima de 500Wp" }, paineis)
create_category({ name: "Pallets Fechados" }, paineis)
create_category({ name: "Painel Solar Flexível" }, paineis)

# INVERSORES
inversores = create_category(name: "Inversores")
create_category({ name: "Off Grid - Senoidal Pura" }, inversores)
create_category({ name: "Off Grid - Inversor Carregador" }, inversores)
create_category({ name: "On Grid - Híbrido" }, inversores)
create_category({ name: "On Grid - String" }, inversores)
create_category({ name: "Micro Inversores" }, inversores)
create_category({ name: "Acessórios" }, inversores)

# CONTROLADORES
controladores = create_category(name: "Controladores")
create_category({ name: "Controlador MPPT" }, controladores)
create_category({ name: "Controlador PWM" }, controladores)
create_category({ name: "Acessórios" }, controladores)

# BATERIAS
baterias = create_category(name: "Baterias")
create_category({ name: "Baterias de Lítio" }, baterias)
create_category({ name: "Estacionárias de Chumbo-Ácido" }, baterias)

# BOMBAS
bombas = create_category(name: "Bombas")
create_category({ name: "Bomba Solar" }, bombas)
create_category({ name: "Kit Bomba Solar" }, bombas)
create_category({ name: "Inversor Drive p/ Bomba Comum (CA)" }, bombas)
create_category({ name: "Kit p/ Bomba Comum (CA)" }, bombas)
create_category({ name: "Acessórios" }, bombas)

# ACESSÓRIOS
acessorios = create_category(name: "Acessórios")
create_category({ name: "Cabos e Conectores" }, acessorios)
create_category({ name: "Estruturas de Montagem" }, acessorios)
create_category({ name: "Stringbox e Proteções" }, acessorios)

# KIT ON GRID
kit_on_grid = create_category(name: "Kit On Grid")
create_category({ name: "Micro Inversor" }, kit_on_grid)
create_category({ name: "Telha Cerâmica" }, kit_on_grid)
create_category({ name: "Telha Fibrocimento" }, kit_on_grid)
create_category({ name: "Telha Ondulada" }, kit_on_grid)
create_category({ name: "Laje" }, kit_on_grid)
create_category({ name: "Solo" }, kit_on_grid)
create_category({ name: "Sem Estrutura de Fixação" }, kit_on_grid)
create_category({ name: "Inversor Híbrido" }, kit_on_grid)
create_category({ name: "Inversor String" }, kit_on_grid)

# KIT OFF GRID
kit_off_grid = create_category(name: "Kit Off Grid")
create_category({ name: "Off Grid Padrão - Até 500Wp" }, kit_off_grid)
create_category({ name: "Off Grid Padrão - Até 1000Wp" }, kit_off_grid)
create_category({ name: "Off Grid Padrão - Acima de 1000Wp" }, kit_off_grid)
create_category({ name: "Com Inversor-Carregador" }, kit_off_grid)
create_category({ name: "Starlink" }, kit_off_grid)

puts "\n✨ Categories Seeding Done."
