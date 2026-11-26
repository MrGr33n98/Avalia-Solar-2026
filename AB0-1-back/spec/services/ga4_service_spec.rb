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

  describe '.track (Measurement Protocol - TEST-05)' do
    let(:event_name) { 'generate_lead' }
    let(:properties) do
      {
        company_id: 42,
        user_id: 'user_123',
        lead_id: 999,
        category: 'Inversores'
      }
    end

    context 'quando GA4_MEASUREMENT_ID ou GA4_API_SECRET estiverem ausentes' do
      before do
        allow(ENV).to receive(:[]).and_call_original
        allow(ENV).to receive(:[]).with('GA4_MEASUREMENT_ID').and_return(nil)
        allow(ENV).to receive(:[]).with('GA4_API_SECRET').and_return(nil)
      end

      it 'não dispara requisição HTTP e aborta silenciosamente' do
        expect(Net::HTTP).not_to receive(:new)
        described_class.track(event_name, properties)
      end
    end

    context 'quando GA4_MEASUREMENT_ID e GA4_API_SECRET estiverem configurados' do
      let(:http_double) { instance_double(Net::HTTP) }
      let(:response_double) { instance_double(Net::HTTPResponse, code: '204') }

      before do
        allow(ENV).to receive(:[]).and_call_original
        allow(ENV).to receive(:[]).with('GA4_MEASUREMENT_ID').and_return('G-424024013')
        allow(ENV).to receive(:[]).with('GA4_API_SECRET').and_return('secret_test_xyz')
      end

      it 'dispara payload estruturado com client_id e eventos sanitizados via POST' do
        allow(Net::HTTP).to receive(:new).and_return(http_double)
        allow(http_double).to receive(:use_ssl=)
        allow(http_double).to receive(:read_timeout=)
        allow(http_double).to receive(:open_timeout=)
        
        expect(http_double).to receive(:request) do |request|
          expect(request.path).to include('measurement_id=G-424024013')
          expect(request.path).to include('api_secret=secret_test_xyz')
          expect(request['Content-Type']).to eq('application/json')

          body = JSON.parse(request.body)
          expect(body['client_id']).to eq('user_123')
          expect(body['events'].first['name']).to eq('generate_lead')
          expect(body['events'].first['params']['company_id']).to eq(42)
          response_double
        end

        thread = described_class.track(event_name, properties)
        thread&.join
      end
    end
  end
end
