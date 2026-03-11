require 'rails_helper'

RSpec.describe CompanyWebhook, type: :model do
  it 'is valid with supported events only' do
    webhook = build(:company_webhook, events: ['intent.hot', 'lead.captured'])

    expect(webhook).to be_valid
  end

  it 'rejects unsupported events' do
    webhook = build(:company_webhook, events: ['intent.hot', 'intent.unknown'])

    expect(webhook).not_to be_valid
    expect(webhook.errors[:events]).to include('contains unsupported events: intent.unknown')
  end
end
