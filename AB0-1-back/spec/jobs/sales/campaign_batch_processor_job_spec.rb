# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::CampaignBatchProcessorJob, type: :job do
  let(:company) { create(:company, email: 'contato@empresa.com.br') }
  let(:user) { create(:user, company: company) }
  let(:template) { create(:sales_email_template, company: company, body_html: '<p>Olá {{name}}</p>', subject_template: 'Assunto') }
  let(:campaign) { create(:sales_campaign, company: company, user: user, email_template: template, status: 'dispatching') }
  let(:recipient) { create(:sales_campaign_recipient, campaign: campaign, email: 'lead@exemplo.com.br', status: 'pending') }

  describe '#perform' do
    it 'processes only when campaign is dispatching' do
      campaign.update!(status: 'paused')
      described_class.new.perform(campaign.id, [recipient.id])

      expect(recipient.reload.status).to eq('pending')
    end

    it 'marks campaign failed if sender user_id is missing without falling back to users.first' do
      campaign.update!(user_id: nil)
      described_class.new.perform(campaign.id, [recipient.id])

      expect(campaign.reload.status).to eq('failed')
    end

    it 'treats existing failed EmailMessage as NO-OP in normal batch execution' do
      create(:sales_email_message, company: company, sales_campaign_id: campaign.id, sales_campaign_recipient_id: recipient.id, status: 'failed')

      expect(Sales::SendEmailJob).not_to receive(:perform_now)
      described_class.new.perform(campaign.id, [recipient.id])

      expect(recipient.reload.status).to eq('failed')
    end

    it 'stops processing when campaign status changes to paused or cancelled in middle of batch' do
      recipient_2 = create(:sales_campaign_recipient, campaign: campaign, email: 'lead2@exemplo.com.br', status: 'pending')

      # Mock first send to pause campaign
      allow(Sales::SendEmailJob).to receive(:perform_now) do
        campaign.update!(status: 'paused')
      end

      described_class.new.perform(campaign.id, [recipient.id, recipient_2.id])
      expect(recipient_2.reload.status).to eq('pending')
    end

    it 'ensures only one EmailMessage is created per recipient under concurrency' do
      expect {
        described_class.new.perform(campaign.id, [recipient.id])
      }.to change(Sales::EmailMessage, :count).by(1)

      # Second execution for same recipient is idempotent
      expect {
        described_class.new.perform(campaign.id, [recipient.id])
      }.not_to change(Sales::EmailMessage, :count)
    end
  end
end
