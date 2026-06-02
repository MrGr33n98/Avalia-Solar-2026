require 'rails_helper'

RSpec.describe Analytics::PostHogService do
  describe '.capture' do
    let(:client) { instance_double(PostHog::Client) }

    before do
      allow(described_class).to receive(:enabled?).and_return(true)
      allow(described_class).to receive(:posthog).and_return(client)
    end

    it 'uses a technical anonymous id and accepts nil properties' do
      allow(client).to receive(:capture)

      described_class.capture('boot_probe', nil)

      expect(client).to have_received(:capture).with(
        distinct_id: 'anonymous',
        event: 'boot_probe',
        properties: hash_including(rails_env: Rails.env)
      )
    end

    it 'does not raise when PostHog fails' do
      allow(client).to receive(:capture).and_raise(StandardError, 'offline')

      expect { described_class.capture('boot_probe') }.not_to raise_error
    end

    it 'never forwards an email as distinct_id' do
      allow(client).to receive(:capture)

      described_class.capture('boot_probe', {}, distinct_id: 'buyer@example.com')

      expect(client).to have_received(:capture).with(hash_including(distinct_id: 'anonymous'))
    end
  end

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
