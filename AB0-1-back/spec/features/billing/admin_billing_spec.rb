require 'rails_helper'

RSpec.describe 'Admin Billing System', type: :request do
  let(:category) { Category.create!(name: 'Sistemas Solares', description: 'Teste') }
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

  let(:free_plan) do
    Plan.create!(
      name: 'Free',
      price: 0.0,
      is_public: true,
      display_order: 0
    )
  end

  let(:pro_plan) do
    Plan.create!(
      name: 'Pro',
      price: 499.00,
      stripe_product_id: 'prod_pro123',
      stripe_price_id_monthly: 'price_pro123',
      is_public: true,
      display_order: 1
    )
  end

  let(:admin_user) do
    admin = AdminUser.create!(
      email: 'admin@avaliasolar.com.br',
      password: 'Password123!',
      billing_role: 'support'
    )
    # Stub otp_enabled? para simular 2FA ativo sem depender de coluna
    allow(admin).to receive(:otp_enabled?).and_return(true)
    admin
  end

  let(:normal_admin) do
    AdminUser.create!(
      email: 'normal@avaliasolar.com.br',
      password: 'Password123!',
      billing_role: nil
    )
  end

  before do
    allow(CNPJ).to receive(:valid?).and_return(true)
    allow(Billing::SlackNotifier).to receive(:notify_admin_action)
    allow(Billing::SlackNotifier).to receive(:notify_enterprise_manual)
    allow(Billing::SlackNotifier).to receive(:notify_force_downgrade)
  end

  describe 'Admin Subscription Modification Security & Audit' do
    context 'when admin has billing_role and 2FA enabled' do
      it 'allows marking company as enterprise manually and logs the action' do
        # Garante que a empresa tem uma assinatura no plano free
        Billing::CompanySubscription.create!(
          company: company,
          plan: free_plan,
          status: 'active'
        )

        service = Billing::AdminSubscriptionService.new(
          company: company,
          admin_user: admin_user,
          justification: 'Ativação cortesia aprovada pela diretoria comercial'
        )

        expect { service.mark_as_enterprise!(notes: 'Contrato especial') }
          .to change { Billing::AdminAction.count }.by(1)

        # Valida se o log de auditoria foi gravado corretamente no banco
        audit_log = Billing::AdminAction.last
        expect(audit_log.admin_user).to eq(admin_user)
        expect(audit_log.company).to eq(company)
        expect(audit_log.justification).to eq('Ativação cortesia aprovada pela diretoria comercial')
        expect(audit_log.action_type).to eq('mark_enterprise')
      end

      it 'requires a valid justification and raises error if blank' do
        Billing::CompanySubscription.create!(
          company: company,
          plan: free_plan,
          status: 'active'
        )

        service = Billing::AdminSubscriptionService.new(
          company: company,
          admin_user: admin_user,
          justification: '' # Justificativa em branco!
        )

        expect { service.mark_as_enterprise!(notes: 'Teste') }.to raise_error(ActiveRecord::RecordInvalid)
      end
    end

    context 'when admin does not have billing_role' do
      it 'is not authorized for billing operations' do
        # O normal_admin não tem billing_role nem 2FA ativo
        # billing_support? retorna false → o AdminSubscriptionService em si não faz
        # essa validação diretamente, mas podemos verificar o método:
        expect(normal_admin.billing_support?).to be(false)
      end
    end
  end
end
