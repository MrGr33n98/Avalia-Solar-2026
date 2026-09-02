Rails.application.config.to_prepare do
  next if Rails.application.routes.named_routes.route_defined?(:sales_v3_products)

  Rails.application.routes.append do
    scope '/api/v1/sales', as: 'sales_v3_revenue' do
      resources :products, only: %i[index create], controller: 'api/v1/sales/products'
      resources :quotes, only: %i[index create update], controller: 'api/v1/sales/quotes'
    end
  end
end
