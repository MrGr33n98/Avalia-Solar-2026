# frozen_string_literal: true

# scripts/ranking-v2/coverage_reconciliation.rb
# Reconciliação read-only / dry-run entre coverage legada (Company) e CompanyServiceArea.
# Execução: rails runner scripts/ranking-v2/coverage_reconciliation.rb [options]
# NENHUMA ESCRITA É EXECUTADA NO BANCO DE DADOS.

require 'optparse'
require 'json'

options = {
  limit: nil,
  output: nil,
  verbose: false
}

OptionParser.new do |opts|
  opts.banner = 'Uso: rails runner scripts/ranking-v2/coverage_reconciliation.rb [opções]'

  opts.on('-l', '--limit N', Integer, 'Limitar a N empresas') do |l|
    options[:limit] = l
  end

  opts.on('-o', '--output PATH', String, 'Caminho para salvar o relatório JSON sanitizado') do |o|
    options[:output] = o
  end

  opts.on('-v', '--verbose', 'Exibir detalhes por empresa') do
    options[:verbose] = true
  end
end.parse!

puts '=== INICIANDO RECONCILIAÇÃO DE COBERTURA (DRY-RUN / READ-ONLY) ==='
puts "Data/Hora: #{Time.now.utc.iso8601}"
puts 'Nenhuma modificação será feita no banco de dados.'
puts '================================================================='

scope = Company.order(:id)
scope = scope.limit(options[:limit]) if options[:limit]

total = scope.count
puts "Total de empresas a processar: #{total}"

counts = Hash.new(0)
flag_counts = Hash.new(0)
sampled_divergences = []

scope.find_each.with_index do |company, idx|
  result = Coverage::ReconciliationClassifier.classify(company)

  counts[result.status] += 1
  result.flags.each { |f| flag_counts[f] += 1 }

  if result.status == :divergent && sampled_divergences.size < 10
    sampled_divergences << {
      company_id: company.id,
      flags: result.flags,
      divergence: result.divergence_details
    }
  end

  if options[:verbose] && (idx < 20 || (idx % 500).zero?)
    puts "[#{idx + 1}/#{total}] Empresa ID=#{company.id}: #{result.status} (Flags: #{result.flags.join(', ')})"
  end
end

puts "\n=== RESUMO AGREGADO DE COBERTURA ==="
counts.each do |status, count|
  pct = total.positive? ? ((count.to_f / total) * 100).round(2) : 0
  puts "  - #{status.to_s.ljust(15)}: #{count.to_s.rjust(6)} (#{pct}%)"
end

puts "\n=== FLAGS DETECTADAS ==="
flag_counts.each do |flag, count|
  pct = total.positive? ? ((count.to_f / total) * 100).round(2) : 0
  puts "  - #{flag.to_s.ljust(15)}: #{count.to_s.rjust(6)} (#{pct}%)"
end

report = {
  generated_at: Time.now.utc.iso8601,
  mode: 'dry_run_read_only',
  total_companies: total,
  classification_counts: counts,
  flag_counts: flag_counts,
  sampled_divergences: sampled_divergences
}

if options[:output]
  File.write(options[:output], JSON.pretty_generate(report))
  puts "\nRelatório salvo com sucesso em: #{options[:output]}"
end

puts "\nReconciliação concluída com sucesso (sem writes)."
