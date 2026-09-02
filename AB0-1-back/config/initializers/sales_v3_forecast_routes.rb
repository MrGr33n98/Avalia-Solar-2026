Rails.application.routes.append do
  get '/api/v1/sales/forecast', to: 'api/v1/sales/forecast#index', as: 'sales_v3_forecast'
end
