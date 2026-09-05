# frozen_string_literal: true

module Sales
  module Campaigns
    class SnapshotService
      def self.call(campaign:)
        new(campaign: campaign).call
      end

      def initialize(campaign:)
        @campaign = campaign
        @company = campaign.company
      end

      def call
        raise ArgumentError, 'Campanha inválida' unless @campaign && @company

        page = 1
        per_page = 250
        created_count = 0

        loop do
          result = AudienceResolver.call(
            company: @company,
            audience_filter: @campaign.audience_filter,
            page: page,
            per_page: per_page
          )

          contacts = result[:records]
          break if contacts.empty?

          recipients_attributes = contacts.map do |contact|
            {
              company_id: @company.id,
              sales_campaign_id: @campaign.id,
              sales_contact_id: contact.id,
              sales_account_id: contact.sales_account_id,
              email: contact.email.to_s.strip.downcase,
              first_name: contact.first_name,
              status: 'pending',
              metadata: {
                job_title: contact.job_title,
                account_name: contact.account&.name
              }.to_json,
              created_at: Time.current,
              updated_at: Time.current
            }
          end

          if recipients_attributes.any?
            ::Sales::CampaignRecipient.insert_all(
              recipients_attributes,
              unique_by: %i[sales_campaign_id email]
            )
          end

          page += 1
          break if page > result[:total_pages]
        end

        total = @campaign.recipients.count
        @campaign.update!(
          total_recipients: total,
          status: total > 0 ? 'scheduled' : 'draft'
        )

        { recipients_count: total, status: @campaign.status }
      end
    end
  end
end
