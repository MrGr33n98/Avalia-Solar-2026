require 'rails_helper'

RSpec.describe StitchIdentityJob, type: :job do
  include ActiveJob::TestHelper

  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }
  let!(:session) do
    create(
      :anonymous_session,
      anonymous_id: 'anon-123',
      visited_company_ids: [company.id],
      first_seen_at: 2.days.ago,
      last_seen_at: 1.hour.ago
    )
  end
  let!(:activity) do
    create(
      :buyer_intent_activity,
      company: company,
      anonymous_id: 'anon-123',
      user: nil,
      session_id: 'session-1',
      signal_type: 'copy_clipboard',
      signal_category: 'contact_intent'
    )
  end
  let!(:intent_score) do
    create(
      :intent_score,
      company: company,
      anonymous_id: 'anon-123',
      total_score: 64,
      total_signals_count: 3,
      hot_signals_count: 2,
      last_interaction_at: 30.minutes.ago
    )
  end

  before do
    ActiveJob::Base.queue_adapter = :test
    clear_enqueued_jobs
  end

  after do
    clear_enqueued_jobs
  end

  it 'migrates activities and scores from anonymous to identified user' do
    described_class.perform_now(user.id, 'anon-123')

    expect(activity.reload.user_id).to eq(user.id)
    expect(session.reload.status).to eq('identified')

    intent_score.reload
    expect(intent_score.lead_id).to eq(user.id)
    expect(intent_score.anonymous_id).to be_nil

    recalculation_job = enqueued_jobs.find { |job| job[:job] == CalculateBuyerIntentJob }
    expect(recalculation_job).to be_present
    expect(recalculation_job[:args].first).to eq(company.id)
    expect(recalculation_job[:args].last).to include('lead_id' => user.id)
  end
end
