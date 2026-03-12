require 'rails_helper'

RSpec.describe SaasLeads::LeadTimeline do
  describe 'timeline aggregation' do
    let!(:company) { create(:company) }
    let!(:lead) do
      create(
        :lead,
        company: company,
        created_at: 12.hours.ago,
        wizard_answers: {
          anonymous_id: 'anon-123',
          session_id: 'sid-123'
        },
        attribution_json: {
          anonymous_id: 'anon-123',
          session_id: 'sid-123'
        }
      )
    end

    before do
      AnalyticsEvent.create!(
        company_id: company.id,
        event_type: 'faq_interaction',
        event_id: SecureRandom.uuid,
        tracked_at: 13.hours.ago,
        metadata: {
          anonymous_id: 'anon-123',
          session_id: 'sid-123',
          page_path: '/faq'
        }
      )
      AnalyticsEvent.create!(
        company_id: company.id,
        event_type: 'search_performance',
        event_id: SecureRandom.uuid,
        tracked_at: 11.hours.ago,
        metadata: {
          anonymous_id: 'anon-123',
          session_id: 'sid-123',
          search_term: 'inversor hibrido'
        }
      )
    end

    it 'builds pre and post lead timeline from real analytics data' do
      timeline = described_class.new(lead, window_days: 7)

      expect(timeline.events.map(&:event_type)).to include('lead_created')
      expect(timeline.events.map(&:event_type)).to include('faq_interaction')
      expect(timeline.events.map(&:event_type)).to include('search_performance')

      expect(timeline.summary[:pre_lead_events]).to be >= 1
      expect(timeline.summary[:post_lead_events]).to be >= 1
      expect(timeline.summary[:unique_sessions_count]).to be >= 1
      expect(timeline.tooltip_text).to include('Historico real')
      expect(timeline.tooltip_text).to include('anonymous_id')
    end
  end

  if defined?(BuyerIntentActivity) && BuyerIntentActivity.table_exists?
    describe 'buyer intent merge' do
      let!(:company) { create(:company) }
      let!(:lead) do
        create(
          :lead,
          company: company,
          created_at: 4.hours.ago,
          wizard_answers: { anonymous_id: 'anon-buyer', session_id: 'sid-buyer' }
        )
      end

      it 'includes buyer intent activities in timeline' do
        create(
          :buyer_intent_activity,
          company: company,
          anonymous_id: 'anon-buyer',
          session_id: 'sid-buyer',
          signal_type: 'comparison_usage',
          signal_category: 'research_intent',
          tracked_at: 5.hours.ago
        )

        timeline = described_class.new(lead, window_days: 7)
        expect(timeline.events.map(&:source)).to include('buyer_intent_activity')
      end
    end
  end
end
