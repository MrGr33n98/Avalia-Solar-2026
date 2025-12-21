require 'rails_helper'

RSpec.describe FinancingOption, type: :model do
  let(:company) { create(:company) }

  it 'limita a taxa de juros máxima' do
    option = described_class.new(company: company, credit_line: 'Linha', interest_rate_percent: 60)

    expect(option).not_to be_valid
    expect(option.errors[:interest_rate_percent]).to be_present
  end

  it 'valida carência dentro do prazo máximo' do
    option = described_class.new(
      company: company,
      credit_line: 'Linha',
      max_term_months: 12,
      grace_period_months: 18
    )

    expect(option).not_to be_valid
    expect(option.errors[:grace_period_months]).to be_present
  end

  it 'exige instituição quando ativo' do
    option = described_class.new(company: company, credit_line: 'Linha', active: true)

    expect(option).not_to be_valid
    expect(option.errors[:institution_name]).to be_present
  end
end
