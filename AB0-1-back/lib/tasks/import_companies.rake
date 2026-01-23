require 'open-uri'

namespace :import do
  desc "Importa empresas do JSON enriquecido com logos e categorias"
  task companies: :environment do
    json_path = Rails.root.join('lib', 'data', 'companies_enriched_final.json')
    
    unless File.exist?(json_path)
      puts "❌ Arquivo não encontrado em: #{json_path}"
      next
    end

    file_content = File.read(json_path)
    companies_data = JSON.parse(file_content)
    puts "🚀 Iniciando importação de #{companies_data.count} empresas..."

    companies_data.each do |data|
      # Busca por ID, CNPJ ou Nome
      company = Company.find_by(id: data['id']) || 
                Company.find_by(cnpj: data['cnpj']&.to_s&.gsub(/\D/, '')) || 
                Company.find_by(name: data['name'])
      
      if company.nil?
        company = Company.new(name: data['name'])
        puts "✨ Criando nova empresa: #{data['name']}"
      else
        puts "🔄 Atualizando empresa: #{company.name}"
      end

      # Atualiza atributos
      company.assign_attributes(
        cnpj:              data['cnpj']&.to_s&.gsub(/\D/, ''),
        address:           data['address'],
        latitude:          data['latitude'],
        longitude:         data['longitude'],
        website:           data['website'],
        phone:             data['phone']&.to_s&.gsub(/\D/, ''),
        whatsapp:          data['whatsapp']&.to_s&.gsub(/\D/, ''),
        rating_avg:        data['rating_avg'],
        rating_count:      data['rating_count'],
        description:       data['description'],
        city:              data['city'],
        state:             data['state']&.to_s&.strip&.upcase&.slice(0, 2),
        instagram:         data['instagram_url'] || data['instagram'],
        linkedin:          data['linkedin_url'] || data['linkedin'],
        facebook:          data['facebook_url'] || data['facebook'],
        moderation_status: data['moderation_status'] || 'approved',
        status:            data['status'] || 'active'
      )

      # Download do Logo (Se houver URL e não tiver logo anexo)
      if data['logo_url'].present? && !company.logo.attached?
        begin
          puts "  🖼️  Baixando logo para #{company.name}..."
          logo_file = URI.open(data['logo_url'], open_timeout: 5)
          company.logo.attach(
            io: logo_file, 
            filename: "logo_#{company.id || 'new'}.png", 
            content_type: 'image/png'
          )
        rescue => e
          puts "  ⚠️  Erro ao baixar logo: #{e.message}"
        end
      end

      if company.save(validate: false)
        # Associa Categorias
        if data['categories'].present?
          data['categories'].each do |cat_data|
            category = Category.find_by(id: cat_data['id']) || Category.find_by(name: cat_data['name'])
            if category && !company.categories.include?(category)
              company.categories << category
            end
          end
        end
        puts "✅ #{company.name} salva."
      else
        puts "❌ Erro: #{company.errors.full_messages.join(', ')}"
      end
    end
    puts "\n🏁 Concluído!"
  end
end