# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Billing::PortalService, type: :service do
  let(:company) { create(:company) }

  describe '#call' do
    context 'quando a empresa não possui CompanySubscription ou stripe_customer_id' do
      it 'lança CompanySubscriptionMissing' do
        expect {
          described_class.new(company: company).call
        }.to raise_error(::Billing::Errors::CompanySubscriptionMissing)
      end
    end

    context 'quando a empresa possui stripe_customer_id' do
      let!(:subscription) do
        Billing::CompanySubscription.create!(
          company: company,
          plan: Plan.find_by(name: 'Free') || create(:plan, name: 'Free'),
          stripe_customer_id: 'cust_test_123',
          status: 'active'
        )
      end

      it 'cria a sessão do portal no Stripe com sucesso e retorna a URL' do
        expect(Stripe::BillingPortal::Session).to receive(:create).with(
          customer: 'cust_test_123',
          return_url: a_string_matching('/company-dashboard/billing')
        ).and_return(double('Stripe::BillingPortal::Session', url: 'https://stripe.com/portal/session_123'))

        url = described_class.new(company: company).call
        expect(url).to eq('https://stripe.com/portal/session_123')
      end

      it 'lança StripeSessionCreationFailed se a API do Stripe falhar' do
        expect(Stripe::BillingPortal::Session).to receive(:create).and_raise(
          Stripe::InvalidRequestError.new('No such customer', 'customer')
        )

        expect {
          described_class.new(company: company).call
        }.to raise_error(::Billing::Errors::StripeSessionCreationFailed)
      end
    end
  end
end
