Rails.application.routes.append do
  scope '/api/v1/sales', as: 'sales_v3_security' do
    resources :api_keys, only: %i[index create destroy], controller: 'api/v1/sales/api_keys'
    resources :tracking_events, only: :create, controller: 'api/v1/sales/tracking_events'
  end
end
