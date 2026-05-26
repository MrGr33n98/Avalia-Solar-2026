require 'rails_helper'

RSpec.describe Billing::CompanySubscription, type: :model do
  describe 'Associations' do
    it 'belongs to company' do
      association = described_class.reflect_on_association(:company)
      expect(association.macro).to eq(:belongs_to)
    end

    it 'belongs to plan' do
      association = described_class.reflect_on_association(:plan)
      expect(association.macro).to eq(:belongs_to)
    end
  end

  describe 'Validations' do
    let(:plan) { Plan.find_by(name: 'Validation Plan') || create(:plan, name: 'Validation Plan') }
    let(:company) { create(:company, plan: plan) }

    it 'requires status' do
      sub = described_class.new(company: company, plan: plan, status: nil)
      expect(sub).not_to be_valid
      expect(sub.errors[:status]).to include("can't be blank")
    end

    it 'requires status to be in STATUSES list' do
      sub = described_class.new(company: company, plan: plan, status: 'invalid_status')
      expect(sub).not_to be_valid
      expect(sub.errors[:status]).to include("is not included in the list")
    end

    it 'is valid with a valid status' do
      sub = described_class.new(company: company, plan: plan, status: 'active')
      expect(sub).to be_valid
    end
  end

  describe 'Scopes' do
    let(:plan) { Plan.find_by(name: 'Scopes Plan') || create(:plan, name: 'Scopes Plan', price: 100.0) }
    let!(:company) { create(:company, plan: plan) }
    
    let!(:active_sub) { described_class.create!(company: company, plan: plan, status: 'active') }
    let!(:trialing_sub) { described_class.create!(company: create(:company, plan: plan), plan: plan, status: 'trialing') }
    let!(:past_due_sub) { described_class.create!(company: create(:company, plan: plan), plan: plan, status: 'past_due') }
    let!(:manual_sub) { described_class.create!(company: create(:company, plan: plan), plan: plan, status: 'manual') }
    let!(:canceled_sub) { described_class.create!(company: create(:company, plan: plan), plan: plan, status: 'canceled') }
    let!(:lead_sub) { described_class.create!(company: create(:company, plan: plan), plan: plan, status: 'enterprise_lead') }

    describe '.active_saas' do
      it 'retorna apenas assinaturas SaaS ativas (active, trialing, past_due, manual)' do
        expect(described_class.active_saas).to contain_exactly(active_sub, trialing_sub, past_due_sub, manual_sub)
      end
    end

    describe '.past_due' do
      it 'retorna apenas assinaturas em atraso (past_due)' do
        expect(described_class.past_due).to contain_exactly(past_due_sub)
      end
    end

    describe '.enterprise_leads' do
      it 'retorna apenas leads do enterprise_lead' do
        expect(described_class.enterprise_leads).to contain_exactly(lead_sub)
      end
    end

    describe '.mrr_estimate' do
      it 'estima o MRR somando o preço dos planos das assinaturas ativas' do
        expect(described_class.mrr_estimate).to eq(400.0)
      end
    end
  end

  describe 'Instance Methods' do
    describe '#active?' do
      it 'retorna true se o status for active, trialing ou manual' do
        %w[active trialing manual].each do |status|
          sub = described_class.new(status: status)
          expect(sub.active?).to be true
        end

        %w[canceled past_due unpaid enterprise_lead].each do |status|
          sub = described_class.new(status: status)
          expect(sub.active?).to be false
        end
      end
    end

    describe '#canceled?' do
      it 'retorna true apenas se o status for canceled' do
        sub = described_class.new(status: 'canceled')
        expect(sub.canceled?).to be true

        sub = described_class.new(status: 'active')
        expect(sub.canceled?).to be false
      end
    end

    describe '#past_due?' do
      it 'retorna true apenas se o status for past_due' do
        sub = described_class.new(status: 'past_due')
        expect(sub.past_due?).to be true

        sub = described_class.new(status: 'active')
        expect(sub.past_due?).to be false
      end
    end

    describe '#enterprise_lead?' do
      it 'retorna true apenas se o status for enterprise_lead' do
        sub = described_class.new(status: 'enterprise_lead')
        expect(sub.enterprise_lead?).to be true

        sub = described_class.new(status: 'active')
        expect(sub.enterprise_lead?).to be false
      end
    end

    describe '#has_stripe_subscription?' do
      it 'retorna true se stripe_subscription_id estiver preenchido' do
        sub = described_class.new(stripe_subscription_id: 'sub_123')
        expect(sub.has_stripe_subscription?).to be true

        sub = described_class.new(stripe_subscription_id: nil)
        expect(sub.has_stripe_subscription?).to be false
      end
    end
  end
end
