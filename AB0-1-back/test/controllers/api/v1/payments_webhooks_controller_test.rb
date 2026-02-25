require 'test_helper'

class Api::V1::PaymentsWebhooksControllerTest < ActionDispatch::IntegrationTest
  test 'should activate banner subscription on paid webhook' do
    company = Company.create!(name: 'Empresa Teste', description: 'Descricao valida', status: 'pending',
                              email: 'a@a.com', email_public: 'a@a.com')

    offer = BannerOffer.create!(name: 'Oferta', price_cents: 1000, currency: 'BRL', duration_days: 30, rules_json: {},
                                active: true)
    sub = company.banner_subscriptions.create!(banner_offer: offer, status: 'pending_payment', provider: 'mock',
                                               checkout_session_id: 'sess_123')

    post '/api/v1/payments/webhooks/mock', params: { checkout_session_id: 'sess_123', status: 'paid' }
    assert_response :success

    sub.reload
    assert_equal 'active', sub.status
    assert sub.activated_at.present?
  end
end
