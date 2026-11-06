require 'rails_helper'

RSpec.describe Lead, type: :model do
  it 'permite criar lead quando a empresa tem active_admin true' do
    company = create(:company, active_admin: true)
    lead = build(:lead, company: company)

    expect(lead).to be_valid
  end

  it 'bloqueia um orçamento direcionado quando o plano pago desativa o CTA' do
    company = create(:company, plan: create(:plan, price: 99, features: { custom_ctas: true }),
                     moderation_status: 'approved', quote_cta_enabled: false)
    lead = build(:lead, company: company, quote_requested_company_id: company.id)

    expect(lead).not_to be_valid
    expect(lead.errors[:company_id].join(' ')).to match(/empresa n.o habilitada para or.amentos/i)
  end

  it 'bloqueia um orçamento direcionado a uma empresa diferente daquela associada' do
    company = create(:company, moderation_status: 'approved')
    other = create(:company, moderation_status: 'approved')
    lead = build(:lead, company: company, quote_requested_company_id: other.id)

    expect(lead).not_to be_valid
  end

  it 'bloqueia orçamento direcionado sem empresa associada (fail closed)' do
    company = create(:company, moderation_status: 'approved')
    lead = build(:lead, company: nil, quote_requested_company_id: company.id)

    expect(lead).not_to be_valid
    expect(lead.errors[:company_id]).to be_present
  end

  it 'bloqueia orçamento direcionado para uma empresa removida' do
    lead = build(:lead, company_id: 999_999_999, quote_requested_company_id: 999_999_999)

    expect(lead).not_to be_valid
    expect(lead.errors[:company_id]).to be_present
  end

  it 'bloqueia criar lead quando a empresa tem active_admin false' do
    company = create(:company, active_admin: false)
    lead = build(:lead, company: company)

    expect(lead).not_to be_valid
    expect(lead.errors[:company_id].join(' ')).to match(/empresa n.o habilitada para or.amentos/i)
  end
end
