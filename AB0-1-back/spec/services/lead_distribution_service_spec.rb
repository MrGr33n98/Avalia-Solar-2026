require 'rails_helper'

RSpec.describe LeadDistributionService do
  before do
    allow(CNPJ).to receive(:valid?).and_return(true)
  end

  let(:category) { Category.create!(name: 'Solar', description: 'Categoria de energia solar') }

  def create_company(attrs = {})
    company = Company.new({
      name: 'Solar Company',
      description: 'Descricao da empresa',
      email: 'contato@empresa.com',
      state: 'RJ',
      city: 'Rio de Janeiro',
      phone: '21999999999',
      status: 'active',
      verified: true,
      featured: false,
      plan_status: 'active',
      cnpj: '12345678901234'
    }.merge(attrs))
    company.categories << category
    company.save!
    company
  end

  let!(:preferred) do
    create_company(
      name: 'Preferida',
      verified: false,
      plan_status: 'inactive',
      rating_avg: 2.0
    )
  end
  let!(:company_a) { create_company(name: 'Company A', featured: true, rating_avg: 4.2) }
  let!(:company_b) { create_company(name: 'Company B', featured: false, rating_avg: 4.8) }
  let!(:company_c) { create_company(name: 'Company C', featured: true, plan_status: 'inactive', rating_avg: 4.9) }

  let(:lead) do
    Lead.create!(
      name: 'Lead Test',
      email: 'lead@example.com',
      phone: '21999999999',
      product_vertical: 'Energia Solar',
      project_profile: 'Residencial',
      quote_type: 'Energia Solar',
      system_size_band: 'Ate 7 kWp',
      decision_timeline: 'Agora',
      address_full: 'Rua A, 10 - Rio de Janeiro/RJ',
      city: 'Rio de Janeiro',
      state: 'RJ',
      consent_at: Time.current,
      consent_ip: '127.0.0.1',
      wizard_status: 'pending_otp'
    )
  end

  it 'selects up to three companies and honors preferred company' do
    companies = described_class.new(lead, preferred_company_id: preferred.id).call

    expect(companies.first).to eq(preferred)
    expect(companies.size).to eq(3)
    expect(lead.lead_distributions.count).to eq(3)
  end
end
