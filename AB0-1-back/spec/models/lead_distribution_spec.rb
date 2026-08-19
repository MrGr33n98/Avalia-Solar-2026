require 'rails_helper'

RSpec.describe LeadDistribution, type: :model do
  let(:distribution) { create(:lead_distribution, status: :sent) }

  it 'transita de sent para viewed e accepted' do
    distribution.mark_viewed!
    expect(distribution.reload).to be_viewed_status

    distribution.accept!
    expect(distribution.reload).to be_accepted_status
    expect(distribution.accepted_at).to be_present
  end

  it 'valida reason de rejeição' do
    expect { distribution.reject!('unknown') }.to raise_error(ArgumentError)
  end

  it 'permite rejeição com reason code' do
    distribution.reject!('outside_area')

    expect(distribution.reload).to be_rejected_status
    expect(distribution.rejection_reason).to eq('outside_area')
  end
end
