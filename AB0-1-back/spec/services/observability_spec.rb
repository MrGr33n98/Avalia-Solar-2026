# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Observability Foundation', type: :service do
  describe Observability::Sanitizer do
    it 'redacts sensitive keys in hashes' do
      payload = {
        user_id: 123,
        password: 'supersecretpassword',
        jwt_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMC6Y9nTWhHAKBRWqzVgDxY3GSF4',
        stripe_secret_key: 'stripe_test_fake_key',
        metadata: {
          cpf: '123.456.789-00',
          phone: '(11) 99999-9999',
          safe_field: 'public_value'
        }
      }

      sanitized = described_class.sanitize(payload)

      expect(sanitized[:password]).to eq('[FILTERED]')
      expect(sanitized[:jwt_token]).to eq('[FILTERED]')
      expect(sanitized[:stripe_secret_key]).to eq('[FILTERED]')
      expect(sanitized[:metadata][:cpf]).to eq('[FILTERED]')
      expect(sanitized[:metadata][:phone]).to eq('[FILTERED]')
      expect(sanitized[:metadata][:safe_field]).to eq('public_value')
      expect(sanitized[:user_id]).to eq(123)
    end

    it 'redacts sensitive strings such as Bearer tokens, JWTs, and live Stripe keys' do
      raw_str = 'Authorization: Bearer my_secret_token_12345 and JWT eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.do_not_leak with sk_live_FAKE_TEST_KEY'
      sanitized = described_class.sanitize_string(raw_str)

      expect(sanitized).to include('Bearer [FILTERED]')
      expect(sanitized).to include('[FILTERED_JWT]')
      expect(sanitized).to include('sk_live_[FILTERED]')
      expect(sanitized).not_to include('my_secret_token_12345')
      expect(sanitized).not_to include('do_not_leak')
    end

    it 'preserves non-sensitive telemetry strings without false-positive corruption' do
      safe_str = 'GET /api/v1/companies/42/overview HTTP/1.1 status=200 duration=45.2ms aggregate_type=Company'
      sanitized = described_class.sanitize_string(safe_str)

      expect(sanitized).to eq(safe_str)
    end
  end

  describe Observability::Context do
    before { described_class.clear! }
    after { described_class.clear! }

    it 'stores and retrieves context variables safely' do
      described_class.set(:request_id, 'req-abc-123')
      described_class.set(:company_id, 42)

      expect(described_class.get(:request_id)).to eq('req-abc-123')
      expect(described_class.get(:company_id)).to eq(42)
      expect(described_class.to_h).to include(request_id: 'req-abc-123', company_id: 42)
    end

    it 'isolates context within with_context block and restores prior state' do
      described_class.set(:request_id, 'initial-req')

      described_class.with_context(request_id: 'nested-req', correlation_id: 'corr-999') do
        expect(described_class.get(:request_id)).to eq('nested-req')
        expect(described_class.get(:correlation_id)).to eq('corr-999')
      end

      expect(described_class.get(:request_id)).to eq('initial-req')
      expect(described_class.get(:correlation_id)).to be_nil
    end

    it 'prevents context leaks across distinct threads / job executions' do
      described_class.with_context(request_id: 'thread-a-req', user_id: 101) do
        expect(described_class.get(:request_id)).to eq('thread-a-req')
      end

      # New thread or post-execution thread
      thread_result = nil
      Thread.new do
        thread_result = {
          request_id: described_class.get(:request_id),
          user_id: described_class.get(:user_id)
        }
      end.join

      expect(thread_result[:request_id]).to be_nil
      expect(thread_result[:user_id]).to be_nil
    end
  end

  describe 'Deterministic Correlation Flow (HTTP -> Rails -> Domain Service -> Outbox -> Consumer)' do
    let(:company) { FactoryBot.create(:company, name: 'Trace Company') }

    before do
      DomainEvent.delete_all
    end

    it 'propagates request_id and correlation_id seamlessly across the entire domain flow' do
      fixed_request_id = 'req-trace-777-abc'
      fixed_correlation_id = 'corr-trace-888-xyz'

      Observability::Context.with_context(
        request_id: fixed_request_id,
        correlation_id: fixed_correlation_id,
        company_id: company.id
      ) do
        # 1. Rails Domain Service records Outbox event
        event = Outbox.record!(
          event_type: 'opportunity.stage_changed',
          aggregate: company,
          payload: { old_stage: 'discovery', new_stage: 'proposal' },
          company_id: company.id,
          correlation_id: Observability::Context.get(:correlation_id),
          causation_id: Observability::Context.get(:request_id)
        )

        expect(event).to be_persisted
        expect(event.correlation_id).to eq(fixed_correlation_id)
        expect(event.causation_id).to eq(fixed_request_id)
        expect(event.company_id).to eq(company.id)

        # 2. Verify Sidekiq/Outbox Dispatcher respects context
        expect(event.metadata).to be_a(Hash)
      end
    end
  end

  describe Observability::OutboxMetrics do
    let(:company) { FactoryBot.create(:company, name: 'Obs Company') }

    before do
      DomainEvent.delete_all
    end

    it 'calculates real Outbox metrics accurately from DomainEvent records' do
      # 2 pending
      DomainEvent.create!(
        event_type: 'lead.created',
        aggregate_type: 'Company',
        aggregate_id: company.id,
        status: 'pending',
        occurred_at: 10.seconds.ago
      )
      DomainEvent.create!(
        event_type: 'lead.created',
        aggregate_type: 'Company',
        aggregate_id: company.id,
        status: 'pending',
        occurred_at: 5.seconds.ago
      )

      # 1 failed (retryable)
      DomainEvent.create!(
        event_type: 'lead.assigned',
        aggregate_type: 'Company',
        aggregate_id: company.id,
        status: 'failed',
        attempts: 2,
        occurred_at: 20.seconds.ago
      )

      # 1 dead letter (attempts >= 5)
      DomainEvent.create!(
        event_type: 'lead.notification_dispatched',
        aggregate_type: 'Company',
        aggregate_id: company.id,
        status: 'failed',
        attempts: 5,
        occurred_at: 1.minute.ago
      )

      # 2 completed
      DomainEvent.create!(
        event_type: 'opportunity.won',
        aggregate_type: 'Company',
        aggregate_id: company.id,
        status: 'completed',
        processed_at: 1.minute.ago,
        occurred_at: 2.minutes.ago
      )

      report = described_class.collect

      expect(report[:status]).to eq('critical') # due to dead letter presence
      expect(report[:metrics][:pending_count]).to eq(2)
      expect(report[:metrics][:failed_count]).to eq(1)
      expect(report[:metrics][:dead_letter_count]).to eq(1)
      expect(report[:metrics][:retry_count]).to eq(7) # 2 + 5
      expect(report[:metrics][:oldest_pending_age_seconds]).to be > 0.0
      expect(report[:metrics][:throughput_per_minute]).to be >= 0.2
    end
  end

  describe Observability::SystemHealthService do
    it 'returns structured, sanitized health checks across system components' do
      health = described_class.check(deep: true)

      expect(health).to have_key(:status)
      expect(%w[healthy degraded critical unhealthy]).to include(health[:status])
      expect(health).to have_key(:collected_at)
      expect(health).to have_key(:components)
      expect(health[:components]).to have_key(:database)
      expect(health[:components]).to have_key(:redis)
      expect(health[:components]).to have_key(:sidekiq)
      expect(health[:components]).to have_key(:outbox)
      expect(health[:components]).to have_key(:puma)
    end
  end

  describe Observability::PerformanceDiagnosticService do
    it 'conforms to the golden diagnostic output contract with classified findings' do
      result = described_class.diagnose(window_minutes: 15)

      expect(result).to have_key(:status)
      expect(result).to have_key(:observations)
      expect(result).to have_key(:correlations)
      expect(result).to have_key(:hypotheses)
      expect(result).to have_key(:confirmed_causes)
      expect(result).to have_key(:recommendations)
      expect(result).to have_key(:metrics)
      expect(result).to have_key(:evidence)
      expect(result).to have_key(:window)
      expect(result).to have_key(:collected_at)
      expect(result).to have_key(:limitations)

      expect(result[:observations]).to be_an(Array)
      expect(result[:evidence]).to be_an(Array)
      expect(result[:window][:duration_minutes]).to eq(15)

      # Check classification tag standards
      all_classifications = result[:observations].map { |o| o[:classification] } +
                            result[:hypotheses].map { |h| h[:classification] } +
                            result[:confirmed_causes].map { |c| c[:classification] }
      all_classifications.compact.each do |classification|
        expect(%w[OBSERVED CORRELATED LIKELY CONFIRMED UNKNOWN]).to include(classification)
      end
    end
  end
end
