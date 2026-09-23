require 'rails_helper'

RSpec.describe Analytics::CampaignPerformanceService::CampaignRow do
  it 'does not invent rates when denominators are zero' do
    row = described_class.new(total_visits: 0, total_cta_clicks: 0, total_leads: 0)

    expect(row.ctr).to be_nil
    expect(row.profile_to_lead_conversion).to be_nil
    expect(row.cta_to_lead_rate).to be_nil
    expect(row.conversion_rate).to be_nil
  end
end
