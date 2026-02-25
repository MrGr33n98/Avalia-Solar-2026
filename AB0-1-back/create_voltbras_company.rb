# Script para criar empresa Voltbras
# Execute com: docker-compose exec backend rails runner create_voltbras_company.rb

begin
  # Verificar se já existe
  existing_company = Company.find_by(cnpj: '31.341.201/0001-31')

  if existing_company
    puts "⚠️  Empresa Voltbras já existe! ID: #{existing_company.id}"
    puts "Nome: #{existing_company.name}"
    exit 0
  end

  # Criar a empresa
  company = Company.create!(
    name: 'Voltbras',
    description: 'Líder em tecnologia de software white-label para gestão de eletropostos e mobilidade elétrica.',
    website: 'https://voltbras.com.br',
    address: 'Rodovia SC 401, 4100, Km 4 - Saco Grande, Florianópolis, SC',
    cnpj: '31.341.201/0001-31',
    instagram: 'https://www.instagram.com/voltbras/',
    facebook: 'https://www.facebook.com/voltbras',
    linkedin: 'https://www.linkedin.com/company/voltbras',
    state: 'SC',
    city: 'Florianópolis',
    founded_year: 2018,
    project_types: ['Mobilidade Elétrica'],
    approved_at: Time.current,
    latitude: -27.5452879,
    longitude: -48.5013318,
    email: 'contato@voltbras.com.br',
    contact_email: 'contato@voltbras.com.br',
    status: 'approved',
    verified: true
  )

  puts '✅ Empresa Voltbras criada com sucesso!'
  puts "ID: #{company.id}"
  puts "Nome: #{company.name}"
  puts "CNPJ: #{company.cnpj}"
  puts "Status: #{company.status}"
rescue ActiveRecord::RecordInvalid => e
  puts '❌ Erro ao criar empresa:'
  puts e.message
  puts "\nErros de validação:"
  puts e.record.errors.full_messages.join("\n")
rescue StandardError => e
  puts '❌ Erro inesperado:'
  puts e.message
  puts e.backtrace.first(5).join("\n")
end
