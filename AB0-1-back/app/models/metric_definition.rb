class MetricDefinition
  CATALOG = {
    'profile_conversion_rate' => {
      name: 'Taxa de conversão do perfil',
      description: 'Percentual de visitantes que se tornam leads',
      formula: 'leads_generated / profile_views * 100',
      unit: '%',
      source: 'analytics',
      aggregation: 'avg',
      window: 'selectable',
      timezone: 'America/Sao_Paulo',
      freshness: '15_minutes',
      minimum_sample_size: 10,
      premium_feature: false
    },
    'profile_views' => {
      name: 'Visualizações do perfil',
      description: 'Total de visualizações no perfil público',
      formula: 'count(page_views)',
      unit: 'number',
      source: 'analytics',
      aggregation: 'sum',
      window: 'selectable',
      timezone: 'America/Sao_Paulo',
      freshness: 'realtime',
      minimum_sample_size: 0,
      premium_feature: false
    }
    # Add other metrics here as needed
  }.freeze

  def self.all
    CATALOG
  end

  def self.get(key)
    CATALOG[key.to_s]
  end
end
