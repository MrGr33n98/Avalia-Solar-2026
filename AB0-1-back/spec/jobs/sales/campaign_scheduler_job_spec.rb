# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::CampaignSchedulerJob, type: :job do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }

  describe '#perform' do
    it 'dispatches due scheduled campaigns' do
      due_campaign = create(:sales_campaign, company: company, user: user, status: 'scheduled', scheduled_at: 10.minutes.ago)
      expect(Sales::Campaigns::Dispatcher).to receive(:call).with(campaign: due_campaign, action: 'dispatch').and_call_original

      described_class.new.perform
    end

    it 'does not dispatch future scheduled campaigns' do
      future_campaign = create(:sales_campaign, company: company, user: user, status: 'scheduled', scheduled_at: 1.hour.from_now)
      expect(Sales::Campaigns::Dispatcher).not_to receive(:call).with(campaign: future_campaign, action: 'dispatch')

      described_class.new.perform
    end

    it 'is idempotent across two concurrent executions' do
      due_campaign = create(:sales_campaign, company: company, user: user, status: 'scheduled', scheduled_at: 5.minutes.ago)
      
      described_class.new.perform
      expect(due_campaign.reload.status).to eq('dispatching')

      # Second execution sees dispatching status and becomes NO-OP
      expect {
        described_class.new.perform
      }.not_to change(due_campaign.reload, :status)
    end
  end
end
