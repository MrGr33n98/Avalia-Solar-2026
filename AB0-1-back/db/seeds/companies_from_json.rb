# db/seeds/companies_from_json.rb
require 'json'

puts "\n🏢 Carregando empresas do arquivo JSON..."

json_path = Rails.root.join('db', 'seed_data', 'companies.json')

unless File.exist?(json_path)
  puts "❌ Arquivo #{json_path} não encontrado!"
  return
end

companies_data = JSON.parse(File.read(json_path))
puts "📊 Encontradas #{companies_data.size} empresas para processar."

# Garante que temos categorias básicas para vincular se não houver nenhuma
default_category = Category.find_by(seo_url: 'energia-solar') || Category.first

companies_data.each do |data|
  # Primeiro criamos/atualizamos como 'pending' para evitar validações de 'active'
  company = Company.find_or_initialize_by(slug: data['slug'])
  
  # Atributos básicos
  company.name = data['name']
  company.description = data['description']
  company.website = data['website']
  company.email = data['email'] || "contato@#{data['slug']}.com.br" # Email obrigatório para ativação
  company.email_public = data['email_public'] || company.email
  
  # Limpeza de telefone (apenas dígitos)
  phone_digits = data['phone']&.gsub(/\D/, '')
  company.phone = phone_digits if phone_digits.present?
  
  whatsapp_digits = data['whatsapp']&.gsub(/\D/, '')
  company.whatsapp = whatsapp_digits if whatsapp_digits.present?
  
  company.city = data['city']
  company.state = data['state']
  company.status = 'pending' # Começa como pending para salvar sem erros de ativação
  company.verified = data['verified'] || false
  company.featured = false # Só pode ser featured se for active
  company.moderation_status = data['moderation_status'] || 'approved'
  
  # Campos adicionais
  company.address = "#{data['city']}, #{data['state']}" if data['city'] && data['state']
  
  # Salva inicialmente como pending
  if company.save
    puts "✅ Empresa criada/atualizada (pending): #{company.name}"
    
    # Processar categorias/serviços
    has_categories = false
    if data['services_offered'].present?
      data['services_offered'].each do |service_slug|
        category = Category.find_by(seo_url: service_slug) || Category.find_by(name: service_slug)
        if category
          unless company.categories.include?(category)
            company.categories << category
          end
          has_categories = true
        end
      end
    end
    
    # Se não vinculou nenhuma, usa a default
    if !has_categories && default_category
      company.categories << default_category unless company.categories.include?(default_category)
    end

    # Agora tenta ativar se o status original for 'active'
    if data['status'] == 'active'
      company.status = 'active'
      company.featured = data['featured'] || false
      
      if company.save
        puts "   🚀 Ativada com sucesso!"
      else
        puts "   ⚠️ Erro ao ativar #{company.name}: #{company.errors.full_messages.join(', ')}"
        # Mantém como pending se falhar na ativação
        company.update_columns(status: 'pending', featured: false)
      end
    end
  else
    puts "❌ Erro fatal ao criar empresa #{data['name']}: #{company.errors.full_messages.join(', ')}"
  end
end

puts "🏁 Importação de empresas concluída!"
