Rails.application.routes.append do
  scope '/api/v1/sales', as: 'sales_v3_site_surveys' do
    resources :solar_projects, only: [] do
      resources :site_surveys, only: :create, controller: 'api/v1/sales/site_surveys'
    end
    resources :site_surveys, only: :update, controller: 'api/v1/sales/site_surveys'
  end
end
