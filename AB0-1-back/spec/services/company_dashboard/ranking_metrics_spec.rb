# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyDashboard::RankingMetrics do
  let(:counter) { instance_double('Yabeda::Counter') }
  let(:histogram) { instance_double('Yabeda::Histogram') }
  let(:gauge) { instance_double('Yabeda::Gauge') }

  before do
    allow(counter).to receive(:increment)
    allow(histogram).to receive(:measure)
    allow(gauge).to receive(:set)
    allow(described_class).to receive(:collector) do |metric|
      case metric
      when :ranking_requests_total, :ranking_failures_total then counter
      when :ranking_api_duration, :ranking_eligible_population, :ranking_worker_duration then histogram
      when :ranking_snapshot_freshness_hours then gauge
      end
    end
  end

  it 'usa measure para histogramas na API do Yabeda' do
    described_class.request(mode: 'preview', status: 'preview', duration_ms: 125, population: 41)

    expect(histogram).to have_received(:measure).with({ mode: 'preview', status: 'preview' }, 0.125)
    expect(histogram).to have_received(:measure).with({ mode: 'preview' }, 41.0)
  end

  it 'não interrompe uma resposta válida quando o collector falha' do
    allow(histogram).to receive(:measure).and_raise(NoMethodError, 'collector indisponível')

    expect { described_class.request(mode: 'canonical', status: 'ready', duration_ms: 50, population: 10) }
      .not_to raise_error
  end

  it 'não interrompe o worker quando o collector falha' do
    allow(histogram).to receive(:measure).and_raise(StandardError, 'collector indisponível')

    expect { described_class.worker(duration_ms: 500, snapshots: 1) }.not_to raise_error
  end
end
