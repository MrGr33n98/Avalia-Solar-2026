# frozen_string_literal: true

require 'rails_helper'

RSpec.describe BannerEventRetentionAuditJob, type: :job do
  it 'reports events beyond retention without deleting them' do
    banner = create(:banner, :approved, active: true)
    old_event = create(:banner_event, banner: banner, tracked_at: 25.months.ago)
    recent_event = create(:banner_event, banner: banner, tracked_at: 23.months.ago)

    result = described_class.perform_now

    expect(result[:candidates]).to eq(1)
    expect(result[:oldest_tracked_at]).to be_present
    expect { old_event.reload }.not_to raise_error
    expect { recent_event.reload }.not_to raise_error
  end
end
