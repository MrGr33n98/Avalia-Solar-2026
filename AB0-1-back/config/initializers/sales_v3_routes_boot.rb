# Registra endpoints V3 durante boot, inclusive em comandos rails routes.
Rails.application.routes.append do
  scope '/api/v1/sales', as: 'sales_v3_boot' do
    resources :notes, only: %i[index create update], controller: 'api/v1/sales/notes'
    resources :taxonomies, only: %i[index create], controller: 'api/v1/sales/taxonomies'
    resources :products, only: %i[index create], controller: 'api/v1/sales/products'
    resources :quotes, only: %i[index create update], controller: 'api/v1/sales/quotes'
  end
end
