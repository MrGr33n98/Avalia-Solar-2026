Rails.application.routes.append do
  scope '/api/v1/sales', as: 'sales_v3_user_roles' do
    post 'users/:user_id/roles/:role_id', to: 'api/v1/sales/user_roles#create'
    delete 'users/:user_id/roles/:role_id', to: 'api/v1/sales/user_roles#destroy'
  end
end
