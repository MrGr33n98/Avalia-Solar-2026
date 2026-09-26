# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Company Identity, Commercial Plan & Badges Semantics (Spec 005)', type: :model do
  describe 'Primary Category Governance' do
    let(:category_solar) { Category.create!(name: 'Energia Solar', slug: 'energia-solar', seo_url: 'energia-solar') }
    let(:category_ev) { Category.create!(name: 'Mobilidade Elétrica', slug: 'mobilidade-eletrica', seo_url: 'mobilidade-eletrica') }
    let(:company) do
      Company.new(
        name: 'EcoSolar',
        description: 'Empresa de energia e mobilidade',
        status: 'active',
        state: 'SC',
        city: 'Florianópolis'
      )
    end

    it 'allows valid primary_category belonging to assigned company categories' do
      company.categories = [category_solar, category_ev]
      company.primary_category = category_ev
      expect(company).to be_valid
      expect(company.primary_category).to eq(category_ev)
    end

    it 'invalidates primary_category if not assigned to company categories' do
      company.categories = [category_solar]
      company.primary_category = category_ev
      expect(company).not_to be_valid
      expect(company.errors[:primary_category_id]).to include('deve pertencer às categorias da empresa')
    end
  end

  describe 'Orthogonal Semantics (Verification != Paid != Featured != Badge)' do
    let(:free_plan) { Plan.create!(name: 'Plano Gratuito', price: 0) }
    let(:pro_plan) { Plan.create!(name: 'Plano Pro Solar', price: 299) }

    it 'featured=true + free plan does not equal PRO' do
      company = Company.new(
        name: 'Destaque Grátis',
        description: 'Empresa em destaque porém plano free',
        status: 'active',
        featured: true,
        plan: free_plan
      )
      status = company.commercial_status
      distribution = company.distribution

      expect(distribution[:featured]).to be(true)
      expect(status[:paid]).to be(false)
      expect(status[:tier]).to eq('free')
    end

    it 'paid plan + featured=false provides PRO without distribution badge' do
      company = Company.new(
        name: 'Assinante Pro',
        description: 'Empresa assinante Pro sem destaque editorial',
        status: 'active',
        featured: false,
        plan: pro_plan
      )
      status = company.commercial_status
      distribution = company.distribution

      expect(distribution[:featured]).to be(false)
      expect(status[:paid]).to be(true)
      expect(status[:tier]).to eq('pro')
    end

    it 'verified=false + paid plan provides PRO without verification check' do
      company = Company.new(
        name: 'Pro Não Verificado',
        description: 'Empresa pagante que ainda não enviou documentação',
        status: 'active',
        verified: false,
        plan: pro_plan
      )
      status = company.commercial_status
      expect(company.verified?).to be(false)
      expect(status[:paid]).to be(true)
    end

    it 'verified=true + free plan provides verification check without PRO' do
      company = Company.new(
        name: 'Verificada Free',
        description: 'Empresa validada documentalmente porém free',
        status: 'active',
        verified: true,
        plan: free_plan
      )
      status = company.commercial_status
      expect(company.verified?).to be(true)
      expect(status[:paid]).to be(false)
      expect(status[:tier]).to eq('free')
    end
  end
end
