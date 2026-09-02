Rails.application.routes.append do
  scope '/api/v1/sales', as: 'sales_v3_quote_items' do
    resources :quotes, only: [] do
      resources :items, only: %i[create destroy], controller: 'api/v1/sales/quote_items'
    end
  end
end
