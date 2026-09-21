# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Ga4Service do
  describe '.fetch_engagement_metrics' do
    let(:client) { instance_double('GoogleAnalyticsDataClient') }
    let(:metric_value) { Struct.new(:value) }
    let(:row) { Struct.new(:metric_values) }
    let(:response) do
      Struct.new(:rows).new([
                              row.new([
                                        metric_value.new('143'),
                                        metric_value.new('0.382'),
                                        metric_value.new('2.7'),
                                        metric_value.new('0.618')
                                      ])
                            ])
    end

    before do
      allow(described_class).to receive(:google_analytics_data_client).and_return(client)
      allow(client).to receive(:run_report)
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with('GA4_SERVICE_ACCOUNT_JSON').and_return('{"type":"service_account"}')
      allow(ENV).to receive(:[]).with('GOOGLE_APPLICATION_CREDENTIALS').and_return(nil)
      allow(ENV).to receive(:[]).with('GOOGLE_CLOUD_PROJECT').and_return(nil)
      allow(ENV).to receive(:[]).with('GA4_MEASUREMENT_ID').and_return(nil)
      allow(ENV).to receive(:[]).with('GA4_API_SECRET').and_return(nil)
    end

    it 'usa a Data API mesmo sem credenciais do Measurement Protocol' do
      allow(client).to receive(:run_report).and_return(response)

      result = described_class.fetch_engagement_metrics(property_id: '123456789')

      expect(client).to have_received(:run_report).with(hash_including(property: 'properties/123456789'))
      expect(result).to eq(
        avg_time_on_page_seconds: 143,
        bounce_rate_percent: 38.2,
        pages_per_session: 2.7,
        engagement_rate_percent: 61.8
      )
    end

    it 'rejeita measurement id no campo ga4_property_id da Data API' do
      allow(Rails.logger).to receive(:warn)

      result = described_class.fetch_engagement_metrics(property_id: 'G-ABCDEFG123')

      expect(result).to be_nil
      expect(client).not_to have_received(:run_report)
      expect(Rails.logger).to have_received(:warn).with(/ga4_property_id inválido/)
    end
  end
end
