# frozen_string_literal: true

module Sales
  module Reporting
    class EmailMetricsQuery
      EVENT_MAPPINGS = {
        'sent' => %w[sent provider_accepted queued],
        'delivered' => %w[delivered],
        'open' => %w[open open_signal provider_open_signal],
        'click' => %w[click provider_click_signal],
        'replied' => %w[replied],
        'bounce' => %w[bounce reject failed],
        'complaint' => %w[complaint unsubscribed]
      }.freeze

      def self.call(user:, date_range: nil)
        events = ::Sales::TenantScope.for(user).email_events
        events = events.where(occurred_at: date_range) if date_range

        EVENT_MAPPINGS.transform_values do |event_types|
          events.where(event_type: event_types).count
        end
      end
    end
  end
end
