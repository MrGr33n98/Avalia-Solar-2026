# Teste para verificar se as imagens estão sendo retornadas corretamente
require_relative 'config/environment'

puts "=== Teste de Imagens de Empresas ==="

# Pegar uma categoria específica (paineis-solares)
category = Category.find_by(seo_url: 'paineis-solares')
if category
  puts "Categoria encontrada: #{category.name} (ID: #{category.id})"
  
  companies = category.companies.where(status: 'active')
  puts "Empresas encontradas: #{companies.count}"
  
  companies.each do |company|
    puts "\n--- Empresa: #{company.name} (ID: #{company.id}) ---"
    
    # Verificar attachments
    puts "Banner attached? #{company.banner.attached?}"
    puts "Logo attached? #{company.logo.attached?}"
    
    if company.banner.attached?
      puts "Banner filename: #{company.banner.filename}"
      puts "Banner content_type: #{company.banner.content_type}"
    end
    
    if company.logo.attached?
      puts "Logo filename: #{company.logo.filename}"
      puts "Logo content_type: #{company.logo.content_type}"
    end
    
    # Testar serializer
    serializer = CompanySerializer.new(company)
    data = serializer.as_json
    
    puts "Banner URL do serializer: #{data[:banner_url]}"
    puts "Logo URL do serializer: #{data[:logo_url]}"
    
    # Verificar todos os campos retornados
    puts "Campos disponíveis: #{data.keys.join(', ')}"
  end
else
  puts "Categoria 'paineis-solares' não encontrada"
end

puts "\n=== Fim do Teste ==="