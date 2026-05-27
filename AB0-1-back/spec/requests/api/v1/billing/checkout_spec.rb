require 'rails_helper'

RSpec.describe 'Api::V1::Billing Checkout & Subscriptions API', type: :request do
  let(:plan) { Plan.find_by(name: 'Integration Plan') || create(:plan, name: 'Integration Plan', stripe_price_id_monthly: 'price_integration') }
  let(:company) { create(:company, plan: plan) }
  let(:user) { create(:user, role: :company, company: company) }
  
  let(:token) { JWT.encode({ user_id: user.id }, Rails.application.secret_key_base, 'HS256') }
  let(:auth_headers) { { 'Authorization' => "Bearer #{token}", 'Content-Type' => 'application/json' } }
  let(:headers) { { 'Content-Type' => 'application/json' } }

  before do
    Rails.cache.clear
    allow(Analytics::TrackEventService).to receive(:call).and_return(true)
    allow(SlackNotificationService).to receive(:notify).and_return(true)
    allow(SlackNotificationService).to receive(:notify_member_assigned).and_return(true)
  end

  let!(:membership) { create(:company_member, company: company, user: user, role: :owner, status: 'active') }

  describe 'POST /api/v1/billing/checkout' do
    let(:params) { { company_id: company.id, plan_id: plan.id }.to_json }

    context 'quando não autenticado' do
      it 'retorna 401 unauthorized' do
        post '/api/v1/billing/checkout', params: params, headers: headers
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'quando autenticado mas sem ser membro da empresa' do
      let(:other_company) { create(:company, plan: plan) }
      let(:other_user) { create(:user, role: :company, company: other_company) }
      let!(:other_membership) { create(:company_member, company: other_company, user: other_user, role: :owner, status: 'active') }
      let(:other_token) { JWT.encode({ user_id: other_user.id }, Rails.application.secret_key_base, 'HS256') }
      let(:other_headers) { { 'Authorization' => "Bearer #{other_token}", 'Content-Type' => 'application/json' } }

      it 'retorna 403 forbidden' do
        original_show = Rails.application.config.action_dispatch.show_exceptions
        Rails.application.config.action_dispatch.show_exceptions = false
        begin
          post '/api/v1/billing/checkout', params: params, headers: other_headers
        ensure
          Rails.application.config.action_dispatch.show_exceptions = original_show
        end
        expect(response).to have_http_status(:forbidden)
      end
    end

    context 'quando autenticado e autorizado' do
      before do
        allow(Stripe::Customer).to receive(:create).and_return(
          double('Stripe::Customer', id: 'cust_mock_123')
        )
        allow(Stripe::Checkout::Session).to receive(:create).and_return(
          double('Stripe::Checkout::Session', url: 'https://checkout.stripe.com/pay/session_123')
        )
      end

      it 'cria a sessão no Stripe e retorna o checkout_url' do
        post '/api/v1/billing/checkout', params: params, headers: auth_headers

        expect(response).to have_http_status(:ok)
        payload = JSON.parse(response.body)
        expect(payload['checkout_url']).to eq('https://checkout.stripe.com/pay/session_123')
      end

      it 'repassa success_url e cancel_url para o Stripe' do
        success_url = 'http://localhost:3000/dashboard?checkout=success'
        cancel_url = 'http://localhost:3000/pricing'

        post '/api/v1/billing/checkout',
             params: {
               company_id: company.id,
               plan_id: plan.id,
               success_url: success_url,
               cancel_url: cancel_url
             }.to_json,
             headers: auth_headers

        expect(response).to have_http_status(:ok)
        expect(Stripe::Checkout::Session).to have_received(:create).with(
          hash_including(success_url: success_url, cancel_url: cancel_url)
        )
      end

      it 'retorna 422 quando o plano nao tem Stripe Price mensal' do
        invalid_plan = create(:plan, name: "Invalid Checkout #{SecureRandom.hex(4)}", stripe_price_id_monthly: nil)

        post '/api/v1/billing/checkout',
             params: { company_id: company.id, plan_id: invalid_plan.id }.to_json,
             headers: auth_headers

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it 'retorna erro seguro quando a chave Stripe é inválida' do
        allow(Stripe::Customer).to receive(:create).and_raise(
          Stripe::AuthenticationError.new('Invalid API Key provided: sk_test_********XXXX')
        )

        post '/api/v1/billing/checkout', params: params, headers: auth_headers

        expect(response).to have_http_status(:service_unavailable)
        payload = JSON.parse(response.body)
        expect(payload['error']).to include('Pagamentos temporariamente indisponíveis')
        expect(payload['error']).not_to include('sk_test')
        expect(payload['error']).not_to include('XXXX')
      end
    end
  end

  describe 'POST /api/v1/billing/portal' do
    let(:params) { { company_id: company.id }.to_json }

    context 'quando a empresa não possui Stripe Customer ID' do
      it 'retorna 422 unprocesable_entity' do
        post '/api/v1/billing/portal', params: params, headers: auth_headers
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    context 'quando a empresa possui Stripe Customer ID' do
      let!(:subscription) { Billing::CompanySubscription.create!(company: company, plan: plan, stripe_customer_id: 'cust_portal', status: 'active') }

      before do
        allow(Stripe::BillingPortal::Session).to receive(:create).and_return(
          double('Stripe::BillingPortal::Session', url: 'https://billing.stripe.com/p/session_portal')
        )
      end

      it 'gera o link do portal de faturamento do Stripe com sucesso' do
        post '/api/v1/billing/portal', params: params, headers: auth_headers

        expect(response).to have_http_status(:ok)
        payload = JSON.parse(response.body)
        expect(payload['portal_url']).to eq('https://billing.stripe.com/p/session_portal')
      end
    end
  end

  describe 'GET /api/v1/billing/subscription' do
    context 'quando a empresa não possui assinatura configurada' do
      it 'retorna 404 not_found' do
        get '/api/v1/billing/subscription', params: { company_id: company.id }, headers: auth_headers
        expect(response).to have_http_status(:not_found)
      end
    end

    context 'quando a empresa possui uma assinatura configurada' do
      let!(:subscription) do
        Billing::CompanySubscription.create!(
          company: company,
          plan: plan,
          status: 'active',
          stripe_customer_id: 'cust_ok',
          stripe_subscription_id: 'sub_ok',
          current_period_start: Time.current,
          current_period_end: 1.month.from_now
        )
      end

      it 'retorna os detalhes da assinatura de faturamento' do
        get '/api/v1/billing/subscription', params: { company_id: company.id }, headers: auth_headers

        expect(response).to have_http_status(:ok)
        payload = JSON.parse(response.body)
        expect(payload['status']).to eq('active')
        expect(payload['stripe_subscription_id']).to eq('sub_ok')
        expect(payload['plan']['id']).to eq(plan.id)
      end
    end
  end
end
