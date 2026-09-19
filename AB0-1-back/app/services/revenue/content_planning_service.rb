# frozen_string_literal: true

module Revenue
  class ContentPlanningService < BaseService
    def self.call(user:, arguments: {})
      new(user: user, arguments: arguments).call
    end

    def call
      account = arguments[:account_id].present? ? find_account! : nil
      records = Sales::ResearchRecord.where(company_id: tenant_company_id!).order(collected_at: :desc)
      records = records.where(sales_account_id: account.id) if account

      {
        channel: arguments[:channel].presence || 'generic',
        subject: arguments[:subject].presence || account&.name,
        factual_inputs: records.limit(bounded_limit(default: 20, maximum: 50)).map do |record|
          {
            kind: record.kind,
            certainty: record.certainty,
            source: record.source,
            source_url: record.source_url,
            collected_at: record.collected_at.iso8601,
            content: record.content
          }
        end,
        claim_policy: 'Use somente itens com certainty known ou unverified acompanhado de sua proveniência. ' \
                      'Não declarar inferências como fatos.',
        publication: { status: 'approval_required', external_action: false }
      }
    end
  end
end
