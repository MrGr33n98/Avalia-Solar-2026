require 'rails_helper'

RSpec.describe 'Analytics Async Integration', type: :model do
  # Isolate analytics testing from external workers (not Rails instrumentation)
  before do
    allow(RoiCalculationWorker).to receive(:perform_async)
    allow(LeadScoringWorker).to receive(:perform_async)
  end

  describe 'Lead analytics tracking' do
    let(:company) { create(:company) }
    
    it 'enqueues analytics job instead of calling service directly' do
      expect(Analytics::TrackEventJob).to receive(:perform_later).with(
        hash_including(
          company_id: company.id,
          event_type: 'lead_created'
        )
      )
      
      # This should trigger the after_commit callback
      create(:lead, company: company)
    end

    it 'does not block lead creation if job enqueueing fails' do
      allow(Analytics::TrackEventJob).to receive(:perform_later).and_raise(StandardError, 'Redis down')
      allow(Rails.logger).to receive(:warn)

      # Lead should still be created successfully
      lead = nil
      expect {
        lead = create(:lead, company: company)
      }.not_to raise_error

      expect(lead).to be_persisted
      expect(lead.company).to eq(company)
      expect(Rails.logger).to have_received(:warn).with(
        /Failed to enqueue lead tracking/
      )
    end
  end

  describe 'Review analytics tracking' do
    let(:company) { create(:company) }
    
    it 'enqueues analytics job instead of calling service directly' do
      expect(Analytics::TrackEventJob).to receive(:perform_later).with(
        hash_including(
          company_id: company.id,
          event_type: 'review_created'
        )
      )
      
      # This should trigger the after_commit callback
      create(:review, company: company)
    end

    it 'does not block review creation if job enqueueing fails' do
      allow(Analytics::TrackEventJob).to receive(:perform_later).and_raise(StandardError, 'Redis down')
      allow(Rails.logger).to receive(:warn)

      # Review should still be created successfully
      review = nil
      expect {
        review = create(:review, company: company)
      }.not_to raise_error

      expect(review).to be_persisted
      expect(review.company).to eq(company)
      expect(Rails.logger).to have_received(:warn).with(
        /Failed to enqueue review tracking/
      )
    end
  end

  describe 'Company analytics tracking' do
    let(:company) { create(:company, status: 'pending') } # Explicit initial status
    let(:valid_plan) { create(:plan) }
    
    it 'enqueues analytics job for plan changes' do
      expect(Analytics::TrackEventJob).to receive(:perform_later).with(
        hash_including(
          company_id: company.id,
          event_type: 'plan_changed'
        )
      )
      
      # This should trigger the after_update_commit callback
      company.update!(plan_id: valid_plan.id)
    end

    it 'enqueues analytics job for company activation' do
      # Start with non-active company
      inactive_company = create(:company, status: 'inactive')
      
      expect(Analytics::TrackEventJob).to receive(:perform_later).with(
        hash_including(
          company_id: inactive_company.id,
          event_type: 'company_activated'
        )
      )
      
      # This should trigger the after_update_commit callback
      inactive_company.update!(status: 'active')
    end

    it 'does not trigger analytics when validation fails' do
      expect(Analytics::TrackEventJob).not_to receive(:perform_later)
      
      # Invalid email should prevent update and callback execution
      expect {
        company.update(email: 'invalid-email-format')
      }.not_to change { company.reload.email }
    end

    it 'preserves company state when analytics job enqueue fails' do
      allow(Analytics::TrackEventJob).to receive(:perform_later).and_raise(StandardError, 'Redis down')
      allow(Rails.logger).to receive(:error)

      # Company update should still succeed
      expect {
        company.update!(plan_id: valid_plan.id)
      }.to change { company.reload.plan_id }.to(valid_plan.id)

      expect(Rails.logger).to have_received(:error).with(
        /Failed to enqueue plan change tracking/
      )
    end
  end
end