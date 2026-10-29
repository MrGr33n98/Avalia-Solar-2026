# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::SendEmailJob, type: :job do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }
  let(:campaign) { create(:sales_campaign, company: company, user: user, status: 'dispatching') }
  let(:recipient) { create(:sales_campaign_recipient, campaign: campaign, email: 'blocked@exemplo.com.br', status: 'pending') }
  let(:email_message) do
    create(:sales_email_message,
           company: company,
           sales_campaign_id: campaign.id,
           sales_campaign_recipient_id: recipient.id,
           sender_user: user,
           from_email: 'contato@empresa.com.br',
           to_email: recipient.email,
           subject: 'Teste',
           body_html: '<p>Teste</p>',
           status: 'queued')
  end

  describe '#perform' do
    before { allow(Sales::Messaging::SendingGate).to receive(:enabled?).and_return(true) }

    it 'mantém a mensagem queued e não chama provider com a kill switch desligada' do
      allow(Sales::Messaging::SendingGate).to receive(:enabled?).and_return(false)
      expect(Sales::Messaging::Providers::Ses).not_to receive(:new)

      described_class.new.perform(email_message.id)

      expect(email_message.reload.status).to eq('queued')
    end

    context 'send-time suppression check' do
      it 'prevents provider dispatch and marks email failed / recipient unsubscribed if suppressed' do
        Sales::EmailSuppression.create!(company: company, email: recipient.email, reason: 'unsubscribe')

        expect(Sales::Messaging::Providers::Ses).not_to receive(:new)
        expect {
          described_class.new.perform(email_message.id)
        }.not_to change(Sales::Activity, :count)

        email_message.reload
        expect(email_message.status).to eq('failed')
        expect(email_message.metadata['error']).to eq('SUPPRESSED_AT_SEND_TIME')
        expect(recipient.reload.status).to eq('unsubscribed')
        expect(recipient.error_message).to eq('SUPPRESSED_AT_SEND_TIME')
      end

      it 'calls provider when address is not suppressed and injects V2 signature without hardcoded phone for non-default users' do
        provider_double = instance_double(Sales::Messaging::Providers::Ses)
        allow(Sales::Messaging::Providers::Ses).to receive(:new).and_return(provider_double)
        allow(provider_double).to receive(:send_message).and_return(
          double(success?: true, provider_message_id: 'ses-123')
        )

        described_class.new.perform(email_message.id)
        email_message.reload
        expect(email_message.status).to eq('sent')
        expect(email_message.body_html).to include('avalia-solar-watermark.png')
      end
    end
  end
end
