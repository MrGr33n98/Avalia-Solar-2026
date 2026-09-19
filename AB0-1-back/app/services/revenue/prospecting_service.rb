# frozen_string_literal: true

module Revenue
  class ProspectingService < BaseService
    ALLOWED_ACCOUNT_ATTRIBUTES = %i[name domain website phone email city state segment company_size source
                                    source_detail].freeze

    def self.search(user:, arguments: {})
      new(user: user, arguments: arguments).search
    end

    def self.register(user:, arguments: {})
      new(user: user, arguments: arguments).register
    end

    def search
      scope = tenant_scope.accounts.includes(:contacts, :opportunities).order(updated_at: :desc)
      if arguments[:query].present?
        query = "%#{ActiveRecord::Base.sanitize_sql_like(arguments[:query].to_s.strip)}%"
        scope = scope.where('sales_accounts.name ILIKE ? OR sales_accounts.domain ILIKE ?', query, query)
      end
      scope = scope.where(state: arguments[:state]) if arguments[:state].present?
      scope = scope.where(city: arguments[:city]) if arguments[:city].present?
      scope = scope.where(segment: arguments[:segment]) if arguments[:segment].present?

      {
        records: scope.limit(bounded_limit).map { |account| serialize(account) },
        total_count: scope.count
      }
    end

    def register
      candidate = required!(:candidate).to_h.with_indifferent_access
      source = candidate[:source].to_s.strip
      source_identifier = candidate[:source_identifier].to_s.strip
      if source.blank?
        raise Mcp::Error.new(code: 'provenance_required', message: 'source é obrigatório para prospectar.',
                             status: :bad_request)
      end
      if source_identifier.blank?
        raise Mcp::Error.new(code: 'provenance_required', message: 'source_identifier é obrigatório para prospectar.',
                             status: :bad_request)
      end

      name = candidate[:name].to_s.strip
      if name.blank?
        raise Mcp::Error.new(code: 'invalid_params', message: 'candidate.name é obrigatório.',
                             status: :bad_request)
      end

      company = tenant_company!
      idempotency_key = arguments[:idempotency_key].presence || "prospect:#{source}:#{source_identifier}"
      account_attributes = candidate.slice(*ALLOWED_ACCOUNT_ATTRIBUTES).compact

      Sales::Account.transaction do
        research = Sales::ResearchRecord.lock.find_by(company: company, idempotency_key: idempotency_key)
        if research
          { account: serialize(research.account), research_record: serialize_research(research), idempotent: true }
        else
          account = find_matching_account(account_attributes) || Sales::Account.create!(
            account_attributes.merge(name: name, company: company, owner: user, source: source)
          )

          research = Sales::ResearchRecord.create!(
            company: company,
            account: account,
            agent_id: arguments[:_agent_id],
            created_by: user,
            kind: 'prospect_candidate',
            certainty: normalize_certainty(candidate[:certainty]),
            source: source,
            source_identifier: source_identifier,
            source_url: candidate[:source_url].presence,
            collected_at: parse_time(candidate[:collected_at]) || Time.current,
            verified_at: parse_time(candidate[:verified_at]),
            confidence: normalize_confidence(candidate[:confidence]),
            raw_reference_version: candidate[:raw_reference_version].presence,
            raw_reference_digest: candidate[:raw_reference_digest].presence,
            idempotency_key: idempotency_key,
            content: candidate.slice(:facts, :notes).compact
          )

          { account: serialize(account), research_record: serialize_research(research), idempotent: false }
        end
      end
    rescue ActiveRecord::RecordNotUnique
      research = Sales::ResearchRecord.find_by!(company_id: tenant_company_id!, idempotency_key: idempotency_key)
      { account: serialize(research.account), research_record: serialize_research(research), idempotent: true }
    end

    private

    def find_matching_account(attributes)
      scope = tenant_scope.accounts.where(company_id: tenant_company_id!)
      return scope.find_by(domain: attributes[:domain]) if attributes[:domain].present?

      scope.find_by(name: attributes[:name], city: attributes[:city], state: attributes[:state])
    end

    def serialize(account)
      {
        id: account.id,
        name: account.name,
        domain: account.domain,
        website: account.website,
        city: account.city,
        state: account.state,
        segment: account.segment,
        status: account.status,
        contacts_count: account.contacts.size,
        opportunities_count: account.opportunities.size
      }
    end

    def serialize_research(record)
      {
        id: record.id,
        kind: record.kind,
        certainty: record.certainty,
        source: record.source,
        source_identifier: record.source_identifier,
        source_url: record.source_url,
        collected_at: record.collected_at&.iso8601,
        verified_at: record.verified_at&.iso8601,
        confidence: record.confidence&.to_f
      }
    end

    def normalize_certainty(value)
      value.to_s.downcase.in?(Sales::ResearchRecord::CERTAINTIES) ? value.to_s.downcase : 'unverified'
    end

    def normalize_confidence(value)
      return nil if value.blank?

      [[value.to_d, 0.to_d].max, 1.to_d].min
    end

    def parse_time(value)
      Time.iso8601(value.to_s)
    rescue ArgumentError
      nil
    end
  end
end
