# Script para criar opções de financiamento de teste
# Execute com: rails runner create_financing_test_data.rb

puts "=== Criando Opções de Financiamento de Teste ==="
puts ""

# Encontrar empresas
companies = Company.limit(10).to_a

if companies.empty?
  puts "⚠️  Nenhuma empresa encontrada. Crie empresas primeiro!"
  exit
end

puts "Empresas encontradas: #{companies.count}"
puts ""

companies.each do |company|
  puts "Processando empresa: #{company.name} (ID: #{company.id})"
  
  # Verificar se já tem opções
  existing_count = company.financing_options.count
  
  if existing_count > 0
    puts "  ✓ Já possui #{existing_count} opções. Pulando..."
    next
  end
  
  # Criar 3 opções de financiamento para cada empresa
  
  # Opção 1: Pessoa Física - Taxa baixa
  option1 = company.financing_options.create!(
    institution_name: "Banco Solar Brasil",
    credit_line: "Crédito Solar Residencial",
    target_audience: "PF",
    max_term_months: 60,
    grace_period_months: 3,
    interest_rate_percent: 1.39,
    interest_rate_details: "Taxa a partir de 1,39% ao mês. Sujeito a aprovação de crédito.",
    active: true
  )
  puts "  ✓ Criado: #{option1.institution_name} (PF) - #{option1.interest_rate_percent}% a.m."
  
  # Opção 2: Pessoa Jurídica - Prazo longo
  option2 = company.financing_options.create!(
    institution_name: "Banco Verde",
    credit_line: "Linha Empresarial Sustentável",
    target_audience: "PJ",
    max_term_months: 84,
    grace_period_months: 6,
    interest_rate_percent: 1.89,
    interest_rate_details: "Taxa a partir de 1,89% ao mês para empresas. Carência de 6 meses.",
    active: true
  )
  puts "  ✓ Criado: #{option2.institution_name} (PJ) - #{option2.interest_rate_percent}% a.m."
  
  # Opção 3: Rural - Condições especiais
  option3 = company.financing_options.create!(
    institution_name: "Banco do Agronegócio",
    credit_line: "Energia Solar Rural",
    target_audience: "Rural",
    max_term_months: 72,
    grace_period_months: 12,
    interest_rate_percent: 0.99,
    interest_rate_details: "Taxa subsidiada de 0,99% ao mês para produtores rurais. Carência de 12 meses.",
    active: true
  )
  puts "  ✓ Criado: #{option3.institution_name} (Rural) - #{option3.interest_rate_percent}% a.m."
  
  puts "  Total criado: 3 opções"
  puts ""
end

puts "=== Resumo ==="
total_options = FinancingOption.count
active_options = FinancingOption.where(active: true).count

puts "Total de opções de financiamento: #{total_options}"
puts "Opções ativas: #{active_options}"
puts ""

# Estatísticas por público
FinancingOption::TARGET_AUDIENCES.each do |audience|
  count = FinancingOption.where(target_audience: audience, active: true).count
  puts "#{audience}: #{count} opções"
end

puts ""
puts "✅ Seed de financiamento concluído!"
