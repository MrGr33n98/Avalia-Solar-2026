Rails.application.routes.append do
  get '/api/v1/sales/attribution', to: 'api/v1/sales/attribution#index', as: 'sales_v3_attribution'
end
