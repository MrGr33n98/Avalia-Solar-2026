# Criar dados de teste no banco SQLite
require_relative 'config/environment'

puts "Creating test data..."

# Criar uma empresa de teste
company = Company.create!(
  name: "Empresa Teste",
  email: "test@empresa.com",
  phone: "(11) 1234-5678",
  website: "https://empresateste.com.br",
  description: "Empresa de teste para demonstração",
  status: Company.statuses[:active],
  featured: true,
  verified: true
)

puts "✅ Company created: #{company.name} (ID: #{company.id})"

# Criar alguns leads de teste (apenas com campos disponíveis)
leads_data = [
  {
    name: "João Silva",
    email: "joao@example.com",
    phone: "(11) 98765-4321",
    message: "Gostaria de saber mais sobre seus serviços"
  },
  {
    name: "Maria Santos",
    email: "maria@example.com",
    phone: "(21) 99876-5432",
    message: "Preciso de um orçamento para desenvolvimento web"
  }
]

leads_data.each do |lead_data|
  lead = Lead.create!(lead_data)
  puts "✅ Lead created: #{lead.name} - #{lead.email}"
end

puts "\n✅ Test data created successfully!"
puts "Company ID: #{company.id}"
puts "Total leads: #{Lead.count}"

# Testar se os dados estão acessíveis
puts "\nTesting data access..."
puts "Companies: #{Company.count}"
puts "Leads: #{Lead.count}"
puts "First lead: #{Lead.first&.name}"