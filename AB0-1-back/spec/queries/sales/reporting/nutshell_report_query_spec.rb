# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::Reporting::NutshellReportQuery do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }
  let(:account) { Sales::Account.create!(name: 'Conta Teste Nutshell', owner: user, company_id: company.id) }
  let(:pipeline) { Sales::Pipeline.create!(name: 'Pipeline Solar', company_id: company.id) }
  let(:won_stage) { Sales::Stage.create!(sales_pipeline: pipeline, name: 'Fechado Ganho', position: 5, probability: 100) }

  before do
    Sales::Opportunity.create!(
      sales_account: account,
      sales_stage: won_stage,
      owner: user,
      title: 'Projeto Residencial 10kWp',
      value_cents: 45_000_00,
      status: 'won',
      won_at: 10.days.ago,
      company_id: company.id
    )
  end

  it 'retorna série temporal e sumário reais para relatório de vendas' do
    result = described_class.call(
      user: user,
      report_type: 'sales',
      granularity: 'week',
      measure: 'value',
      from: 30.days.ago.to_date.to_s,
      to: Date.current.to_s
    )

    expect(result[:report_type]).to eq('sales')
    expect(result[:granularity]).to eq('week')
    expect(result[:measure]).to eq('value')
    expect(result[:series]).to be_an(Array)
    expect(result[:summary][:total_value]).to be >= 45_000.0
    expect(result[:summary][:total_count]).to be >= 1
  end

  it 'retorna formato seguro quando não há registros' do
    result = described_class.call(
      user: user,
      report_type: 'sales',
      granularity: 'month',
      measure: 'quantity',
      from: 365.days.ago.to_date.to_s,
      to: 300.days.ago.to_date.to_s
    )

    expect(result[:series]).to be_an(Array)
    expect(result[:summary][:total_count]).to eq(0)
    expect(result[:summary][:total_value]).to eq(0.0)
  end
end
