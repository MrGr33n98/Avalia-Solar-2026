# frozen_string_literal: true

module CompanyAi
  # Atomic per-company reservation, idempotent settlement and safe release.
  # This ledger is authoritative for quotas; PostHog is not a billing source.
  class UsageLedger
    class QuotaExceeded < StandardError; end
    class RequestConflict < StandardError; end

    def self.reserve!(assistant:, request_id:, monthly_limit:)
      raise ArgumentError, 'INVALID_REQUEST_ID' unless request_id.to_s.match?(/\A[a-zA-Z0-9_-]{8,100}\z/)
      raise ArgumentError, 'INVALID_LIMIT' unless monthly_limit.to_i.between?(1, 10_000)

      assistant.with_lock do
        existing = CompanyAiUsageEntry.find_by(request_id: request_id)
        if existing
          raise RequestConflict, 'REQUEST_OWNERSHIP_MISMATCH' if existing.company_id != assistant.company_id
          return existing
        end

        start = Time.current.beginning_of_month
        used = CompanyAiUsageEntry.where(company_id: assistant.company_id, created_at: start..)
                                  .where(state: %w[reserved settled]).count
        raise QuotaExceeded, 'MONTHLY_LIMIT' if used >= monthly_limit.to_i

        CompanyAiUsageEntry.create!(company_id: assistant.company_id, request_id: request_id, state: 'reserved')
      end
    end

    def self.settle!(entry:, input_tokens:, output_tokens:, cost_usd:, model:)
      raise ArgumentError, 'INVALID_USAGE' if [input_tokens, output_tokens, cost_usd].any? { |value| value.nil? || value.to_d.negative? }
      entry.with_lock do
        return entry if entry.state == 'settled'
        raise RequestConflict, 'RESERVATION_NOT_ACTIVE' unless entry.state == 'reserved'

        entry.update!(state: 'settled', input_tokens: input_tokens, output_tokens: output_tokens,
                      cost_usd: cost_usd, model: model.to_s.first(120), settled_at: Time.current)
      end
      entry
    end

    def self.release!(entry:)
      entry.with_lock do
        entry.update!(state: 'released') if entry.state == 'reserved'
      end
      entry
    end
  end
end
