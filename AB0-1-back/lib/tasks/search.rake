# frozen_string_literal: true

namespace :search do
  desc 'Reindexa todas as empresas cadastradas no OpenSearch'
  task reindex_companies: :environment do
    puts '[Search Rake] Disparando reindexação de empresas...'
    
    # Se a busca estiver desativada localmente, ativamos temporariamente durante a task
    # caso o administrador execute de forma explícita no console ou container
    original_search_enabled = ENV['SEARCH_ENABLED']
    ENV['SEARCH_ENABLED'] = 'true'
    
    begin
      # Dispara o job de forma síncrona
      SearchReindexCompaniesJob.perform_now
      puts '[Search Rake] Reindexação concluída com sucesso!'
    rescue StandardError => e
      puts "[Search Rake] ERRO durante a reindexação: #{e.message}"
    ensure
      # Restaura o valor original da flag
      ENV['SEARCH_ENABLED'] = original_search_enabled
    end
  end
end
