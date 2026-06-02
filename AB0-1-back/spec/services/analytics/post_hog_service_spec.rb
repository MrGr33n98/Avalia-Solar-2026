require 'rails_helper'

RSpec.describe Analytics::PostHogService do
  describe '.track_lead' do
    it 'uses an opaque lead id instead of email' do
      lead = create(:lead, email: 'buyer@example.com')
      allow(described_class).to receive(:capture)

      described_class.track_lead(lead)

      expect(described_class).to have_received(:capture).with(
        'wizard_success',
        hash_including(lead_id: lead.id),
        distinct_id: "lead_#{lead.id}"
      )
    end
  end
end
