require 'rails_helper'

RSpec.describe BillingPolicy, type: :policy do
  let(:plan) { Plan.find_by(name: 'Policy Plan Unique') || create(:plan, name: 'Policy Plan Unique') }
  let(:company) { create(:company, plan: plan) }

  before do
    # Neutraliza efeitos colaterais de callbacks de tracking e notificações
    allow(Analytics::TrackEventService).to receive(:call).and_return(true)
    allow(SlackNotificationService).to receive(:notify).and_return(true)
  end

  describe 'permissoes de show?' do
    it 'permite show para administrador do sistema' do
      user = create(:user, role: :admin, company: company)
      expect(described_class.new(user, company).show?).to be true
    end

    it 'permite show para o owner da empresa' do
      user = create(:user, role: :company, company: company)
      create(:company_member, company: company, user: user, role: :owner)
      expect(described_class.new(user, company).show?).to be true
    end

    it 'permite show para o editor da empresa' do
      user = create(:user, role: :company, company: company)
      create(:company_member, company: company, user: user, role: :editor)
      expect(described_class.new(user, company).show?).to be true
    end

    it 'permite show para o manager da empresa' do
      user = create(:user, role: :company, company: company)
      create(:company_member, company: company, user: user, role: :manager)
      expect(described_class.new(user, company).show?).to be true
    end

    it 'nao permite show para usuario sem vinculo com a empresa' do
      other_company = create(:company, plan: plan)
      user = create(:user, role: :company, company: other_company)
      expect(described_class.new(user, company).show?).to be false
    end
  end

  describe 'permissoes de checkout? e portal?' do
    it 'permite checkout/portal para administrador' do
      user = create(:user, role: :admin, company: company)
      policy = described_class.new(user, company)
      expect(policy.checkout?).to be true
      expect(policy.portal?).to be true
    end

    it 'permite checkout/portal para o owner' do
      user = create(:user, role: :company, company: company)
      create(:company_member, company: company, user: user, role: :owner)
      policy = described_class.new(user, company)
      expect(policy.checkout?).to be true
      expect(policy.portal?).to be true
    end

    it 'permite checkout/portal para o editor' do
      user = create(:user, role: :company, company: company)
      create(:company_member, company: company, user: user, role: :editor)
      policy = described_class.new(user, company)
      expect(policy.checkout?).to be true
      expect(policy.portal?).to be true
    end

    it 'nao permite checkout/portal para o manager' do
      user = create(:user, role: :company, company: company)
      create(:company_member, company: company, user: user, role: :manager)
      policy = described_class.new(user, company)
      expect(policy.checkout?).to be false
      expect(policy.portal?).to be false
    end

    it 'nao permite checkout/portal para usuario externo' do
      other_company = create(:company, plan: plan)
      user = create(:user, role: :company, company: other_company)
      policy = described_class.new(user, company)
      expect(policy.checkout?).to be false
      expect(policy.portal?).to be false
    end
  end

  describe 'permissoes de enterprise_lead?' do
    it 'permite para administrador' do
      user = create(:user, role: :admin, company: company)
      expect(described_class.new(user, company).enterprise_lead?).to be true
    end

    it 'permite para owner da empresa' do
      user = create(:user, role: :company, company: company)
      create(:company_member, company: company, user: user, role: :owner)
      expect(described_class.new(user, company).enterprise_lead?).to be true
    end

    it 'permite para visualizador / manager da empresa' do
      user = create(:user, role: :company, company: company)
      create(:company_member, company: company, user: user, role: :manager)
      expect(described_class.new(user, company).enterprise_lead?).to be true
    end

    it 'nao permite para usuario de outra empresa' do
      other_company = create(:company, plan: plan)
      user = create(:user, role: :company, company: other_company)
      expect(described_class.new(user, company).enterprise_lead?).to be false
    end
  end
end
