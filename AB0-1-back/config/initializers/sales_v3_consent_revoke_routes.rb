Rails.application.routes.append do
  scope '/api/v1/sales', as: 'sales_v3_consent_revoke' do
    patch 'consents/:consent_id/revoke', to: 'api/v1/sales/consent_revocations#update'
  end
end
