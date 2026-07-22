# frozen_string_literal: true

require 'rails_helper'
require 'ostruct'

RSpec.describe Chat::CRMWebhookDispatchJob, type: :job do
  let(:company) { create(:company) }
  let(:session) { create(:chat_session, company: company) }
  let(:lead) { create(:chat_lead, chat_session: session, assigned_company: company) }
  let!(:webhook) { create(:company_webhook, company: company, events: ['lead.captured']) }

  before do
    allow(Rails).to receive(:cache).and_return(ActiveSupport::Cache::MemoryStore.new)
  end

  it 'delivers once inside the idempotency window' do
    response = instance_double(Faraday::Response, status: 200)
    expect(Faraday).to receive(:post).once.and_return(response)

    described_class.perform_now(lead.id)
    described_class.perform_now(lead.id)
  end

  it 'sends an idempotency key and five-second timeouts' do
    headers = {}
    options = OpenStruct.new

    allow(Faraday).to receive(:post) do |_url, &block|
      request = OpenStruct.new(headers: headers, options: options, body: nil)
      block.call(request)
      instance_double(Faraday::Response, status: 200)
    end

    described_class.perform_now(lead.id)

    expect(headers['Idempotency-Key']).to include("chat-lead:#{lead.id}:lead.captured")
    expect(options.timeout).to eq(5)
    expect(options.open_timeout).to eq(5)
  end

  it 'raises a retryable error for server failures' do
    allow(Faraday).to receive(:post).and_return(instance_double(Faraday::Response, status: 503))

    expect { described_class.new.send(:deliver_once, webhook, 'lead.captured', {}, lead.id) }
      .to raise_error(described_class::TransientDeliveryError, /HTTP 503/)
  end

  it 'classifies client failures as permanent' do
    allow(Faraday).to receive(:post).and_return(instance_double(Faraday::Response, status: 422))

    expect { described_class.new.send(:deliver_once, webhook, 'lead.captured', {}, lead.id) }
      .to raise_error(described_class::PermanentDeliveryError, /HTTP 422/)
  end
end
