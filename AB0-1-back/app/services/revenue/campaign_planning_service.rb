# frozen_string_literal: true

require 'digest'

module Revenue
  class CampaignPlanningService < BaseService
    def self.preview(user:, arguments: {})
      new(user: user, arguments: arguments).preview
    end

    def self.prepare(user:, arguments: {})
      new(user: user, arguments: arguments).prepare
    end

    def self.list_audiences(user:, arguments: {})
      new(user: user, arguments: arguments).list_audiences
    end

    def self.preview_audience(user:, arguments: {})
      new(user: user, arguments: arguments).preview_audience
    end

    def preview
      campaign = find_campaign!
      preflight = Sales::Campaigns::Preflight.call(campaign: campaign)
      {
        campaign_id: campaign.id,
        status: campaign.status,
        audience_preview: preflight[:audience],
        preflight: preflight,
        delivery: preflight[:provider][:status] == 'configured' ? 'requires_human_approval' : 'unavailable'
      }
    end

    def prepare
      company = tenant_company!
      idempotency_key = required!(:idempotency_key).to_s
      audience = Sales::Audience.where(company: company).find(required!(:audience_id))
      template = Sales::EmailTemplate.where(company: company).find(required!(:email_template_id))
      campaign_key = "revenue-#{Digest::SHA256.hexdigest(idempotency_key).first(24)}"

      campaign = Sales::Campaign.find_or_initialize_by(company: company, campaign_key: campaign_key)
      created = campaign.new_record?
      if created
        campaign.name = required!(:name).to_s
        campaign.user = user
        campaign.audience = audience
        campaign.audience_filter = audience.filter_definition
        campaign.email_template = template
        campaign.campaign_type = 'email_broadcast'
        campaign.status = 'draft'
        campaign.save!
      end

      preview_for(campaign).merge(idempotent: !created)
    end

    def list_audiences
      scope = Sales::Audience.where(company_id: tenant_company_id!).order(updated_at: :desc)
      {
        records: scope.limit(bounded_limit).map do |audience|
          audience.slice(:id, :name, :description, :kind, :active, :filter_definition)
        end,
        total_count: scope.count
      }
    end

    def preview_audience
      audience = Sales::Audience.where(company_id: tenant_company_id!).find(required!(:audience_id))
      result = Sales::Campaigns::AudienceResolver.call(
        company: tenant_company!, audience_filter: audience.filter_definition, page: 1, per_page: bounded_limit(
          default: 25, maximum: 100
        )
      )
      {
        audience_id: audience.id,
        audience_name: audience.name,
        total_count: result[:total_count],
        records: result[:records].map do |contact|
          { id: contact.id, account_id: contact.sales_account_id,
            name: [contact.first_name, contact.last_name].compact.join(' ') }
        end,
        snapshot_created: false
      }
    rescue ActiveRecord::RecordNotFound
      raise Mcp::Error.new(code: 'not_found', message: 'Audiência não encontrada no tenant atual.', status: :not_found)
    end

    private

    def find_campaign!
      Sales::Campaign.where(company_id: tenant_company_id!).find(required!(:campaign_id))
    rescue ActiveRecord::RecordNotFound
      raise Mcp::Error.new(code: 'not_found', message: 'Campanha não encontrada no tenant atual.', status: :not_found)
    end

    def preview_for(campaign)
      self.class.preview(user: user, arguments: { campaign_id: campaign.id })
    end
  end
end
