require 'rails_helper'

RSpec.describe CompanySerializer, type: :serializer do
  let(:company) { create(:company) }

  it 'marks a company as claimed only when it has an active owner' do
    create(:company_member, company: company, role: :owner, status: 'active')

    expect(described_class.new(company).claimed).to be(true)
  end

  it 'does not equate paid or verified status with a claimed profile' do
    company.update!(verified: true, active_admin: true)

    expect(described_class.new(company).claimed).to be(false)
  end

  it 'does not treat a revoked owner as an active claim' do
    create(:company_member, company: company, role: :owner, status: 'revoked')

    expect(described_class.new(company).claimed).to be(false)
  end
end
