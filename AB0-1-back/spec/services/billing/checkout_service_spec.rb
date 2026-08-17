require 'rails_helper'

RSpec.describe Billing::CheckoutService, type: :service do
  let(:plan) do
    Plan.find_by(name: 'Checkout Service Plan') || create(
      :plan,
      name: 'Checkout Service Plan',
      stripe_price_id_monthly: 'price_six_months',
      stripe_price_id_yearly: 'price_twelve_months'
    )
  end
  let(:company) { create(:company, plan: plan) }
  let(:user) { create(:user, company: company) }

  before { Rails.cache.clear }

  describe '#call' do
    context 'quando o plano não tem stripe_price_id_monthly configurado' do
      let(:invalid_plan) do
        Plan.find_by(name: 'Invalid Plan') || create(
          :plan,
          name: 'Invalid Plan',
          stripe_price_id_monthly: nil,
          stripe_price_id_yearly: nil
        )
      end
      let(:service) do
        described_class.new(company: company, plan: invalid_plan, current_user: user, billing_period: 'six_months')
      end

      it 'lança erro PlanNotConfigured' do
        expect(Stripe::Checkout::Session).not_to receive(:create)
        expect { service.call }.to raise_error(Billing::Errors::PlanNotConfigured)
      end
    end

    context 'quando o plano é válido e a empresa já possui stripe_customer_id no banco' do
      let!(:subscription) do
        Billing::CompanySubscription.create!(
          company: company,
          plan: plan,
          stripe_customer_id: 'cust_existente',
          status: 'incomplete'
        )
      end
      let(:service) do
        described_class.new(company: company, plan: plan, current_user: user, billing_period: 'six_months')
      end

      before do
        # Mocka a chamada de criação de sessão do Stripe
        allow(Stripe::Checkout::Session).to receive(:create).and_return(
          double('Stripe::Checkout::Session', url: 'https://checkout.stripe.com/pay/session_123')
        )
      end

      it 'reutiliza o customer_id existente e cria a checkout session com sucesso' do
        expect(Stripe::Customer).not_to receive(:create)
        expect(Stripe::Checkout::Session).to receive(:create).with(
          hash_including(
            customer: 'cust_existente',
            line_items: [{ price: 'price_six_months', quantity: 1 }],
            metadata: hash_including(billing_period: 'six_months'),
            subscription_data: hash_including(
              metadata: hash_including(billing_period: 'six_months')
            )
          )
        )

        url = service.call
        expect(url).to eq('https://checkout.stripe.com/pay/session_123')
      end

      it 'recarrega a chave Stripe a partir do ENV antes da chamada' do
        original_key = ENV['STRIPE_SECRET_KEY']
        original_stripe_key = Stripe.api_key
        ENV['STRIPE_SECRET_KEY'] = 'sk_test_checkout_service_runtime_key'
        Stripe.api_key = 'sk_test_stale_key'

        service.call

        expect(Stripe.api_key).to eq('sk_test_checkout_service_runtime_key')
      ensure
        ENV['STRIPE_SECRET_KEY'] = original_key
        Stripe.api_key = original_stripe_key
      end
    end

    context 'quando o plano é válido e a empresa NÃO possui stripe_customer_id' do
      let(:service) do
        described_class.new(company: company, plan: plan, current_user: user, billing_period: 'six_months')
      end

      before do
        # Mocka a criação de customer no Stripe
        allow(Stripe::Customer).to receive(:create).and_return(
          double('Stripe::Customer', id: 'cust_novo')
        )
        # Mocka a criação de sessão no Stripe
        allow(Stripe::Checkout::Session).to receive(:create).and_return(
          double('Stripe::Checkout::Session', url: 'https://checkout.stripe.com/pay/session_new')
        )
      end

      it 'cria o customer no Stripe, salva no banco e gera a sessão de checkout' do
        expect(Stripe::Customer).to receive(:create).with(
          hash_including(email: company.email, name: company.name)
        )
        expect(Stripe::Checkout::Session).to receive(:create).with(
          hash_including(customer: 'cust_novo')
        )

        url = service.call
        expect(url).to eq('https://checkout.stripe.com/pay/session_new')

        # Verifica persistência no banco
        subscription = Billing::CompanySubscription.find_by(company: company)
        expect(subscription).to be_present
        expect(subscription.stripe_customer_id).to eq('cust_novo')
      end
    end

    context 'quando o redirect usa a variante www do FRONTEND_URL' do
      let!(:subscription) do
        Billing::CompanySubscription.create!(
          company: company,
          plan: plan,
          stripe_customer_id: 'cust_existente',
          status: 'incomplete'
        )
      end
      let(:success_url) { 'https://www.avaliasolar.com.br/dashboard?checkout=success' }
      let(:cancel_url) { 'https://www.avaliasolar.com.br/pricing' }
      let(:service) do
        described_class.new(
          company: company,
          plan: plan,
          current_user: user,
          billing_period: 'six_months',
          success_url: success_url,
          cancel_url: cancel_url
        )
      end

      around do |example|
        original_frontend_url = ENV['FRONTEND_URL']
        ENV['FRONTEND_URL'] = 'https://avaliasolar.com.br'
        example.run
      ensure
        ENV['FRONTEND_URL'] = original_frontend_url
      end

      before do
        allow(Stripe::Checkout::Session).to receive(:create).and_return(
          double('Stripe::Checkout::Session', url: 'https://checkout.stripe.com/pay/session_www')
        )
      end

      it 'aceita www e dominio raiz como hosts seguros de retorno' do
        service.call

        expect(Stripe::Checkout::Session).to have_received(:create).with(
          hash_including(success_url: success_url, cancel_url: cancel_url)
        )
      end
    end

    context 'quando o Stripe rejeita a chave de API' do
      let(:service) do
        described_class.new(company: company, plan: plan, current_user: user, billing_period: 'six_months')
      end

      before do
        allow(Stripe::Customer).to receive(:create).and_raise(
          Stripe::AuthenticationError.new('Invalid API Key provided: sk_test_********XXXX')
        )
      end

      it 'lança erro seguro sem expor a chave Stripe' do
        captured_error = nil

        expect { service.call }.to raise_error(
          Billing::Errors::StripeSessionCreationFailed,
          /Pagamentos temporariamente indisponíveis/
        ) { |error| captured_error = error }

        expect(captured_error.message).not_to include('sk_test')
        expect(captured_error.message).not_to include('XXXX')
      end
    end

    context 'quando o período de cobrança é doze meses' do
      let!(:subscription) do
        Billing::CompanySubscription.create!(
          company: company,
          plan: plan,
          stripe_customer_id: 'cust_existente',
          status: 'incomplete'
        )
      end
      let(:service) do
        described_class.new(company: company, plan: plan, current_user: user, billing_period: 'twelve_months')
      end

      before do
        allow(Stripe::Checkout::Session).to receive(:create).and_return(
          double('Stripe::Checkout::Session', url: 'https://checkout.stripe.com/pay/session_yearly')
        )
      end

      it 'usa o Price de doze meses e inclui o período nos metadados' do
        service.call

        expect(Stripe::Checkout::Session).to have_received(:create).with(
          hash_including(
            line_items: [{ price: 'price_twelve_months', quantity: 1 }],
            metadata: hash_including(billing_period: 'twelve_months'),
            subscription_data: hash_including(
              metadata: hash_including(billing_period: 'twelve_months')
            )
          )
        )
      end
    end

    context 'quando o período de cobrança é inválido' do
      %w[monthly yearly].push(nil).each do |invalid_period|
        it "rejeita #{invalid_period.inspect}" do
          service = described_class.new(
            company: company,
            plan: plan,
            current_user: user,
            billing_period: invalid_period
          )

          expect(Stripe::Checkout::Session).not_to receive(:create)
          expect { service.call }.to raise_error(Billing::Errors::PlanNotConfigured, 'Período de cobrança inválido.')
        end
      end
    end

    context 'quando o Price de doze meses não está configurado' do
      let(:invalid_plan) do
        create(
          :plan,
          name: "Invalid Twelve Months #{SecureRandom.hex(4)}",
          stripe_price_id_monthly: 'price_six_months',
          stripe_price_id_yearly: nil
        )
      end
      let(:service) do
        described_class.new(company: company, plan: invalid_plan, current_user: user, billing_period: 'twelve_months')
      end

      it 'não chama o Stripe' do
        expect(Stripe::Checkout::Session).not_to receive(:create)
        expect { service.call }.to raise_error(
          Billing::Errors::PlanNotConfigured,
          'Este período ainda não está configurado para este plano.'
        )
      end
    end

    context 'quando os Prices dos períodos são diferentes' do
      let!(:subscription) do
        Billing::CompanySubscription.create!(
          company: company,
          plan: plan,
          stripe_customer_id: 'cust_existente',
          status: 'incomplete'
        )
      end

      before do
        allow(Stripe::Checkout::Session).to receive(:create) do |params|
          double('Stripe::Checkout::Session', url: "https://checkout.stripe.com/#{params[:line_items].first[:price]}")
        end
      end

      it 'não reutiliza a sessão de seis meses para doze meses' do
        six_months = described_class.new(
          company: company, plan: plan, current_user: user, billing_period: 'six_months'
        )
        twelve_months = described_class.new(
          company: company, plan: plan, current_user: user, billing_period: 'twelve_months'
        )

        expect(six_months.call).to include('price_six_months')
        expect(twelve_months.call).to include('price_twelve_months')
        expect(Stripe::Checkout::Session).to have_received(:create).twice
      end
    end
  end
end
