require 'rails_helper'

RSpec.describe Billing::CheckoutService, type: :service do
  let(:plan) { Plan.find_by(name: 'Checkout Service Plan') || create(:plan, name: 'Checkout Service Plan', stripe_price_id_monthly: 'price_123') }
  let(:company) { create(:company, plan: plan) }
  let(:user) { create(:user, company: company) }

  before { Rails.cache.clear }

  describe '#call' do
    context 'quando o plano não tem stripe_price_id_monthly configurado' do
      let(:invalid_plan) { Plan.find_by(name: 'Invalid Plan') || create(:plan, name: 'Invalid Plan', stripe_price_id_monthly: nil) }
      let(:service) { described_class.new(company: company, plan: invalid_plan, current_user: user) }

      it 'lança erro PlanNotConfigured' do
        expect { service.call }.to raise_error(Billing::Errors::PlanNotConfigured)
      end
    end

    context 'quando o plano é válido e a empresa já possui stripe_customer_id no banco' do
      let!(:subscription) { Billing::CompanySubscription.create!(company: company, plan: plan, stripe_customer_id: 'cust_existente', status: 'incomplete') }
      let(:service) { described_class.new(company: company, plan: plan, current_user: user) }

      before do
        # Mocka a chamada de criação de sessão do Stripe
        allow(Stripe::Checkout::Session).to receive(:create).and_return(
          double('Stripe::Checkout::Session', url: 'https://checkout.stripe.com/pay/session_123')
        )
      end

      it 'reutiliza o customer_id existente e cria a checkout session com sucesso' do
        expect(Stripe::Customer).not_to receive(:create)
        expect(Stripe::Checkout::Session).to receive(:create).with(
          hash_including(customer: 'cust_existente')
        )

        url = service.call
        expect(url).to eq('https://checkout.stripe.com/pay/session_123')
      end
    end

    context 'quando o plano é válido e a empresa NÃO possui stripe_customer_id' do
      let(:service) { described_class.new(company: company, plan: plan, current_user: user) }

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

    context 'quando o Stripe rejeita a chave de API' do
      let(:service) { described_class.new(company: company, plan: plan, current_user: user) }

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
  end
end
