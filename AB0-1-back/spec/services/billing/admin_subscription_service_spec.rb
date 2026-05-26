# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Billing::AdminSubscriptionService, type: :service do
  let(:company) { create(:company) }
  let(:admin) do
    AdminUser.create!(
      email: "admin_test_#{SecureRandom.hex(4)}@example.com",
      password: 'password123',
      password_confirmation: 'password123'
    )
  end
  let(:justification) { 'Justificativa para teste' }
  let!(:enterprise_plan) { Plan.find_by(name: 'Enterprise') || create(:plan, name: 'Enterprise') }
  let!(:free_plan) { Plan.find_by(name: 'Free') || create(:plan, name: 'Free') }
  let!(:pro_plan) { Plan.find_by(name: 'Integration Plan') || create(:plan, name: 'Integration Plan', stripe_price_id_monthly: 'price_integration') }

  before do
    allow(Analytics::TrackEventService).to receive(:call).and_return(true)
    allow(SlackNotificationService).to receive(:notify).and_return(true)
    allow(Billing::SlackNotifier).to receive(:alerts_enabled?).and_return(true)
  end

  subject { described_class.new(company: company, admin_user: admin, justification: justification) }

  describe '#mark_as_enterprise!' do
    it 'marca a assinatura como enterprise manual, altera o plano da empresa e audita a ação' do
      expect(Billing::SlackNotifier).to receive(:notify_enterprise_manual).with(
        company: company,
        admin: admin,
        notes: 'Notas contratuais'
      )

      expect {
        subject.mark_as_enterprise!(notes: 'Notas contratuais')
      }.to change(Billing::AdminAction, :count).by(1)

      sub = Billing::CompanySubscription.find_by(company: company)
      expect(sub.status).to eq('manual')
      expect(sub.is_enterprise_manual).to be_truthy
      expect(sub.enterprise_notes).to eq('Notas contratuais')

      company.reload
      expect(company.plan_id).to eq(enterprise_plan.id)

      audit = Billing::AdminAction.last
      expect(audit.action_type).to eq('mark_enterprise')
      expect(audit.justification).to eq(justification)
      expect(audit.admin_user_id).to eq(admin.id)
    end
  end

  describe '#force_downgrade_to_free!' do
    let!(:subscription) do
      Billing::CompanySubscription.create!(
        company: company,
        plan: pro_plan,
        stripe_subscription_id: 'sub_test_123',
        stripe_customer_id: 'cust_test_123',
        status: 'active',
        current_period_start: 1.month.ago,
        current_period_end: Time.current
      )
    end

    it 'cancela no Stripe, rebaixa para plano Free, audita a ação e notifica no Slack' do
      expect(Stripe::Subscription).to receive(:cancel).with('sub_test_123').and_return(double('Stripe::Subscription'))
      expect(Billing::SlackNotifier).to receive(:notify_force_downgrade).with(
        company: company,
        admin: admin,
        reason: 'Inadimplência crônica'
      )

      expect {
        subject.force_downgrade_to_free!(reason: 'Inadimplência crônica')
      }.to change(Billing::AdminAction, :count).by(1)

      subscription.reload
      expect(subscription.status).to eq('canceled')
      expect(subscription.canceled_at).to be_present

      company.reload
      expect(company.plan_id).to eq(free_plan.id)

      audit = Billing::AdminAction.last
      expect(audit.action_type).to eq('force_downgrade')
    end
  end

  describe '#cancel_at_period_end!' do
    let!(:subscription) do
      Billing::CompanySubscription.create!(
        company: company,
        plan: pro_plan,
        stripe_subscription_id: 'sub_test_123',
        stripe_customer_id: 'cust_test_123',
        status: 'active',
        current_period_start: 1.month.ago,
        current_period_end: Time.current
      )
    end

    it 'agenda cancelamento no Stripe, atualiza registro local, audita e notifica no Slack' do
      expect(Stripe::Subscription).to receive(:update).with('sub_test_123', cancel_at_period_end: true).and_return(double('Stripe::Subscription'))
      expect(Billing::SlackNotifier).to receive(:notify_subscription_canceled).with(
        company: company,
        plan: pro_plan,
        reason: 'Cancelamento agendado por Administrador',
        period_end: subscription.current_period_end
      )

      expect {
        subject.cancel_at_period_end!
      }.to change(Billing::AdminAction, :count).by(1)

      subscription.reload
      expect(subscription.cancel_at_period_end).to be_truthy

      audit = Billing::AdminAction.last
      expect(audit.action_type).to eq('cancel_at_period_end')
    end
  end
end
