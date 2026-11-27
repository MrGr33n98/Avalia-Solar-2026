# frozen_string_literal: true

require 'rails_helper'

# Spec 027 — T010: cada Price do Stripe identifica um único plano e um único período.
# `stripe_price_id_monthly` guarda o Price de 6 meses; `stripe_price_id_yearly`, o de 12 meses.
RSpec.describe Plan, 'price IDs do Stripe' do
  it 'aceita price IDs diferentes para 6 e 12 meses' do
    plan = build(:plan, stripe_price_id_monthly: 'price_6m_a', stripe_price_id_yearly: 'price_12m_a')

    expect(plan).to be_valid
  end

  it 'recusa o mesmo price ID nos campos de 6 e 12 meses' do
    plan = build(:plan, stripe_price_id_monthly: 'price_igual', stripe_price_id_yearly: 'price_igual')

    expect(plan).not_to be_valid
    expect(plan.errors[:stripe_price_id_yearly].join).to match(/diferente do Price de 6 meses/)
  end

  it 'recusa um price ID que já pertence a outro plano, em qualquer campo' do
    create(:plan, stripe_price_id_monthly: 'price_outro_6m', stripe_price_id_yearly: 'price_outro_12m')
    plan = build(:plan, stripe_price_id_monthly: 'price_novo_6m', stripe_price_id_yearly: 'price_outro_6m')

    expect(plan).not_to be_valid
    expect(plan.errors[:stripe_price_id_yearly].join).to match(/já está em uso/)
  end

  it 'aceita os dois campos em branco' do
    expect(build(:plan, stripe_price_id_monthly: nil, stripe_price_id_yearly: '')).to be_valid
  end

  it 'não bloqueia edições de outros campos em planos antigos com IDs repetidos' do
    plan = create(:plan)
    plan.update_columns(stripe_price_id_monthly: 'price_legado', stripe_price_id_yearly: 'price_legado')

    expect(plan.reload.update(description: 'Nova descrição')).to be(true)
  end
end
