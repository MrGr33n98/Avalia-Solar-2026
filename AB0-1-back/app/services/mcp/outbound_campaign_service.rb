# frozen_string_literal: true

module Mcp
  class OutboundCampaignService < BaseService
    def call
      campaign = scoped_campaigns.find(required!(:campaign_id))
      preflight = Sales::Campaigns::Preflight.call(campaign: campaign)

      unless preflight[:ready]
        return {
          status: 'unavailable',
          campaign_id: campaign.id,
          reason: 'campaign_preflight_failed',
          preflight: preflight
        }
      end

      dispatch = Sales::Campaigns::Dispatcher.call(campaign: campaign, action: 'dispatch')

      {
        status: dispatch[:error].present? ? 'unavailable' : 'queued_for_dispatch',
        campaign_id: campaign.id,
        dispatch: dispatch,
        governance: {
          approval_required: true,
          risk_tier: 'R3',
          audit_logged: true
        }
      }
    end

    private

    def scoped_campaigns
      return Sales::Campaign.all if user&.admin?

      company_id = user&.company_id
      raise Error.new(code: 'tenant_context_required', message: 'Tenant de campanha não encontrado.', status: :unprocessable_entity) if company_id.blank?

      Sales::Campaign.where(company_id: company_id)
    end
  end
end
