require 'rails_helper'

RSpec.describe 'Sales consent revocation', type: :request do
  it 'expõe rota de revogação' do
    expect(Rails.application.routes.routes.any? { |route| route.path.spec.to_s.include?('/api/v1/sales/consents/:consent_id/revoke') }).to be(true)
  end
end
