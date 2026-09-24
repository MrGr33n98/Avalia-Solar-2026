# frozen_string_literal: true

# scripts/ranking-v2/shadow_runner.rb
# Runner offline/staging para auditoria shadow de cobertura entre legado e canônico.
# Execução: rails runner scripts/ranking-v2/shadow_runner.rb [opções]
# NENHUMA ESCRITA É EXECUTADA NO BANCO DE DADOS.

require 'optparse'
require 'json'

options = {
  sample_size: 50,
  output: nil,
  consumer: 'all'
}

OptionParser.new do |opts|
  opts.banner = 'Uso: rails runner scripts/ranking-v2/shadow_runner.rb [opções]'

  opts.on('-n', '--sample N', Integer, 'Tamanho da amostra de empresas (padrão: 50)') do |n|
    options[:sample_size] = n
  end

  opts.on('-c', '--consumer NOME', String, 'Consumidor específico ou all (search, leads, mobivolt, recommendation)') do |c|
    options[:consumer] = c
  end

  opts.on('-o', '--output PATH', String, 'Caminho para salvar o relatório de shadow em JSON') do |o|
    options[:output] = o
  end
end.parse!

puts '=== INICIANDO EXECUÇÃO DE SHADOW COMPARATOR (READ-ONLY) ==='
puts "Data/Hora: #{Time.now.utc.iso8601}"
puts "Amostra: #{options[:sample_size]} empresas | Consumidor: #{options[:consumer]}"
puts '=========================================================='

TEST_TARGETS = [
  { state: 'SC', city: 'Florianópolis' },
  { state: 'SC', city: 'Joinville' },
  { state: 'SP', city: 'São Paulo' },
  { state: 'SP', city: 'Campinas' },
  { state: 'PR', city: 'Curitiba' },
  { state: 'MG', city: 'Belo Horizonte' },
  { state: 'RJ', city: 'Rio de Janeiro' }
].freeze

consumers = if options[:consumer] == 'all'
              %w[search leads mobivolt recommendation]
            else
              [options[:consumer]]
            end

companies = Company.active.order(:id).limit(options[:sample_size]).to_a
puts "Empresas carregadas para análise: #{companies.size}"

results_summary = Hash.new { |h, k| h[k] = Hash.new(0) }
sampled_divergences = []

companies.each do |company|
  TEST_TARGETS.each do |target|
    consumers.each do |consumer|
      res = Coverage::ShadowComparator.compare(
        company,
        state: target[:state],
        city: target[:city],
        consumer: consumer
      )

      results_summary[consumer][res.match_type] += 1

      if %i[legacy_false_positive legacy_false_negative].include?(res.match_type) && sampled_divergences.size < 20
        sampled_divergences << {
          company_id: company.id,
          consumer: consumer,
          target: target,
          match_type: res.match_type,
          legacy_covered: res.legacy_covered,
          canonical_covered: res.canonical_covered,
          canonical_reason: res.canonical_reason
        }
      end
    end
  end
end

puts "\n=== RESUMO DOS RESULTADOS SHADOW POR CONSUMIDOR ==="
results_summary.each do |cons, counts|
  total_evals = counts.values.sum
  puts "\n[Consumidor: #{cons.upcase}] (Total de avaliações: #{total_evals})"
  counts.each do |match_type, count|
    pct = total_evals.positive? ? ((count.to_f / total_evals) * 100).round(2) : 0
    puts "  - #{match_type.to_s.ljust(25)}: #{count.to_s.rjust(6)} (#{pct}%)"
  end
end

report = {
  executed_at: Time.now.utc.iso8601,
  sample_companies_count: companies.size,
  test_targets: TEST_TARGETS,
  consumers_evaluated: consumers,
  summary_by_consumer: results_summary,
  sampled_divergences: sampled_divergences
}

if options[:output]
  File.write(options[:output], JSON.pretty_generate(report))
  puts "\nRelatório de shadow salvo com sucesso em: #{options[:output]}"
end

puts "\nExecução shadow finalizada sem qualquer escrita ou efeito colateral."
