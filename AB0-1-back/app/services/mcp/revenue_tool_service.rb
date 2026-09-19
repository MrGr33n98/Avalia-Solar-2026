# frozen_string_literal: true

module Mcp
  class RevenueToolService < BaseService
    def call
      case tool_name
      when 'revenue_search_accounts', 'revenue_find_prospects'
        Revenue::ProspectingService.search(user: user, arguments: arguments)
      when 'revenue_register_prospect'
        Revenue::ProspectingService.register(user: user, arguments: arguments)
      when 'revenue_get_account_context', 'revenue_research_prospect',
           'revenue_list_research_records', 'revenue_get_decision_committee'
        Revenue::LeadResearchService.call(user: user, arguments: arguments)
      when 'revenue_list_opportunities'
        Revenue::LeadResearchService.list_opportunities(user: user, arguments: arguments)
      when 'revenue_get_opportunity_context'
        Revenue::LeadResearchService.opportunity_context(user: user, arguments: arguments)
      when 'revenue_record_qualification_assessment'
        Revenue::QualificationService.record_assessment(user: user, arguments: arguments)
      when 'revenue_prioritize_opportunities'
        Revenue::OpportunityPriorityService.call(user: user, arguments: arguments)
      when 'revenue_get_founder_inbox'
        Revenue::FounderInboxService.list(user: user, arguments: arguments)
      when 'revenue_refresh_founder_inbox'
        Revenue::FounderInboxService.refresh(user: user, arguments: arguments)
      when 'revenue_prepare_followup'
        Revenue::FollowUpService.prepare(user: user, arguments: arguments)
      when 'revenue_list_due_followups'
        Revenue::FollowUpService.list_due(user: user, arguments: arguments)
      when 'revenue_create_internal_task'
        Revenue::FollowUpService.create_internal_task(user: user, arguments: arguments)
      when 'revenue_preview_campaign', 'revenue_get_campaign_context'
        Revenue::CampaignPlanningService.preview(user: user, arguments: arguments)
      when 'revenue_prepare_campaign'
        Revenue::CampaignPlanningService.prepare(user: user, arguments: arguments)
      when 'revenue_list_audiences'
        Revenue::CampaignPlanningService.list_audiences(user: user, arguments: arguments)
      when 'revenue_preview_audience'
        Revenue::CampaignPlanningService.preview_audience(user: user, arguments: arguments)
      when 'revenue_prepare_email', 'revenue_prepare_content_brief', 'revenue_prepare_social_post'
        Revenue::ContentPlanningService.call(user: user, arguments: arguments)
      when 'revenue_get_pipeline_metrics', 'revenue_get_growth_metrics'
        Revenue::AnalyticsService.call(user: user, arguments: arguments)
      when 'revenue_request_campaign_send'
        OutboundCampaignService.new(arguments: arguments, user: user, tool_name: tool_name).call
      else
        raise Error.new(code: 'unknown_tool', message: 'Tool de Revenue não suportada.', status: :not_found)
      end
    end
  end
end
