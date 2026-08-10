# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Webhook mock de pagamento de banner', type: :request do
  let(:company) { create(:company) }
  let(:banner) { create(:banner, :approved, active: true, company: company, sponsored: true) }
  let(:addon) { create(:banner_addon) }
  let!(:subscription) do
    create(:banner_addon_subscription, company: company, banner: banner, banner_addon: addon,
           status: 'pending_payment', starts_at: nil, ends_at: nil, checkout_session_id: 'mock-checkout-1')
  end

  before do
    allow_any_instance_of(Webhooks::SecurityService).to receive(:verify!).and_return(true)
  end

  it 'ativa add-on novo via endpoint mock' do
    payload = { checkout_session_id: 'mock-checkout-1', status: 'approved', event_id: 'mock-event-1' }

    2.times { post '/api/v1/payments/webhooks/mock', params: payload, headers: { 'X-Webhook-Signature' => 'test-signature', 'X-Webhook-Timestamp' => Time.current.to_i.to_s } }

    expect(response).to have_http_status(:ok)
    expect(subscription.reload.status).to eq('active')
  end
end
