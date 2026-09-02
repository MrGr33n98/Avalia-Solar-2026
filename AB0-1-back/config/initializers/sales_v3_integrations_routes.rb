Rails.application.routes.append do
  scope '/api/v1/sales', as: 'sales_v3_integrations' do
    resources :integrations, only: %i[index create], controller: 'api/v1/sales/integrations'
    resources :webhooks, only: %i[index create destroy], controller: 'api/v1/sales/webhooks'
  end
end
