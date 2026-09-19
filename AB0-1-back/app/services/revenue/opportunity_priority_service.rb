# frozen_string_literal: true

module Revenue
  class OpportunityPriorityService < BaseService
    SCORING_VERSION = 'revenue_priority_v1'

    def self.call(user:, arguments: {})
      new(user: user, arguments: arguments).call
    end

    def call
      scope = if arguments[:opportunity_id].present?
                [find_opportunity!]
              else
                tenant_scope.opportunities.open.includes(
                  :account, :qualification, :tasks
                )
              end
      {
        scoring_version: SCORING_VERSION,
        scored_at: Time.current.iso8601,
        records: scope.first(bounded_limit(default: 50, maximum: 100)).map { |opportunity| score(opportunity) }
      }
    end

    private

    def score(opportunity)
      account = opportunity.account
      reasons = []
      score = 0

      completeness = %i[domain website city state segment].count { |field| account.public_send(field).present? }
      completeness_points = completeness * 4
      score += completeness_points
      reasons << { code: 'account_completeness', points: completeness_points,
                   evidence: "#{completeness}/5 campos de conta disponíveis" }

      if opportunity.qualification.present?
        score += 15
        reasons << { code: 'qualification_present', points: 15, evidence: 'Qualificação SPIN/BANT registrada' }
      else
        reasons << { code: 'qualification_unknown', points: 0, evidence: 'Qualificação não registrada' }
      end

      if opportunity.next_activity_at.present? && opportunity.next_activity_at <= 3.days.from_now
        score += 20
        reasons << { code: 'followup_due', points: 20, evidence: 'Próxima atividade prevista em até três dias' }
      elsif opportunity.next_activity_at.nil?
        score += 15
        reasons << { code: 'followup_missing', points: 15,
                     evidence: 'Oportunidade sem próxima atividade; requer revisão' }
      end

      if opportunity.last_activity_at.present? && opportunity.last_activity_at >= 7.days.ago
        score += 15
        reasons << { code: 'recent_engagement', points: 15, evidence: 'Atividade registrada nos últimos sete dias' }
      else
        reasons << { code: 'recent_engagement_unknown', points: 0, evidence: 'Sem atividade recente registrada' }
      end

      committee_roles = opportunity.opportunity_contacts.distinct.pluck(:role)
      if committee_roles.any?
        points = [committee_roles.size * 5, 20].min
        score += points
        reasons << { code: 'decision_committee', points: points,
                     evidence: "#{committee_roles.size} papel(is) de comitê registrado(s)" }
      else
        reasons << { code: 'decision_committee_unknown', points: 0, evidence: 'Comitê decisório não mapeado' }
      end

      {
        opportunity_id: opportunity.id,
        account_id: account.id,
        priority_score: [score, 100].min,
        priority_reasons: reasons,
        scored_at: Time.current.iso8601,
        scoring_version: SCORING_VERSION
      }
    end
  end
end
