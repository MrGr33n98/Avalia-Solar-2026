Rails.application.routes.append do
  scope '/api/v1/sales', as: 'sales_v3_tracking_identity' do
    post 'tracking/identify', to: 'api/v1/sales/tracking_identity#create'
  end
end
