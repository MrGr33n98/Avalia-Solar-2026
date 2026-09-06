# frozen_string_literal: true

module Sales
  module Campaigns
    class SnapshotService
      class SnapshotError < StandardError; end
      class EmptyAudienceError < SnapshotError; end
      class MissingTemplateError < SnapshotError; end
      class InvalidTemplateError < SnapshotError; end

      def self.call(campaign:)
        new(campaign: campaign).call
      end

      def initialize(campaign:)
        @campaign = campaign
        @company = campaign&.company
      end

      def call
        raise SnapshotError, 'Campanha ou empresa inválida' unless @campaign && @company
        snapshot_template!

        page = 1
        per_page = 250
        initial_result = AudienceResolver.call(company: @company, audience_filter: @campaign.audience_filter, page: 1, per_page: 1)
        raise EmptyAudienceError, 'Nenhum destinatário elegível encontrado.' if initial_result[:total_count].to_i.zero?

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
              },
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
          total_recipients: total
        )

        { recipients_count: total, status: @campaign.status, template_snapshot_at: @campaign.template_snapshot_at }
      end

      private

      def snapshot_template!
        return if @campaign.template_snapshot_present?
        template = @campaign.email_template
        raise MissingTemplateError, 'Template de e-mail ausente para snapshot.' unless template

        @campaign.update!(
          template_snapshot: {
            'template_id' => template.id,
            'name' => template.name,
            'subject_template' => template.subject_template,
            'preheader' => template.preheader,
            'body_json' => template.body_json,
            'body_html' => template.body_html
          },
          template_snapshot_at: Time.current
        )
        @campaign.reload
      end
    end
  end
end
