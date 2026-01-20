#!/usr/bin/env ruby
# Script de diagnóstico para debugging de erros 500 em financing

require 'bundler/setup'
require File.expand_path('../config/environment', __dir__)

puts "=== Diagnóstico de Financiamento - Company ID: 1 ==="
puts ""

begin
  company = Company.find(1)
  puts "✓ Company encontrada: #{company.name}"
  puts ""
  
  financing_options = company.financing_options
  puts "Total de opções de financiamento: #{financing_options.count}"
  puts "Opções ativas: #{financing_options.active_only.count}"
  puts ""
  
  if financing_options.any?
    puts "Opções disponíveis:"
    financing_options.each do |opt|
      puts "  ID: #{opt.id}"
      puts "  Instituição: #{opt.institution_name}"
      puts "  Linha: #{opt.credit_line}"
      puts "  Público: #{opt.target_audience}"
      puts "  Taxa: #{opt.interest_rate_percent}%"
      puts "  Prazo máx: #{opt.max_term_months} meses"
      puts "  Ativa: #{opt.active}"
      puts "  ---"
    end
  else
    puts "⚠ PROBLEMA: Nenhuma opção de financiamento cadastrada!"
    puts ""
    puts "Criando opção de teste..."
    
    test_option = company.financing_options.create!(
      institution_name: "Banco Test",
      credit_line: "Crédito Solar",
      target_audience: "PF",
      max_term_months: 60,
      grace_period_months: 0,
      interest_rate_percent: 1.5,
      interest_rate_details: "Taxa de 1.5% ao mês",
      active: true
    )
    
    puts "✓ Opção de teste criada (ID: #{test_option.id})"
  end
  
  puts ""
  puts "=== Testando Simulação ==="
  
  # Test params
  amount = 50000.0
  months = 60
  audience = "pf"
  
  puts "Parâmetros:"
  puts "  amount: #{amount}"
  puts "  months: #{months}"
  puts "  audience: #{audience}"
  puts ""
  
  # Normalize audience
  normalized = audience.to_s.strip.downcase
  normalized = 'PF' if %w[pf pessoa_fisica fisica].include?(normalized)
  normalized = 'PJ' if %w[pj pessoa_juridica juridica].include?(normalized)
  normalized = 'Rural' if %w[rural campo agro].include?(normalized)
  
  puts "Audience normalizada: #{normalized}"
  puts ""
  
  scope = company.financing_options.active_only
  scope = scope.where(target_audience: normalized) if normalized.present?
  
  options = scope.to_a
  puts "Opções encontradas no scope: #{options.count}"
  
  if options.empty?
    puts "⚠ PROBLEMA: Nenhuma opção encontrada com os filtros aplicados!"
    puts ""
    puts "Opções disponíveis (sem filtro de audience):"
    company.financing_options.active_only.each do |opt|
      puts "  ID: #{opt.id} - Público: #{opt.target_audience}"
    end
  else
    puts ""
    puts "Calculando simulação..."
    
    results = options.map do |o|
      rate_percent = (o.interest_rate_percent || 0).to_f
      i = rate_percent / 100.0
      
      monthly_payment =
        if i.positive?
          denom = (1 - (1 + i) ** (-months))
          denom.zero? ? 0.0 : (amount * i / denom)
        else
          months.zero? ? 0.0 : (amount / months.to_f)
        end
      
      total_cost = monthly_payment * months
      cet_annual_percent = i.positive? ? (((1 + i) ** 12) - 1) * 100.0 : 0.0
      
      {
        id: o.id,
        institution_name: o.institution_name,
        monthly_payment: monthly_payment.round(2),
        total_cost: total_cost.round(2),
        cet_annual_percent: cet_annual_percent.round(2)
      }
    end
    
    puts ""
    puts "Resultados da simulação:"
    results.each do |r|
      puts "  Instituição: #{r[:institution_name]}"
      puts "  Parcela mensal: R$ #{r[:monthly_payment]}"
      puts "  Custo total: R$ #{r[:total_cost]}"
      puts "  CET anual: #{r[:cet_annual_percent]}%"
      puts "  ---"
    end
    
    puts ""
    puts "✓ Simulação executada com sucesso!"
  end
  
rescue ActiveRecord::RecordNotFound => e
  puts "✗ ERRO: Company ID 1 não encontrada!"
  puts "Erro: #{e.message}"
  puts ""
  puts "Companies disponíveis:"
  Company.limit(5).each do |c|
    puts "  ID: #{c.id} - #{c.name}"
  end
rescue StandardError => e
  puts "✗ ERRO INESPERADO:"
  puts "Tipo: #{e.class}"
  puts "Mensagem: #{e.message}"
  puts ""
  puts "Backtrace:"
  puts e.backtrace.first(10).join("\n")
end

puts ""
puts "=== Fim do Diagnóstico ==="
