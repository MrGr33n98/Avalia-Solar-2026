module ReviewForms
  class TemplateCatalog
    TEMPLATES = [
      { key: 'general', name: 'Avaliação geral', description: 'Experiência completa com a empresa.', recommended_category_kind: nil, criteria: [], enabled_fields: %w[rating comment pros cons], recommended_copy: 'Conte como foi sua experiência.' },
      { key: 'post_installation', name: 'Pós-instalação', description: 'Avalie instalação, prazo e atendimento.', recommended_category_kind: 'residential_solar', criteria: %w[quality service deadline], enabled_fields: %w[rating criteria comment], recommended_copy: 'Como foi sua instalação?' },
      { key: 'after_sales', name: 'Pós-venda', description: 'Meça suporte e resolução após a compra.', recommended_category_kind: 'after_sales', criteria: %w[service resolution], enabled_fields: %w[rating criteria comment], recommended_copy: 'Como foi seu atendimento pós-venda?' },
      { key: 'commercial_solar', name: 'Solar comercial', description: 'Avalie projetos comerciais e industriais.', recommended_category_kind: 'commercial_solar', criteria: %w[quality deadline], enabled_fields: %w[rating criteria comment], recommended_copy: 'Como foi seu projeto solar?' },
      { key: 'maintenance', name: 'Manutenção', description: 'Avalie manutenção e continuidade do serviço.', recommended_category_kind: 'solar_maintenance', criteria: %w[service quality deadline], enabled_fields: %w[rating criteria comment], recommended_copy: 'Como foi a manutenção?' },
      { key: 'financing', name: 'Financiamento', description: 'Avalie clareza e experiência financeira.', recommended_category_kind: 'financing', criteria: %w[service clarity], enabled_fields: %w[rating criteria comment], recommended_copy: 'Como foi seu financiamento?' },
      { key: 'ev_charger', name: 'Carregador veicular', description: 'Avalie instalação e suporte do carregador.', recommended_category_kind: 'ev_charger', criteria: %w[quality service], enabled_fields: %w[rating criteria comment], recommended_copy: 'Como foi sua instalação?' }
    ].freeze

    def self.all
      TEMPLATES.deep_dup
    end

    def self.find(key)
      TEMPLATES.find { |template| template[:key] == key.to_s }&.deep_dup
    end
  end
end
