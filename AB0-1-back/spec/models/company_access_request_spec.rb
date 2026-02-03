require 'rails_helper'

RSpec.describe CompanyAccessRequest, type: :model do
  let(:company) { create(:company, status: 'active', moderation_status: 'approved') }
  let(:user) { create(:user, role: 'company', status: :active, company: nil, confirmed_at: Time.current) }

  it 'is valid with defaults' do
    request = described_class.new(user: user, company: company)

    expect(request).to be_valid
    request.save!
    expect(request.status).to eq('pending')
    expect(request.requested_at).to be_present
  end

  it 'prevents duplicate pending requests for the same company' do
    create(:company_access_request, user: user, company: company, status: 'pending')

    duplicate = described_class.new(user: user, company: company, status: 'pending')
    expect(duplicate).not_to be_valid
    expect(duplicate.errors[:user_id]).to be_present
  end

  it 'allows a new request after rejection' do
    create(:company_access_request, user: user, company: company, status: 'rejected')

    request = described_class.new(user: user, company: company, status: 'pending')
    expect(request).to be_valid
  end
end
