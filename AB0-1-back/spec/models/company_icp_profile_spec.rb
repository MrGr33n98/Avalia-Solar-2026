# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyIcpProfile, type: :model do
  let(:company) { create(:company) }

  subject do
    described_class.new(
      company: company,
      strictness_level: 'balanced',
      min_monthly_bill: 1000.0,
      min_system_kwp: 5.0
    )
  end

  it 'is valid with valid attributes' do
    expect(subject).to be_valid
  end

  it 'validates inclusion of strictness_level' do
    subject.strictness_level = 'invalid'
    expect(subject).not_to be_valid
  end
end
