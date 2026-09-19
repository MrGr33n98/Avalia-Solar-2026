# frozen_string_literal: true

module Revenue
  class LeadResearchService < BaseService
    def self.call(user:, arguments: {})
      new(user: user, arguments: arguments).call
    end

    def self.list_opportunities(user:, arguments: {})
      new(user: user, arguments: arguments).list_opportunities
    end

    def self.opportunity_context(user:, arguments: {})
      new(user: user, arguments: arguments).opportunity_context
    end

    def call
      account = find_account!
      company_id = tenant_company_id!
      opportunities = tenant_scope.opportunities.where(sales_account_id: account.id).includes(:stage, :qualification)
      research = Sales::ResearchRecord.where(company_id: company_id,
                                             sales_account_id: account.id).order(collected_at: :desc)

      {
        account: account_payload(account),
        contacts: account.contacts.includes(:employments).map { |contact| contact_payload(contact) },
        opportunities: opportunities.map { |opportunity| opportunity_payload(opportunity) },
        recent_activities: account.activities.order(occurred_at: :desc).limit(
          bounded_limit(default: 10, maximum: 50)
        ).map do |activity|
          { id: activity.id, type: activity.activity_type, subject: activity.subject,
            occurred_at: activity.occurred_at.iso8601 }
        end,
        research_records: research.limit(bounded_limit(default: 20, maximum: 100)).map do |record|
          research_payload(record)
        end,
        data_status: research.exists? ? 'available' : 'not_instrumented'
      }
    end

    def list_opportunities
      scope = tenant_scope.opportunities.includes(:account, :stage, :qualification).order(updated_at: :desc)
      scope = scope.where(status: arguments[:status]) if arguments[:status].present?

      {
        records: scope.limit(bounded_limit).map { |opportunity| opportunity_payload(opportunity) },
        total_count: scope.count
      }
    end

    def opportunity_context
      opportunity = find_opportunity!
      self.class.call(user: user, arguments: arguments.merge(account_id: opportunity.sales_account_id))
    end

    private

    def account_payload(account)
      account.slice(:id, :name, :domain, :website, :city, :state, :segment, :company_size, :status)
    end

    def contact_payload(contact)
      {
        id: contact.id,
        name: [contact.first_name, contact.last_name].compact.join(' '),
        job_title: contact.job_title,
        decision_role: contact.decision_role,
        is_primary: contact.is_primary,
        employments: contact.employments.current.map do |employment|
          {
            relationship_type: employment.relationship_type,
            job_title: employment.job_title,
            source: employment.source,
            source_url: employment.source_url,
            confidence: employment.confidence,
            verified_at: employment.verified_at&.iso8601
          }
        end
      }
    end

    def opportunity_payload(opportunity)
      {
        id: opportunity.id,
        name: opportunity.name,
        stage: opportunity.stage.name,
        status: opportunity.status,
        priority: opportunity.priority,
        next_activity_at: opportunity.next_activity_at&.iso8601,
        qualification_present: opportunity.qualification.present?
      }
    end

    def research_payload(record)
      record.slice(:id, :kind, :certainty, :source, :source_identifier, :source_url, :raw_reference_version,
                   :raw_reference_digest, :content).merge(
                     collected_at: record.collected_at&.iso8601,
                     verified_at: record.verified_at&.iso8601,
                     confidence: record.confidence&.to_f
                   )
    end
  end
end
