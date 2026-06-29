require 'rails_helper'

RSpec.describe ReviewSourceTraceRetentionJob, type: :job do
  it 'removes only expired IP hashes and preserves source metadata' do
    expired = create(
      :review,
      created_at: 91.days.ago,
      metadata: {
        ip_hash: 'expired-hash',
        source_channel: 'qr_code_form',
        source_token: 'token'
      }
    )
    recent = create(:review, created_at: 10.days.ago, metadata: { ip_hash: 'recent-hash' })

    described_class.perform_now

    expect(expired.reload.metadata).not_to have_key('ip_hash')
    expect(expired.metadata).to include(
      'source_channel' => 'qr_code_form',
      'source_token' => 'token'
    )
    expect(expired.metadata['ip_hash_purged_at']).to be_present
    expect(recent.reload.metadata['ip_hash']).to eq('recent-hash')
  end
end
