# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::Quota, type: :model do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }

  it 'calcula a porcentagem de atingimento de meta corretamente' do
    quota = described_class.new(
      company: company,
      user: user,
      period_type: 'monthly',
      starts_on: Date.current.beginning_of_month,
      ends_on: Date.current.end_of_month,
      target_revenue_cents: 100_000_00, # R$ 100.000,00
      target_deals_count: 5
    )

    expect(quota.attainment_percent(50_000_00)).to eq(50.0)
    expect(quota.attainment_percent(120_000_00)).to eq(120.0)
    expect(quota.attainment_percent(0)).to eq(0.0)
  end

  it 'calcula o ritmo ideal (ideal pace) com base nos dias transcorridos' do
    quota = described_class.new(
      company: company,
      user: user,
      period_type: 'monthly',
      starts_on: Date.new(2026, 10, 1),
      ends_on: Date.new(2026, 10, 31),
      target_revenue_cents: 100_000_00
    )

    # Dia 15 de 31 dias => ~48.4%
    pace = quota.ideal_pace_percent(Date.new(2026, 10, 15))
    expect(pace).to be_within(1.0).of(48.4)
  end
end
