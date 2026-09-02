Rails.application.routes.append do
  scope '/api/v1/sales', as: 'sales_v3_rbac' do
    resources :roles, only: %i[index create], controller: 'api/v1/sales/rbac'
  end
end
