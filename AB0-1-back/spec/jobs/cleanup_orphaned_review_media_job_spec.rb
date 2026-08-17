require 'rails_helper'

RSpec.describe CleanupOrphanedReviewMediaJob, type: :job do
  it 'abandona expired upload sessions' do
    session = create(:review_upload_session, status: :active, expires_at: 25.hours.ago)

    described_class.perform_now

    expect(session.reload).to be_abandoned
  end
end