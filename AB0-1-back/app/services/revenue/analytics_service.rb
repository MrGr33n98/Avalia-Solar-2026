# frozen_string_literal: true

module Revenue
  class AnalyticsService < BaseService
    def self.call(user:, arguments: {})
      new(user: user, arguments: arguments).call
    end

    def call
      company_id = tenant_company_id!
      accounts = tenant_scope.accounts
      opportunities = tenant_scope.opportunities
      campaigns = Sales::Campaign.where(company_id: company_id)
      sent_statuses = %w[sent delivered opened clicked]

      {
        prospects_created: metric(accounts.where(status: 'prospecting').count),
        qualified_prospects: metric(opportunities.joins(:qualification).distinct.count),
        opportunities_created: metric(opportunities.count),
        pipeline_value_cents: metric(opportunities.open.sum(:value_cents)),
        stage_conversion: { value: nil, status: 'not_instrumented' },
        campaign_drafts: metric(campaigns.where(status: 'draft').count),
        approved_campaigns: { value: nil, status: 'not_instrumented' },
        emails_actually_sent: metric(Sales::EmailMessage.where(company_id: company_id, status: sent_statuses).count),
        replies: { value: nil, status: 'not_instrumented' },
        source_attribution: { value: nil, status: 'unknown' }
      }
    end

    private

    def metric(value)
      { value: value, status: 'available' }
    end
  end
end
