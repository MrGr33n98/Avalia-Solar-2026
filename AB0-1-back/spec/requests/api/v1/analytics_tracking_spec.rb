# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Analytics tracking endpoint', type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }
  let(:tracked_at) { Time.zone.parse('2026-03-11T12:34:56Z') }

  before do
    allow_any_instance_of(Api::V1::AnalyticsController).to receive(:authenticate_api_user).and_return(true)
    allow_any_instance_of(Api::V1::AnalyticsController).to receive(:current_user).and_return(user)
    allow(Rails.logger).to receive(:info)
  end

  describe 'POST /api/v1/analytics/track' do
    it 'persists the provided tracked_at and canonicalizes legacy aliases' do
      expect do
        post '/api/v1/analytics/track', params: {
          company_id: company.id,
          event_id: 'evt_legacy_alias_123',
          event_type: 'view',
          tracked_at: tracked_at.iso8601,
          metadata: {
            session_id: 'sess_123',
            page: '/companies/solar-prime'
          }
        }
      end.to change(AnalyticsEvent, :count).by(1)

      expect(response).to have_http_status(:ok)
      event = AnalyticsEvent.order(:created_at).last

      aggregate_failures do
        expect(event.event_type).to eq('profile_view')
        expect(event.event_id).to eq('evt_legacy_alias_123')
        expect(event.tracked_at.to_i).to eq(tracked_at.to_i)
      end
    end

    it 'logs deprecation telemetry when a legacy alias is used' do
      post '/api/v1/analytics/track', params: {
        company_id: company.id,
        event_type: 'view',
        tracked_at: tracked_at.iso8601,
        metadata: {
          session_id: 'sess_alias_123',
          page: '/companies/solar-prime'
        }
      }

      expect(Rails.logger).to have_received(:info).with(
        a_string_matching(/analytics_legacy_alias/)
      )
    end

    it 'canonicalizes frontend company profile and CTA taxonomy for dashboard metrics' do
      post '/api/v1/analytics/track', params: {
        company_id: company.id,
        event_id: 'evt_company_profile_new_taxonomy',
        event_type: 'company_profile_viewed',
        tracked_at: tracked_at.iso8601,
        metadata: {
          session_id: 'sess_profile_new_taxonomy'
        }
      }

      post '/api/v1/analytics/track', params: {
        company_id: company.id,
        event_id: 'evt_company_cta_new_taxonomy',
        event_type: 'company_cta_whatsapp',
        tracked_at: tracked_at.iso8601,
        metadata: {
          session_id: 'sess_cta_new_taxonomy'
        }
      }

      events = AnalyticsEvent.where(event_id: [
        'evt_company_profile_new_taxonomy',
        'evt_company_cta_new_taxonomy'
      ]).index_by(&:event_id)

      aggregate_failures do
        expect(response).to have_http_status(:ok)
        expect(events['evt_company_profile_new_taxonomy'].event_type).to eq('profile_view')
        expect(events['evt_company_cta_new_taxonomy'].event_type).to eq('cta_click')
        expect(events['evt_company_cta_new_taxonomy'].metadata['cta_type']).to eq('whatsapp')
      end
    end
  end
end
