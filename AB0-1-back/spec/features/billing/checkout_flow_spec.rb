require 'rails_helper'

RSpec.describe 'Billing Checkout Flow', type: :request do
  let(:category) { Category.create!(name: 'Tecnologia Solar', description: 'Categoria de teste') }
  let(:company) do
    comp = Company.new(
      name: 'Solar Tech',
      description: 'Uma empresa solar',
      website: 'http://solartech.com',
      email: 'contato@solartech.com',
      email_public: 'contact@solartech.com',
      address: '123 Solar St',
      city: 'Florianópolis',
      state: 'SC',
      phone: '4899999999',
      status: 'active',
      segment: 'installer'
    )
    comp.categories << category
    comp.save!
    comp
  end

  let(:user) do
    u = User.create!(
      name: 'João da Silva',
      email: 'joao@solartech.com',
      password: 'Password123!',
      company: company,
      role: 'company',
      terms_accepted: true,
      confirmed_at: Time.current,
      approved_by_admin: true,
      status: :active
    )
    # Cria CompanyMember ativo com role owner para satisfazer a BillingPolicy
    CompanyMember.create!(
      user: u,
      company: company,
      role: 'owner',
      status: 'active'
    )
    u
  end

  let(:plan) do
    Plan.create!(
      name: 'Pro',
      price: 499.00,
      stripe_product_id: 'prod_pro123',
      stripe_price_id_monthly: 'price_pro123',
      is_public: true,
      display_order: 1,
      features_json: { custom_ctas: true, show_competitor_banners: false }
    )
  end

  let(:headers) do
    # Gera cabeçalho JWT de autenticação com algoritmo HS256 explícito
    token = JWT.encode(
      { user_id: user.id, exp: 24.hours.from_now.to_i },
      Rails.application.secret_key_base,
      'HS256'
    )
    { 'Authorization' => "Bearer #{token}", 'Content-Type' => 'application/json' }
  end

  before do
    allow(CNPJ).to receive(:valid?).and_return(true)
    allow(Billing::SlackNotifier).to receive(:notify_new_subscription)
    # Stub do Stripe Customer para evitar chamada real
    mock_customer = double('Stripe::Customer', id: 'cus_test_123')
    allow(Stripe::Customer).to receive(:create).and_return(mock_customer)
    # Stubs para callbacks do CompanyMember
    allow(Analytics::TrackEventService).to receive(:call)
    allow(SlackNotificationService).to receive(:notify_member_assigned)
  end

  describe 'POST /api/v1/billing/checkout' do
    context 'when authenticated and parameters are valid' do
      it 'creates a Stripe checkout session and returns the checkout URL' do
        # Stub do Stripe Checkout Session
        mock_session = double('Stripe::Checkout::Session', url: 'https://checkout.stripe.com/pay/cs_test_123')
        allow(Stripe::Checkout::Session).to receive(:create).and_return(mock_session)

        post '/api/v1/billing/checkout',
             params: { company_id: company.id, plan_id: plan.id }.to_json,
             headers: headers

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response).to have_key('checkout_url')
        expect(json_response['checkout_url']).to eq('https://checkout.stripe.com/pay/cs_test_123')
      end
    end

    context 'when plan is not configured in Stripe' do
      it 'returns unprocessable entity status' do
        unconfigured_plan = Plan.create!(
          name: 'Premium Test',
          price: 999.00,
          is_public: true,
          display_order: 2
        )

        post '/api/v1/billing/checkout',
             params: { company_id: company.id, plan_id: unconfigured_plan.id }.to_json,
             headers: headers

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    context 'when user is not authorized to checkout for another company' do
      it 'returns forbidden status' do
        other_company = Company.new(
          name: 'Outra Empresa',
          description: 'Outra descricao para validacao',
          website: 'http://outra.com',
          email: 'contato@outra.com',
          email_public: 'contact@outra.com',
          address: '456 Outro St',
          city: 'Florianópolis',
          state: 'SC',
          phone: '4899999998',
          status: 'active',
          segment: 'installer'
        )
        other_company.categories << category
        other_company.save!

        post '/api/v1/billing/checkout',
             params: { company_id: other_company.id, plan_id: plan.id }.to_json,
             headers: headers

        expect(response).to have_http_status(:forbidden)
      end
    end

    context 'when user is not authenticated' do
      it 'returns unauthorized status' do
        post '/api/v1/billing/checkout',
             params: { company_id: company.id, plan_id: plan.id }.to_json,
             headers: { 'Content-Type' => 'application/json' }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
