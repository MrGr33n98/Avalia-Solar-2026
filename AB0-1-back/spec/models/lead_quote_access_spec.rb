require 'rails_helper'

RSpec.describe Lead, type: :model do
  it 'permite criar lead quando a empresa tem active_admin true' do
    company = create(:company, active_admin: true)
    lead = build(:lead, company: company)

    expect(lead).to be_valid
  end

  it 'bloqueia criar lead quando a empresa tem active_admin false' do
    company = create(:company, active_admin: false)
    lead = build(:lead, company: company)

    expect(lead).not_to be_valid
    expect(lead.errors[:company_id].join(' ')).to match(/empresa n.o habilitada para or.amentos/i)
  end
end
