require 'rails_helper'

RSpec.describe NotifyIntentChangeJob, type: :job do
  include ActiveJob::TestHelper

  before do
    ActiveJob::Base.queue_adapter = :test
    clear_enqueued_jobs
  end

  after do
    clear_enqueued_jobs
  end

  it 'queues webhook deliveries for enterprise companies on actionable scores' do
    company = create(:company, intent_tier: 'enterprise')
    webhook = create(:company_webhook, company: company, events: ['intent.hot'])
    score = create(:intent_score, company: company, anonymous_id: 'anon-hot', total_score: 62)

    described_class.perform_now(score.id)

    delivery_job = enqueued_jobs.find { |job| job[:job] == WebhookDeliveryJob }

    expect(delivery_job).to be_present
    expect(delivery_job[:args][0]).to eq(webhook.id)
    expect(delivery_job[:args][1]).to eq('intent.hot')
    expect(delivery_job[:args][2]).to include(
      'intent_score_id' => score.id,
      'company_id' => company.id,
      'intent_level' => 'hot'
    )
  end

  it 'does not queue webhook deliveries for non-enterprise companies' do
    company = create(:company, intent_tier: 'pro')
    create(:company_webhook, company: company, events: ['intent.hot'])
    score = create(:intent_score, company: company, anonymous_id: 'anon-hot', total_score: 62)

    described_class.perform_now(score.id)

    expect(enqueued_jobs.map { |job| job[:job] }).not_to include(WebhookDeliveryJob)
  end
end
