Rails.application.routes.append do
  scope '/api/v1/sales', as: 'sales_v3_lgpd' do
    resources :consents, only: %i[index create], controller: 'api/v1/sales/consents'
  end
end
