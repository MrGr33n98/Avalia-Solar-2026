require 'rails_helper'

RSpec.describe 'Financing simulate load', type: :request do
  let!(:company) { Company.create!(name: 'LoadCo', status: 'active') }
  let!(:opt) do
    FinancingOption.create!(company: company, institution_name: 'Bank', credit_line: 'Linha', target_audience: 'PF',
                            max_term_months: 60, grace_period_months: 0, interest_rate_percent: 1.2, active: true)
  end

  it 'handles multiple simulate requests quickly' do
    start = Time.now
    20.times do
      get "/api/v1/companies/#{company.id}/financing_options/simulate",
          params: { amount: 10_000, months: 36, audience: 'pf' }
      expect(response).to have_http_status(:ok)
    end
    elapsed = Time.now - start
    expect(elapsed).to be < 5
  end
end
