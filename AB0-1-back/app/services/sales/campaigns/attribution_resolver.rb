# frozen_string_literal: true

module Sales
  module Campaigns
    class AttributionResolver
      def self.calculate_revenue(campaign)
        new(campaign).calculate_revenue
      end

      def initialize(campaign)
        @campaign = campaign
        @company = campaign.company
      end

      def calculate_revenue
        return 0 unless @campaign && @campaign.started_at.present?

        account_ids = @campaign.recipients.pluck(:sales_account_id).compact.uniq
        contact_ids = @campaign.recipients.pluck(:sales_contact_id).compact.uniq
        return 0 if account_ids.empty? && contact_ids.empty?

        scope = ::Sales::Opportunity.where(status: 'won')
        scope = scope.where(company_id: @company.id) if @company && ::Sales::Opportunity.column_names.include?('company_id')
        won_opps = scope.where('updated_at >= ?', @campaign.started_at)
                        .where('sales_account_id IN (?) OR id IN (SELECT sales_opportunity_id FROM sales_opportunity_contacts WHERE sales_contact_id IN (?))', account_ids.presence || [0], contact_ids.presence || [0])

        total_cents = won_opps.sum(:value_cents)
        @campaign.update_column(:revenue_attributed_cents, total_cents)
        total_cents
      end
    end
  end
end
