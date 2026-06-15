# frozen_string_literal: true

# config/initializers/searchkick.rb
# Configuração de conexão com o OpenSearch/Elasticsearch

opensearch_url = ENV['OPENSEARCH_URL'] || ENV['ELASTICSEARCH_URL'] || 'http://localhost:9200'

# Inicializa o cliente do Searchkick
Searchkick.client = Elasticsearch::Client.new(
  url: opensearch_url,
  retry_on_failure: true,
  transport_options: {
    request: { timeout: 2 } # Timeout curto para evitar travamento em falhas
  }
)

# Desativa callbacks automáticos se a busca estiver desabilitada (ex: dev local sem Docker)
if ENV['SEARCH_ENABLED'] != 'true'
  Searchkick.disable_callbacks
  Rails.logger.info "[Searchkick] Callbacks automáticos DESATIVADOS (SEARCH_ENABLED = false)"
else
  Rails.logger.info "[Searchkick] Conectado ao OpenSearch em: #{opensearch_url}"
end
