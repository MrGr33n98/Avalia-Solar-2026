# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::Campaigns::AudienceResolver, type: :service do
  let!(:company) { create(:company) rescue Company.create!(name: 'Audience Spec', slug: "audience-spec-#{SecureRandom.hex(4)}") }
  let!(:other_company) { create(:company) rescue Company.create!(name: 'Other Audience Spec', slug: "other-audience-spec-#{SecureRandom.hex(4)}") }
  let!(:user) { create(:user, company: company) rescue User.create!(name: 'Audience User', email: "audience-#{SecureRandom.hex(4)}@test.com", password: 'Password123!', company_id: company.id) }
  let!(:account) { Sales::Account.create!(company: company, owner: user, name: 'Solar RS', state: 'RS', city: 'Porto Alegre', segment: 'Integrador') }
  let!(:contact) { Sales::Contact.create!(sales_account_id: account.id, first_name: 'Maria', last_name: 'Silva', email: "maria-#{SecureRandom.hex(4)}@solar.test") }

  it 'resolves tenant contacts and applies state, city, segment and search filters' do
    result = described_class.call(company: company, audience_filter: { state: 'RS', city: 'Porto Alegre', segment: 'Integrador', search: 'Maria' })

    expect(result[:total_count]).to eq(1)
    expect(result[:records].map(&:id)).to eq([contact.id])
  end

  it 'does not resolve contacts from another tenant' do
    other_account = Sales::Account.create!(company: other_company, owner: user, name: 'Other Solar', state: 'RS', city: 'Porto Alegre', segment: 'Integrador')
    other_contact = Sales::Contact.create!(sales_account_id: other_account.id, first_name: 'Other', email: "other-#{SecureRandom.hex(4)}@solar.test")

    result = described_class.call(company: company)

    expect(result[:records].map(&:id)).not_to include(other_contact.id)
  end

  it 'normalizes page and caps page size' do
    result = described_class.call(company: company, page: 0, per_page: 9999)

    expect(result).to include(page: 1, per_page: 500)
  end
end
