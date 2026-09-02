Rails.application.config.to_prepare do
  next if Rails.application.routes.named_routes.route_defined?(:sales_v3_taxonomies)

  Rails.application.routes.append do
    scope '/api/v1/sales', as: 'sales_v3_taxonomies' do
      resources :taxonomies, only: %i[index create], controller: 'api/v1/sales/taxonomies'
    end
  end
end
