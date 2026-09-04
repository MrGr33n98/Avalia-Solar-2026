require 'rails_helper'

RSpec.describe Sales::Messaging::SuppressionChecker do
  let(:company) { create(:company) }

  it 'bloqueia endereço suprimido' do
    create(:sales_email_suppression, company: company, email: 'blocked@example.com')
    expect(described_class.blocked?(company_id: company.id, email: ' BLOCKED@example.com ')).to be(true)
  end

  it 'não bloqueia endereço de outra empresa' do
    create(:sales_email_suppression, email: 'blocked@example.com')
    expect(described_class.blocked?(company_id: company.id, email: 'other@example.com')).to be(false)
  end
end
