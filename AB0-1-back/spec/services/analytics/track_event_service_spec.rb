require 'rails_helper'

RSpec.describe Analytics::TrackEventService do
  let(:company) { create(:company) }
  let(:other_company) { create(:company) }

  describe '.call global events without company_id' do
    it 'accepts page_view without persisting an analytics event' do
      result = nil

      expect do
        result = described_class.call(
          company_id: nil,
          event_type: 'page_view',
          metadata: { path: '/categories/energia-solar' }
        )
      end.not_to change(AnalyticsEvent, :count)

      aggregate_failures do
        expect(result.ok).to be(true)
        expect(result.event).to be_nil
        expect(result.error).to eq('global_event_without_company_skipped')
      end
    end

    it 'accepts web_vital without persisting an analytics event' do
      result = nil

      expect do
        result = described_class.call(
          company_id: nil,
          event_type: 'web_vital',
          metadata: { path: '/categories/energia-solar' }
        )
      end.not_to change(AnalyticsEvent, :count)

      aggregate_failures do
        expect(result.ok).to be(true)
        expect(result.event).to be_nil
        expect(result.error).to eq('global_event_without_company_skipped')
      end
    end
  end

  describe '.call authorization behavior' do
    context 'when company user tracks internal telemetry on another company' do
      let(:user) { create(:user, role: 'company', company: company) }

      it 'accepts the event' do
        result = described_class.call(
          company_id: other_company.id,
          event_type: 'Theme Changed',
          user: user,
          metadata: { path: '/dashboard/company' }
        )

        expect(result.ok).to be(true)
      end
    end

    context 'when company user tracks public event on another company' do
      let(:user) { create(:user, role: 'company', company: company) }

      it 'accepts the event' do
        result = described_class.call(
          company_id: other_company.id,
          event_type: 'profile_view',
          user: user,
          metadata: { path: '/companies/foo' }
        )

        expect(result.ok).to be(true)
      end
    end

    context 'when company user tracks restricted event on another company' do
      let(:user) { create(:user, role: 'company', company: company) }

      it 'rejects the event' do
        result = described_class.call(
          company_id: other_company.id,
          event_type: 'member_assigned',
          user: user,
          metadata: { path: '/dashboard/company' }
        )

        expect(result.ok).to be(false)
        expect(result.error).to include('Forbidden')
      end
    end
  end
end
