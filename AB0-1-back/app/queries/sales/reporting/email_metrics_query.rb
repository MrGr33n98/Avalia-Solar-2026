# frozen_string_literal: true

module Sales
  module Reporting
    class EmailMetricsQuery
      def self.call(user:, date_range: nil)
        events = ::Sales::TenantScope.for(user).email_events
        events = events.where(occurred_at: date_range) if date_range

        %w[sent delivered open click replied bounce complaint].to_h do |event_type|
          [event_type, events.where(event_type: event_type).count]
        end
      end
    end
  end
end
