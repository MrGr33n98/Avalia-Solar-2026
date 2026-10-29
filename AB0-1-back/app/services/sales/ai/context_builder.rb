# frozen_string_literal: true

module Sales
  module Ai
    class ContextBuilder
      class ForbiddenContextError < StandardError; end

      def initialize(tenant_scope:, setting:, context_params: {})
        @scope = tenant_scope
        @setting = setting
        @params = (context_params || {}).to_h.symbolize_keys
        @allowed_groups = setting.allowed_context_fields_list
      end

      def build!
        payload = {}
        sources_used = []
        missing_fields = []

        contact = resolve_contact!
        account = resolve_account!(contact)
        opportunity = resolve_opportunity!
        thread = resolve_thread!
        campaign = resolve_campaign!

        if account && !@scope.valid_relation?(account: account, contact: contact, opportunity: opportunity)
          raise ForbiddenContextError, 'As entidades de contexto informadas não pertencem à mesma conta comercial.'
        end

        if contact && @allowed_groups.include?('contact_basic')
          sources_used << "contact:#{contact.id}"
          first_name = sanitize_field(contact.try(:first_name).presence || contact.try(:name)&.split(' ')&.first)
          last_name = sanitize_field(contact.try(:last_name))
          job_title = sanitize_field(contact.try(:job_title))

          missing_fields << 'person.first_name' if first_name.blank?
          missing_fields << 'person.job_title' if job_title.blank?

          payload[:contact] = {
            id: contact.id,
            first_name: first_name,
            last_name: last_name,
            job_title: job_title,
            department: sanitize_field(contact.try(:department))
          }.compact
        elsif @params[:contact_id].blank?
          missing_fields << 'person.first_name'
        end

        if account && @allowed_groups.include?('account_basic')
          sources_used << "account:#{account.id}"
          acc_name = sanitize_field(account.try(:name))
          city = sanitize_field(account.try(:city))
          state = sanitize_field(account.try(:state))

          missing_fields << 'company.name' if acc_name.blank?
          missing_fields << 'company.city' if city.blank?

          payload[:account] = {
            id: account.id,
            name: acc_name,
            industry: sanitize_field(account.try(:industry)),
            city: city,
            state: state,
            website: sanitize_field(account.try(:website) || account.try(:domain))
          }.compact
        elsif @params[:account_id].blank? && contact.nil?
          missing_fields << 'company.name'
        end

        if opportunity && @allowed_groups.include?('opportunity_summary')
          sources_used << "opportunity:#{opportunity.id}"
          est_val = if opportunity.respond_to?(:value_cents) && opportunity.value_cents.present?
                      (opportunity.value_cents.to_i / 100.0).round(2)
                    else
                      opportunity.try(:value)&.to_f
                    end
          missing_fields << 'opportunity.value' if est_val.blank? || est_val <= 0

          payload[:opportunity] = {
            id: opportunity.id,
            title: sanitize_field(opportunity.try(:title) || opportunity.try(:name)),
            stage: sanitize_field(opportunity.try(:stage)&.try(:name) || opportunity.try(:stage)),
            status: sanitize_field(opportunity.try(:status)),
            estimated_value: est_val
          }.compact
        end

        if thread && @allowed_groups.include?('thread_messages')
          sources_used << "thread:#{thread.id}"
          payload[:thread_messages] = extract_thread_messages(thread)
        end

        if campaign
          sources_used << "campaign:#{campaign.id}"
          payload[:campaign] = {
            id: campaign.id,
            name: sanitize_field(campaign.name),
            status: campaign.status,
            total_recipients: campaign.try(:total_recipients)
          }.compact
        end

        {
          context_payload: payload,
          sources_used: sources_used.uniq,
          missing_fields: missing_fields.uniq
        }
      end

      private

      def sanitize_field(val)
        return nil if val.blank?

        val.to_s
           .gsub(/ignore (all )?(previous|prior) instructions/i, '[redacted]')
           .gsub(/system prompt/i, '[redacted]')
           .squish
           .truncate(280)
      end

      def resolve_contact!
        cid = @params[:contact_id]
        return nil if cid.blank?

        record = @scope.contacts.find_by(id: cid)
        raise ForbiddenContextError, 'Contato não encontrado ou fora do escopo do tenant.' unless record

        record
      end

      def resolve_account!(contact)
        aid = @params[:account_id]
        if aid.present?
          record = @scope.accounts.find_by(id: aid)
          raise ForbiddenContextError, 'Conta comercial não encontrada ou fora do escopo do tenant.' unless record

          return record
        end

        contact&.account
      end

      def resolve_opportunity!
        oid = @params[:opportunity_id]
        return nil if oid.blank?

        record = @scope.opportunities.find_by(id: oid)
        raise ForbiddenContextError, 'Oportunidade não encontrada ou fora do escopo do tenant.' unless record

        record
      end

      def resolve_thread!
        tid = @params[:thread_id]
        return nil if tid.blank?

        record = Sales::EmailThread.where(company_id: @setting.company_id).find_by(id: tid)
        raise ForbiddenContextError, 'Thread de e-mail não encontrada ou fora do escopo do tenant.' unless record

        record
      end

      def resolve_campaign!
        camp_id = @params[:campaign_id]
        return nil if camp_id.blank?

        record = @scope.campaigns.find_by(id: camp_id)
        raise ForbiddenContextError, 'Campanha não encontrada ou fora do escopo do tenant.' unless record

        record
      end

      def extract_thread_messages(thread)
        Sales::EmailMessage.where(sales_email_thread_id: thread.id)
                           .order(created_at: :desc)
                           .limit(5)
                           .reverse
                           .map do |m|
          {
            id: m.id,
            direction: m.direction,
            subject: sanitize_field(m.subject),
            snippet: ActionView::Base.full_sanitizer.sanitize(m.body_text.presence || m.body_html.to_s).squish.truncate(350)
          }
        end
      end
    end
  end
end
