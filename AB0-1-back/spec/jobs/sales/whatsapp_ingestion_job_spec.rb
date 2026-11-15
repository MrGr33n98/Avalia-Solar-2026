# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::WhatsappIngestionJob, type: :job do
  let(:company) { create(:company) }
  let(:phone) { '+5511988887777' }
  let(:record) do
    VoiceReviewMessage.create!(
      provider: 'waha', provider_session: 'avalia-solar-voice',
      provider_message_id: 'waha-crm-1', message_type: 'text',
      payload_digest: Digest::SHA256.hexdigest('test'),
      payload_minimal: { 'timestamp' => Time.current.to_i, 'type' => 'text' },
      processed_at: Time.current
    )
  end

  before do
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with('WHATSAPP_CRM_ENABLED', 'false').and_return('true')
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with('WHATSAPP_CRM_TENANT_COMPANY_ID').and_return(company.id.to_s)
    allow(Outbox).to receive(:record!)
  end

  it 'stores only metadata and creates one actionable alert' do
    encrypted = described_class.encrypt_contact(phone)
    expect do
      described_class.perform_now(record.id, 'pricing_requested', encrypted)
    end.to change(Sales::WhatsappThread, :count).by(1)
      .and change(Sales::WhatsappMessage, :count).by(1)
      .and change(Sales::FounderInboxItem, :count).by(1)

    thread = Sales::WhatsappThread.last
    expect(thread.contact_hash).not_to include('5511')
    expect(thread.sales_account_id).to be_nil
    expect(thread.messages.first.intent).to eq('pricing_requested')
    expect(thread.messages.first.attributes.keys).not_to include('body', 'phone', 'text')
  end

  it 'deduplicates a retry of the same WAHA message' do
    encrypted = described_class.encrypt_contact(phone)
    2.times { described_class.perform_now(record.id, 'human_requested', encrypted) }
    expect(Sales::WhatsappMessage.count).to eq(1)
    expect(Sales::FounderInboxItem.count).to eq(1)
  end

  it 'remains disabled unless explicitly enabled' do
    allow(ENV).to receive(:fetch).with('WHATSAPP_CRM_ENABLED', 'false').and_return('false')
    described_class.perform_now(record.id, 'pricing_requested', described_class.encrypt_contact(phone))
    expect(Sales::WhatsappThread.count).to eq(0)
  end

  it 'rejects unsupported phone formats instead of guessing a contact identity' do
    expect(described_class.normalized_phone('123@lid')).to be_nil
    expect(described_class.normalized_phone('5511988887777@c.us')).to eq(phone)
  end
end
