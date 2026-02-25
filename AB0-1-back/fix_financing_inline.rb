#!/usr/bin/env ruby
# Fix rápido via Rails console inline

puts '=== FIX FINANCING - Execução Direta ==='

# Verifica company
begin
  company = Company.find(1)
  puts "✓ Company encontrada: #{company.name}"
rescue ActiveRecord::RecordNotFound
  puts '✗ Company ID 1 não encontrada. Criando...'
  company = Company.create!(
    name: 'Empresa Teste Solar',
    email: 'contato@teste.com',
    phone: '(48) 99999-9999',
    city: 'Florianópolis',
    state: 'SC',
    status: :active
  )
  puts "✓ Company criada: ID #{company.id}"
end

# Verifica e cria financing options
existing = company.financing_options.count
puts "Opções existentes: #{existing}"

if existing.zero?
  puts 'Criando opções de financiamento...'

  # PF
  opt1 = company.financing_options.create!(
    institution_name: 'Banco Solar Brasil',
    credit_line: 'Crédito Solar Residencial',
    target_audience: 'PF',
    max_term_months: 60,
    grace_period_months: 3,
    interest_rate_percent: 1.39,
    interest_rate_details: 'Taxa a partir de 1,39% ao mês',
    active: true
  )
  puts "✓ Criado: #{opt1.institution_name} (PF)"

  # PJ
  opt2 = company.financing_options.create!(
    institution_name: 'Banco Verde',
    credit_line: 'Linha Empresarial',
    target_audience: 'PJ',
    max_term_months: 84,
    grace_period_months: 6,
    interest_rate_percent: 1.89,
    interest_rate_details: 'Taxa a partir de 1,89% ao mês',
    active: true
  )
  puts "✓ Criado: #{opt2.institution_name} (PJ)"

  # Rural
  opt3 = company.financing_options.create!(
    institution_name: 'Banco do Agronegócio',
    credit_line: 'Energia Solar Rural',
    target_audience: 'Rural',
    max_term_months: 72,
    grace_period_months: 12,
    interest_rate_percent: 0.99,
    interest_rate_details: 'Taxa subsidiada 0,99% ao mês',
    active: true
  )
  puts "✓ Criado: #{opt3.institution_name} (Rural)"
end

# Verifica resultado
total = company.financing_options.count
active = company.financing_options.active_only.count
pf = company.financing_options.active_only.where(target_audience: 'PF').count
pj = company.financing_options.active_only.where(target_audience: 'PJ').count
rural = company.financing_options.active_only.where(target_audience: 'Rural').count

puts "\n=== RESULTADO ==="
puts "Total de opções: #{total}"
puts "Opções ativas: #{active}"
puts "  PF: #{pf}"
puts "  PJ: #{pj}"
puts "  Rural: #{rural}"

if active.positive?
  puts "\n✅ SUCESSO! Opções criadas."
  puts "\nAgora:"
  puts '1. Reinicie o Rails server'
  puts '2. Teste: http://localhost:3001/api/v1/companies/1/financing_options/simulate?amount=50000&audience=pf&months=60'
else
  puts "\n✗ ERRO: Nenhuma opção foi criada!"
end
