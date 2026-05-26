# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Billing::SlackNotifier, type: :service do
  let(:plan) { Plan.find_by(name: 'Integration Plan') || create(:plan, name: 'Integration Plan', stripe_price_id_monthly: 'price_integration') }
  let(:company) { create(:company, plan: plan, segment: 'integrator', city: 'São Paulo', state: 'SP') }
  let(:admin) do
    AdminUser.create!(
      email: "admin_test_#{SecureRandom.hex(4)}@example.com",
      password: 'password123',
      password_confirmation: 'password123'
    )
  end

  before do
    allow(SlackNotificationService).to receive(:notify).and_return(true)
    allow(Billing::SlackNotifier).to receive(:alerts_enabled?).and_return(true)
  end

  describe '.notify_new_subscription' do
    it 'chama o SlackNotificationService com as informações da nova assinatura' do
      expect(SlackNotificationService).to receive(:notify).with(
        "💳 *Nova Assinatura #{plan.name}*",
        anything,
        channel: :billing
      )

      described_class.notify_new_subscription(company: company, plan: plan)
    end
  end

  describe '.notify_enterprise_manual' do
    it 'chama o SlackNotificationService de forma síncrona com as informações da ativação manual' do
      expect(SlackNotificationService).to receive(:notify).with(
        "🏢 *Enterprise Manual Ativado*",
        anything,
        channel: :billing,
        synchronous: true
      )

      described_class.notify_enterprise_manual(company: company, admin: admin, notes: 'Contrato assinado #123')
    end
  end

  describe '.notify_payment_failed' do
    it 'chama o SlackNotificationService síncrono com a falha de pagamento e motivo traduzido' do
      expect(SlackNotificationService).to receive(:notify).with(
        "🚨 *Falha de Pagamento*",
        anything,
        channel: :billing,
        synchronous: true
      )

      described_class.notify_payment_failed(
        company: company,
        amount_cents: 29700,
        decline_reason: 'insufficient_funds',
        attempt_count: 2
      )
    end
  end

  describe '.notify_invalid_webhook' do
    it 'chama o SlackNotificationService com o erro de assinatura no canal de alertas técnico' do
      expect(SlackNotificationService).to receive(:notify).with(
        "⚠️ *Webhook Stripe Inválido — Billing*",
        anything,
        channel: :alertas,
        synchronous: true
      )

      described_class.notify_invalid_webhook(error: 'Signature mismatch')
    end
  end
end
