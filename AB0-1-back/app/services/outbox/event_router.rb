# frozen_string_literal: true

module Outbox
  class EventRouter
    def self.dispatch(event)
      new(event).dispatch
    end

    def initialize(event)
      @event = event
    end

    def dispatch
      case @event.event_type
      # Social / Feed projection
      when 'publication.published', 'review.approved', 'group_post_created', 'group_post_restored',
           'news_item.published', 'poll.published'
        if defined?(Social::CreateFeedItemJob)
          Social::CreateFeedItemJob.perform_now(@event.aggregate_type, @event.aggregate_id)
        end

      when 'group_post_hidden'
        if defined?(FeedItem)
          FeedItem.where(subject_type: @event.aggregate_type, subject_id: @event.aggregate_id).destroy_all
        end

      # Sales CRM Domain Events
      when 'sales.opportunity.stage_changed'
        handle_opportunity_stage_changed

      when 'sales.lead.converted'
        handle_lead_converted

      when 'sales.account.created', 'sales.account.linked_to_company', 'sales.account.merged'
        handle_sales_account_event

      # Billing Outbound Domain Events
      when 'billing.subscription.created', 'billing.subscription.updated', 'billing.subscription.activated'
        handle_subscription_activated

      when 'billing.subscription.deleted', 'billing.subscription.canceled'
        handle_subscription_canceled

      # Leads & Quotes
      when 'lead.captured', 'quote.requested'
        handle_lead_or_quote_event

      else
        Rails.logger.info("[Outbox::EventRouter] No dedicated consumer for event_type='#{@event.event_type}', marked completed.")
      end

      true
    end

    private

    def handle_opportunity_stage_changed
      opp_id = @event.payload['opportunity_id'] || @event.aggregate_id
      Rails.logger.info("[Outbox::EventRouter] Dispatched sales.opportunity.stage_changed for Opportunity##{opp_id}")
    end

    def handle_lead_converted
      opp_id = @event.payload['opportunity_id'] || @event.aggregate_id
      Rails.logger.info("[Outbox::EventRouter] Dispatched sales.lead.converted for Opportunity##{opp_id}")
    end

    def handle_sales_account_event
      Rails.logger.info("[Outbox::EventRouter] Dispatched #{@event.event_type} for Account##{@event.aggregate_id}")
    end

    def handle_subscription_activated
      comp_id = @event.company_id || @event.payload['company_id']
      Rails.logger.info("[Outbox::EventRouter] Dispatched #{@event.event_type} for Company##{comp_id}")
    end

    def handle_subscription_canceled
      comp_id = @event.company_id || @event.payload['company_id']
      Rails.logger.info("[Outbox::EventRouter] Dispatched #{@event.event_type} for Company##{comp_id}")
    end

    def handle_lead_or_quote_event
      lead_id = @event.payload['lead_id'] || @event.aggregate_id
      Rails.logger.info("[Outbox::EventRouter] Dispatched #{@event.event_type} for Lead##{lead_id}")
    end
  end
end
