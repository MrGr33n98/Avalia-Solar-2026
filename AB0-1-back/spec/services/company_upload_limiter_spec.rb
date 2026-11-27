# frozen_string_literal: true

require 'rails_helper'

# Spec 027 — T014: os limites de upload seguem o tier real do plano e o
# upgrade aponta para um plano público existente, sem preço fixo no código.
RSpec.describe CompanyUploadLimiter do
  def company_with(plan_name, price)
    plan = create(:plan, name: "#{plan_name} #{SecureRandom.hex(3)}", price: price, features_json: {})
    create(:company, plan: plan)
  end

  it 'aplica os limites Pro a uma empresa com plano Pro' do
    limiter = described_class.new(company_with('Pro', 1500))

    expect(limiter.current_tier).to eq('pro')
    expect(limiter.image_limit).to eq(50)
    expect(limiter.project_limit).to eq(20)
  end

  it 'aplica os limites Essencial a uma empresa com plano Essencial' do
    expect(described_class.new(company_with('Essential', 590)).current_tier).to eq('essential')
  end

  it 'aplica os limites Free a uma empresa sem plano' do
    company = create(:company)
    company.update_columns(plan_id: nil)

    expect(described_class.new(company.reload).current_tier).to eq('free')
  end

  it 'indica o plano público do próximo tier com o preço do catálogo' do
    Plan.update_all(is_public: false)
    essential = create(:plan, name: 'Essential Teste', price: 590, is_public: true, features_json: {})
    create(:plan, name: 'Essencial oculto', price: 330, is_public: false, features_json: {})

    pricing = described_class.new(company_with('Free', 0)).next_tier_pricing

    expect(pricing).to eq(plan_id: essential.id, name: essential.name, price: 590.0)
  end

  it 'não inventa preço quando não há plano público no próximo tier' do
    Plan.update_all(is_public: false)
    expect(described_class.new(company_with('Free', 0)).next_tier_pricing).to be_nil
  end
end
