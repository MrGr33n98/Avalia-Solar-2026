# frozen_string_literal: true

module Sales
  module Timeline
    class Broadcaster
      def self.call(email_event)
        email = email_event.email_message
        opportunity_id = target_opportunity_id(email)
        return unless opportunity_id

        ActionCable.server.broadcast(
          SalesTimelineChannel.stream_name(company_id: email.company_id, opportunity_id: opportunity_id),
          {
            schema_version: 1,
            type: 'sales.timeline.changed',
            event_id: email_event.id,
            cursor: email_event.timeline_sequence.to_s,
            opportunity_id: opportunity_id,
            resource_type: 'email_message',
            resource_id: email.id,
            change: email_event.event_type,
            occurred_at: email_event.occurred_at
          }
        )
      end

      def self.target_opportunity_id(email)
        if email.sales_opportunity_id.present?
          opportunity = ::Sales::Opportunity.joins(:account).find_by(
            id: email.sales_opportunity_id,
            sales_accounts: { company_id: email.company_id }
          )
          return opportunity.id if opportunity

          return nil
        end
        return unless email.sales_account_id.present?

        account = ::Sales::Account.find_by(id: email.sales_account_id, company_id: email.company_id)
        return unless account

        opportunity_ids = account.opportunities.limit(2).pluck(:id)
        opportunity_ids.one? ? opportunity_ids.first : nil
      end
    end
  end
end
