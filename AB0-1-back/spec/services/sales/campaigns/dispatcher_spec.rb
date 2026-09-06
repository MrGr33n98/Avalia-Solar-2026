# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::Campaigns::Dispatcher, type: :service do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }
  let(:campaign) { create(:sales_campaign, company: company, user: user, status: 'draft') }

  describe '#call' do
    context 'when transitioning states' do
      it 'allows dispatch from draft to dispatching' do
        result = described_class.call(campaign: campaign, action: 'dispatch')
        expect(result[:status]).to eq('dispatching')
        expect(campaign.reload.status).to eq('dispatching')
      end

      it 'allows dispatch from scheduled to dispatching' do
        campaign.update!(status: 'scheduled', scheduled_at: 1.hour.from_now)
        result = described_class.call(campaign: campaign, action: 'dispatch')
        expect(result[:status]).to eq('dispatching')
      end

      it 'returns no-op response when campaign is already dispatching' do
        campaign.update!(status: 'dispatching', started_at: Time.current)
        result = described_class.call(campaign: campaign, action: 'dispatch')
        expect(result[:already_dispatching]).to be true
        expect(result[:status]).to eq('dispatching')
      end

      it 'prevents re-dispatch of completed campaign' do
        campaign.update!(status: 'completed', completed_at: Time.current)
        result = described_class.call(campaign: campaign, action: 'dispatch')
        expect(result[:error]).to eq('CAMPAIGN_TERMINAL')
      end

      it 'prevents re-dispatch of cancelled campaign' do
        campaign.update!(status: 'cancelled')
        result = described_class.call(campaign: campaign, action: 'dispatch')
        expect(result[:error]).to eq('CAMPAIGN_TERMINAL')
      end

      it 'requires resume action when paused' do
        campaign.update!(status: 'paused')
        result = described_class.call(campaign: campaign, action: 'dispatch')
        expect(result[:error]).to eq('CAMPAIGN_PAUSED')
      end

      it 'does not duplicate batch jobs on concurrent dispatch calls' do
        campaign.update!(status: 'dispatching', started_at: Time.current)
        expect {
          described_class.call(campaign: campaign, action: 'dispatch')
        }.not_to change(Sales::CampaignBatchProcessorJob.jobs, :size)
      end
    end

    context 'retry_failed canonical boundary' do
      it 'transitions failed recipient to pending and failed EmailMessage to queued' do
        campaign.update!(status: 'failed')
        recipient = create(:sales_campaign_recipient, campaign: campaign, status: 'failed')
        email_msg = create(:sales_email_message,
                           company: company,
                           sales_campaign_id: campaign.id,
                           sales_campaign_recipient_id: recipient.id,
                           status: 'failed',
                           metadata: { 'error' => 'Connection timeout', 'retry_count' => 1 })

        result = described_class.call(campaign: campaign, action: 'retry_failed')
        expect(result[:retried_count]).to eq(1)
        expect(recipient.reload.status).to eq('pending')
        expect(email_msg.reload.status).to eq('queued')
        expect(email_msg.metadata).to eq({ 'retry_count' => 1 })
      end

      it 'marks suppressed failed recipient as unsubscribed without queueing EmailMessage' do
        campaign.update!(status: 'failed')
        recipient = create(:sales_campaign_recipient, campaign: campaign, email: 'blocked@exemplo.com.br', status: 'failed')
        email_msg = create(:sales_email_message,
                           company: company,
                           sales_campaign_id: campaign.id,
                           sales_campaign_recipient_id: recipient.id,
                           status: 'failed')
        Sales::EmailSuppression.create!(company: company, email: recipient.email, reason: 'unsubscribed')

        result = described_class.call(campaign: campaign, action: 'retry_failed')
        expect(result[:retried_count]).to eq(0)
        expect(recipient.reload.status).to eq('unsubscribed')
        expect(email_msg.reload.status).to eq('failed')
      end

      it 'does not modify sent, delivered, or unsubscribed recipients/messages' do
        campaign.update!(status: 'failed')
        rec_sent = create(:sales_campaign_recipient, campaign: campaign, status: 'sent')
        rec_deliv = create(:sales_campaign_recipient, campaign: campaign, status: 'delivered')
        rec_unsub = create(:sales_campaign_recipient, campaign: campaign, status: 'unsubscribed')

        msg_sent = create(:sales_email_message, company: company, sales_campaign_id: campaign.id, sales_campaign_recipient_id: rec_sent.id, status: 'sent')
        msg_deliv = create(:sales_email_message, company: company, sales_campaign_id: campaign.id, sales_campaign_recipient_id: rec_deliv.id, status: 'delivered')

        result = described_class.call(campaign: campaign, action: 'retry_failed')
        expect(result[:retried_count]).to eq(0)

        expect(rec_sent.reload.status).to eq('sent')
        expect(rec_deliv.reload.status).to eq('delivered')
        expect(rec_unsub.reload.status).to eq('unsubscribed')
        expect(msg_sent.reload.status).to eq('sent')
        expect(msg_deliv.reload.status).to eq('delivered')
      end

      it 'allows failed recipient without EmailMessage to be re-enqueued to pending' do
        campaign.update!(status: 'failed')
        recipient_no_msg = create(:sales_campaign_recipient, campaign: campaign, status: 'failed')

        result = described_class.call(campaign: campaign, action: 'retry_failed')
        expect(result[:retried_count]).to eq(1)
        expect(recipient_no_msg.reload.status).to eq('pending')
      end

      it 'prevents concurrent retry from creating a second EmailMessage' do
        campaign.update!(status: 'failed')
        recipient = create(:sales_campaign_recipient, campaign: campaign, status: 'failed')
        create(:sales_email_message, company: company, sales_campaign_id: campaign.id, sales_campaign_recipient_id: recipient.id, status: 'failed')

        described_class.call(campaign: campaign, action: 'retry_failed')
        expect {
          described_class.call(campaign: campaign, action: 'retry_failed')
        }.not_to change(Sales::EmailMessage, :count)
      end
    end
  end
end
