# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::SyncEmailAccountJob, type: :job do
  include ActiveJob::TestHelper

  let(:company) { create(:company) }
  let(:user) { create(:user, company: company, role: 'admin') }
  let(:email_account) do
    Sales::EmailAccount.create!(
      company: company,
      user: user,
      email: 'felipe@avaliasolar.com.br',
      provider: 'zoho',
      provider_account_id: 'zoho_acc_123',
      provider_region: 'us',
      connection_status: 'healthy',
      sync_status: 'idle',
      access_token_encrypted: Sales::EmailSync::TokenVault.encrypt('valid-access-token'),
      refresh_token_encrypted: Sales::EmailSync::TokenVault.encrypt('valid-refresh-token'),
      access_token_expires_at: 1.hour.from_now
    )
  end

  let(:mock_client) { instance_double(Sales::EmailSync::ZohoApiClient) }

  before do
    allow(Sales::EmailSync::TokenRefresher).to receive(:refresh_if_needed!).with(email_account).and_return('valid-access-token')
    allow(Sales::EmailSync::ZohoApiClient).to receive(:new).with('us').and_return(mock_client)
  end

  describe 'contrato de schema com Sales::EmailSyncState (GAP-01 / GAP-08)' do
    it 'possui todas as colunas utilizadas pelo checkpoint de sincronização' do
      expected_columns = %w[
        company_id
        sales_email_account_id
        provider_folder_id
        cursor
        high_watermark_at
        last_started_at
        last_succeeded_at
        last_error_code
        retry_count
      ]
      expect(Sales::EmailSyncState.column_names).to include(*expected_columns)
    end

    it 'não invoca imported_count em Sales::EmailSyncState' do
      source_file = described_class.instance_method(:perform).source_location.first
      expect(File.read(source_file)).not_to include('sync_state.imported_count')
    end
  end

  describe '#perform' do
    it 'importa mensagens inbound e outbound, atualiza Sales::EmailSyncState e reconcilia contadores' do
      allow(mock_client).to receive(:list_folders).and_return([
        { folder_id: 'folder_inbox', name: 'Inbox', type: 'Inbox', unread_count: 1, total_count: 1 },
        { folder_id: 'folder_sent', name: 'Sent', type: 'Sent', unread_count: 0, total_count: 1 }
      ])

      allow(mock_client).to receive(:list_messages).with(
        hash_including(folder_id: 'folder_inbox')
      ).and_return([
        {
          message_id: 'msg_in_1',
          thread_id: 'th_100',
          folder_id: 'folder_inbox',
          subject: 'Orçamento Solar 50kWp',
          from: 'cliente@empresa.com.br',
          to: 'felipe@avaliasolar.com.br',
          received_time: (Time.current.to_f * 1000).to_i.to_s,
          summary: 'Gostaria de receber proposta comercial.'
        }
      ])

      allow(mock_client).to receive(:fetch_message_headers).and_return({
        message_id: '<msg_in_1@zoho.com>',
        in_reply_to: nil,
        references: nil,
        raw: {}
      })

      allow(mock_client).to receive(:list_messages).with(
        hash_including(folder_id: 'folder_sent')
      ).and_return([
        {
          message_id: 'msg_out_1',
          thread_id: 'th_100',
          folder_id: 'folder_sent',
          subject: 'Re: Orçamento Solar 50kWp',
          from: 'felipe@avaliasolar.com.br',
          to: 'cliente@empresa.com.br',
          received_time: (Time.current.to_f * 1000).to_i.to_s,
          summary: 'Segue proposta anexa.'
        }
      ])

      described_class.perform_now(email_account.id, mode: 'incremental')

      email_account.reload
      expect(email_account.sync_status).to eq('healthy')
      expect(email_account.sync_error).to be_nil
      expect(email_account.messages_imported).to eq(2)
      expect(Sales::EmailMessage.where(sales_email_account_id: email_account.id).count).to eq(2)
      expect(Sales::EmailThread.where(sales_email_account_id: email_account.id).count).to eq(1)

      inbox_state = Sales::EmailSyncState.find_by(sales_email_account_id: email_account.id, provider_folder_id: 'folder_inbox')
      expect(inbox_state).to be_present
      expect(inbox_state.cursor).to eq('completed_page:1')
      expect(inbox_state.last_succeeded_at).to be_present
      expect(inbox_state.retry_count).to eq(0)
    end
  end
end
