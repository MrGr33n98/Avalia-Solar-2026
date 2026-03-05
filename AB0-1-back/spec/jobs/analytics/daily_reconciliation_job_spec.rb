# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Analytics::DailyReconciliationJob, type: :job do
  let(:company) { create(:company) }
  let(:day) { Date.yesterday }
  let(:range) { day.beginning_of_day..day.end_of_day }

  describe '#perform' do
    context 'when there is a discrepancy' do
      before do
        # Canonical: 10 views, 5 leads
        create(:company_daily_stat, company: company, day: day, profile_views: 10, leads: 5)
        
        # Observed: 12 views (20% delta), 5 leads (0% delta)
        12.times { create(:analytics_event, company: company, event_type: 'profile_view', tracked_at: day.to_time + 12.hours) }
        5.times do
          Analytics::TrackEventService.call(
            company_id: company.id,
            event_type: 'lead_created',
            tracked_at: day.to_time + 12.hours
          )
        end
      end

      it 'creates reconciliation records with correct status' do
        expect {
          described_class.new.perform(day)
        }.to change(AnalyticsReconciliation, :count).by(2)

        view_recon = AnalyticsReconciliation.find_by(metric_name: 'profile_views', company_id: company.id)
        expect(view_recon.canonical_value).to eq(10)
        expect(view_recon.observed_value).to eq(12)
        expect(view_recon.status).to eq('critical') # 20% > 5%

        lead_recon = AnalyticsReconciliation.find_by(metric_name: 'leads', company_id: company.id)
        expect(lead_recon.canonical_value).to eq(5)
        expect(lead_recon.observed_value).to eq(5)
        expect(lead_recon.status).to eq('ok')
      end

      it 'logs a critical discrepancy' do
        expect(Rails.logger).to receive(:error).with(/\[AnalyticsReconciliation\]\[CRITICAL\]/)
        described_class.new.perform(day)
      end
    end

    context 'when metrics match' do
      before do
        create(:company_daily_stat, company: company, day: day, profile_views: 100, leads: 10)
        100.times { create(:analytics_event, company: company, event_type: 'profile_view', tracked_at: day.to_time + 12.hours) }
        10.times do
          Analytics::TrackEventService.call(
            company_id: company.id,
            event_type: 'lead_created',
            tracked_at: day.to_time + 12.hours
          )
        end
      end

      it 'creates reconciliation records with ok status' do
        described_class.new.perform(day)
        
        expect(AnalyticsReconciliation.where(status: 'ok').count).to eq(2)
      end
    end

    context 'when metrics have a small discrepancy (warn)' do
      before do
        # 100 vs 97 = 3% delta (warn)
        create(:company_daily_stat, company: company, day: day, profile_views: 100)
        97.times { create(:analytics_event, company: company, event_type: 'profile_view', tracked_at: day.to_time + 12.hours) }
      end

      it 'marks as warn' do
        described_class.new.perform(day)
        recon = AnalyticsReconciliation.find_by(metric_name: 'profile_views')
        expect(recon.status).to eq('warn')
      end
    end
  end
end
