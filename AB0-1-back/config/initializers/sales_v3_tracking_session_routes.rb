Rails.application.routes.append do
  scope '/api/v1/sales', as: 'sales_v3_tracking_sessions' do
    resources :tracking_sessions, only: %i[create update], controller: 'api/v1/sales/tracking_sessions'
  end
end
