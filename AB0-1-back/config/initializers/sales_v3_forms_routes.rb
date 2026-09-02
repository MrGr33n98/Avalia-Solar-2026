Rails.application.routes.append do
  scope '/api/v1/sales', as: 'sales_v3_forms' do
    resources :forms, only: :show, controller: 'api/v1/sales/forms' do
      post :submit, on: :member
    end
  end
end
