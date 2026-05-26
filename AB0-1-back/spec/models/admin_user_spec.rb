require 'rails_helper'

RSpec.describe AdminUser, type: :model do
  describe 'Validations' do
    let(:admin) do
      described_class.new(
        email: 'admin_validation@example.com',
        password: 'password123',
        password_confirmation: 'password123'
      )
    end

    it 'allows billing_role to be nil' do
      admin.billing_role = nil
      expect(admin).to be_valid
    end

    it 'allows billing_role to be support, finance or super_admin' do
      %w[support finance super_admin].each do |role|
        admin.billing_role = role
        expect(admin).to be_valid
      end
    end

    it 'does not allow billing_role outside standard billing roles' do
      admin.billing_role = 'invalid_role'
      expect(admin).not_to be_valid
      expect(admin.errors[:billing_role]).to include('is not included in the list')
    end
  end

  describe 'Billing Authorization Methods' do
    let(:admin) do
      described_class.new(
        email: 'admin@example.com',
        password: 'password123',
        password_confirmation: 'password123'
      )
    end

    context 'quando OTP (2FA) não está ativado' do
      before do
        allow(admin).to receive(:otp_enabled?).and_return(false)
      end

      it 'retorna false para qualquer permissão mesmo que a role seja atribuída' do
        admin.billing_role = 'super_admin'
        expect(admin.billing_support?).to be false
        expect(admin.billing_finance?).to be false
        expect(admin.billing_super_admin?).to be false

        admin.billing_role = 'finance'
        expect(admin.billing_support?).to be false
        expect(admin.billing_finance?).to be false
        expect(admin.billing_super_admin?).to be false

        admin.billing_role = 'support'
        expect(admin.billing_support?).to be false
        expect(admin.billing_finance?).to be false
        expect(admin.billing_super_admin?).to be false
      end
    end

    context 'quando OTP (2FA) está ativado' do
      before do
        allow(admin).to receive(:otp_enabled?).and_return(true)
      end

      context 'com billing_role nulo (apenas leitura)' do
        before { admin.billing_role = nil }

        it 'não concede nenhuma permissão especial' do
          expect(admin.billing_support?).to be false
          expect(admin.billing_finance?).to be false
          expect(admin.billing_super_admin?).to be false
        end
      end

      context 'com billing_role support' do
        before { admin.billing_role = 'support' }

        it 'concede apenas permissão de support' do
          expect(admin.billing_support?).to be true
          expect(admin.billing_finance?).to be false
          expect(admin.billing_super_admin?).to be false
        end
      end

      context 'com billing_role finance' do
        before { admin.billing_role = 'finance' }

        it 'concede permissão de support e finance, mas não super_admin' do
          expect(admin.billing_support?).to be true
          expect(admin.billing_finance?).to be true
          expect(admin.billing_super_admin?).to be false
        end
      end

      context 'com billing_role super_admin' do
        before { admin.billing_role = 'super_admin' }

        it 'concede todas as permissões de billing' do
          expect(admin.billing_support?).to be true
          expect(admin.billing_finance?).to be true
          expect(admin.billing_super_admin?).to be true
        end
      end
    end
  end
end
