# frozen_string_literal: true

module Sales
  module Campaigns
    class MetricsCalculator
      def self.calculate(campaign)
        new(campaign).calculate
      end

      def initialize(campaign)
        @campaign = campaign
      end

      def calculate
        recipients = @campaign.recipients
        total = @campaign.total_recipients.nonzero? || recipients.count
        return default_metrics if total.zero?

        counts = recipients.group(:status).count
        sent = @campaign.sent_count.nonzero? || (counts['sent'].to_i + counts['delivered'].to_i + counts['opened'].to_i + counts['clicked'].to_i)
        delivered = @campaign.delivered_count.nonzero? || (counts['delivered'].to_i + counts['opened'].to_i + counts['clicked'].to_i)
        opened = @campaign.opened_count.nonzero? || (counts['opened'].to_i + counts['clicked'].to_i)
        clicked = @campaign.clicked_count.nonzero? || counts['clicked'].to_i
        bounced = @campaign.bounced_count.nonzero? || counts['bounced'].to_i
        unsubscribed = @campaign.unsubscribed_count.nonzero? || counts['unsubscribed'].to_i

        delivery_rate = sent > 0 ? (delivered.to_f / sent * 100).round(1) : 0.0
        open_rate = delivered > 0 ? (opened.to_f / delivered * 100).round(1) : 0.0
        click_rate = opened > 0 ? (clicked.to_f / opened * 100).round(1) : 0.0
        bounce_rate = sent > 0 ? (bounced.to_f / sent * 100).round(1) : 0.0

        attributed_revenue_cents = AttributionResolver.calculate_revenue(@campaign)

        {
          total_recipients: total,
          processed_recipients: @campaign.processed_recipients,
          sent_count: sent,
          delivered_count: delivered,
          opened_count: opened,
          clicked_count: clicked,
          bounced_count: bounced,
          unsubscribed_count: unsubscribed,
          delivery_rate: delivery_rate,
          open_rate: open_rate,
          click_rate: click_rate,
          bounce_rate: bounce_rate,
          attributed_revenue_cents: attributed_revenue_cents,
          attributed_revenue_formatted: (attributed_revenue_cents / 100.0).round(2)
        }
      end

      private

      def default_metrics
        {
          total_recipients: 0,
          processed_recipients: 0,
          sent_count: 0,
          delivered_count: 0,
          opened_count: 0,
          clicked_count: 0,
          bounced_count: 0,
          unsubscribed_count: 0,
          delivery_rate: 0.0,
          open_rate: 0.0,
          click_rate: 0.0,
          bounce_rate: 0.0,
          attributed_revenue_cents: 0,
          attributed_revenue_formatted: 0.0
        }
      end
    end
  end
end
