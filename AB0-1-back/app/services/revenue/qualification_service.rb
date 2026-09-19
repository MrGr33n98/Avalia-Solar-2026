# frozen_string_literal: true

module Revenue
  class QualificationService < BaseService
    def self.record_assessment(user:, arguments: {})
      new(user: user, arguments: arguments).record_assessment
    end

    def record_assessment
      opportunity = find_opportunity!
      assessment = required!(:assessment).to_h
      evidence_record_ids = Array(arguments[:evidence_record_ids]).map(&:to_i).uniq
      evidence = Sales::ResearchRecord.where(
        company_id: tenant_company_id!, sales_opportunity_id: opportunity.id, id: evidence_record_ids
      ).pluck(:id, :source, :source_identifier, :certainty).map do |id, source, identifier, certainty|
        { id: id, source: source, source_identifier: identifier, certainty: certainty }
      end
      confidence = assessment[:confidence].present? ? normalize_confidence(assessment[:confidence]) : nil

      record = Sales::ResearchRecord.create!(
        company: tenant_company!,
        account: opportunity.account,
        opportunity: opportunity,
        agent_id: arguments[:_agent_id],
        created_by: user,
        kind: 'qualification_assessment',
        certainty: 'inferred',
        source: 'agent_assessment',
        source_identifier: arguments[:assessment_id].presence || SecureRandom.uuid,
        collected_at: Time.current,
        confidence: confidence,
        content: { assessment: assessment.except(:confidence), evidence: evidence }
      )

      {
        opportunity_id: opportunity.id,
        assessment: record.content['assessment'],
        certainty: record.certainty,
        evidence: evidence,
        research_record_id: record.id
      }
    end

    private

    def normalize_confidence(value)
      [[value.to_d, 0.to_d].max, 1.to_d].min
    end
  end
end
