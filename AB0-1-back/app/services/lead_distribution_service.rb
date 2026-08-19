class LeadDistributionService
  def initialize(lead, preferred_company_id: nil)
    @lead = lead
    @preferred_company_id = preferred_company_id
  end

  def call
    matches = Leads::LeadMatchingService.call(lead, preferred_company_id: preferred_company_id)
    persist_matches!(matches)
    matches.map { |match| match[:company] }
  end

  private

  attr_reader :lead, :preferred_company_id

  def persist_matches!(matches)
    LeadDistribution.transaction do
      matches.each do |match|
        distribution = lead.lead_distributions.find_or_initialize_by(company: match[:company])
        distribution.assign_attributes(
          status: 'sent',
          match_score: match[:match_score],
          match_reasons: match[:match_reasons],
          assigned_at: distribution.assigned_at || Time.current,
          sent_at: distribution.sent_at || Time.current
        )
        distribution.save!
      end
    end
  end
end
