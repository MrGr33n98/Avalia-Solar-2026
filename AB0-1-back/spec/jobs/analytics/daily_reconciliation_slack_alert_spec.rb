# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Analytics::DailyReconciliationJob do
  let(:company) { create(:company) }
  let(:day) { Date.yesterday }

  describe 'Critical Discrepancy Alerting' do
    before do
      # Set up exactly ONE metric with critical discrepancy
      create(:company_daily_stat, company: company, day: day, profile_views: 100, leads: 10)
      
      # Stub observed counts: 
      # profile_views: 50 (Critical Delta: 50% vs 5% Threshold)
      # leads: 10 (OK Delta: 0% vs 2% Threshold)
      allow_any_instance_of(described_class).to receive(:observed_platform_event_count) do |_, args|
        args[:event_type] == 'profile_view' ? 50 : 10
      end
    end

    it 'triggers exactly one Slack alert when status is critical' do
      expect(SlackNotificationService).to receive(:notify_reconciliation_alert).once
      described_class.new.perform(day.to_s)
    end
  end
end
