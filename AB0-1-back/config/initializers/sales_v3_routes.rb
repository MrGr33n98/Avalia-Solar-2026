# Rotas V3 isoladas para manter compatibilidade com o arquivo principal de rotas.
Rails.application.config.to_prepare do
  next if Rails.application.routes.named_routes.route_defined?(:sales_v3_notes)

  Rails.application.routes.append do
    scope '/api/v1/sales', as: 'sales_v3' do
      resources :notes, only: %i[index create update], controller: 'api/v1/sales/notes'
    end
  end
end
