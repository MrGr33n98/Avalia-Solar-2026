# frozen_string_literal: true

# scripts/ranking-v2/data_profiler.rb
# Profiler offline / read-only para calibração de dados (DATA-001 a DATA-006).
# NENHUMA ESCRITA É EXECUTADA NO BANCO DE DADOS.

require 'json'
require 'optparse'

options = {
  output: nil,
  min_state_threshold: 5
}

OptionParser.new do |opts|
  opts.banner = 'Uso: rails runner scripts/ranking-v2/data_profiler.rb [opções]'

  opts.on('-o', '--output PATH', String, 'Caminho para exportar o sumário estatístico em JSON') do |o|
    options[:output] = o
  end
end.parse!

puts '=== INICIANDO DATA PROFILER PARA RANKING V2 (READ-ONLY) ==='
puts "Data/Hora: #{Time.now.utc.iso8601}"
puts 'Ambiente: ' + (defined?(Rails) ? Rails.env : 'standalone')
puts '==========================================================='

# 1. Total de empresas ativas
total_active = Company.where(status: 'active').count
puts "Total de empresas ativas: #{total_active}"

# 2. Distribuição por Sede Estadual
state_hq_counts = Company.where(status: 'active')
                         .where.not(state: [nil, ''])
                         .group("UPPER(TRIM(state))")
                         .count
                         .sort_by { |_, count| -count }

puts "\nTop 10 Estados por Sede:"
state_hq_counts.first(10).each do |st, cnt|
  puts "  - #{st}: #{cnt} empresas"
end

# 3. Distribuição em Buckets Populacionais
buckets = {
  less_than_5: 0,
  between_5_and_9: 0,
  between_10_and_14: 0,
  between_15_and_19: 0,
  between_20_and_29: 0,
  between_30_and_49: 0,
  fifty_or_more: 0
}

state_hq_counts.each do |_, count|
  case count
  when 0..4 then buckets[:less_than_5] += 1
  when 5..9 then buckets[:between_5_and_9] += 1
  when 10..14 then buckets[:between_10_and_14] += 1
  when 15..19 then buckets[:between_15_and_19] += 1
  when 20..29 then buckets[:between_20_and_29] += 1
  when 30..49 then buckets[:between_30_and_49] += 1
  else buckets[:fifty_or_more] += 1
  end
end

puts "\nDistribuição de Estados por População de Sedes:"
buckets.each do |b, c|
  puts "  - #{b.to_s.ljust(20)}: #{c} estados"
end

# 4. Distribuição por CompanyServiceArea
areas_by_type = CompanyServiceArea.active.group(:coverage_type).count
puts "\nCompanyServiceArea ativos por tipo:"
areas_by_type.each do |ctype, cnt|
  puts "  - #{ctype.to_s.ljust(15)}: #{cnt} registros"
end

profile_report = {
  profiled_at: Time.now.utc.iso8601,
  total_active_companies: total_active,
  state_headquarters_distribution: state_hq_counts.to_h,
  population_buckets: buckets,
  service_areas_by_type: areas_by_type
}

if options[:output]
  File.write(options[:output], JSON.pretty_generate(profile_report))
  puts "\nRelatório estatístico salvo em: #{options[:output]}"
end

puts "\nProfiling de calibração de dados concluído com sucesso (sem writes)."
