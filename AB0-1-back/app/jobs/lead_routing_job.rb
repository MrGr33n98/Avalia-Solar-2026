class LeadRoutingJob < ApplicationJob
  queue_as :default

  def perform(lead_id, preferred_company_id = nil)
    lead = Lead.find(lead_id)
    active_distributions = lead.lead_distributions.where(status: %w[sent viewed accepted]).count
    return if active_distributions >= Leads::LeadMatchingService::MAX_DISTRIBUTIONS

    matches = Leads::LeadMatchingService.call(lead, preferred_company_id: preferred_company_id)
    matches = matches.first([Leads::LeadMatchingService::MAX_DISTRIBUTIONS - active_distributions, 0].max)
    LeadDistribution.transaction do
      matches.each do |match|
        distribution = LeadDistribution.find_or_initialize_by(lead: lead, company: match[:company])
        next if distribution.persisted? && !distribution.failed? && !distribution.expired? && !distribution.rejected?

        distribution.assign_attributes(
          status: 'sent',
          match_score: match[:match_score],
          match_reasons: match[:match_reasons],
          assigned_at: distribution.assigned_at || Time.current,
          sent_at: distribution.sent_at || Time.current
        )
        distribution.save!
        notify_company!(distribution)
      end
      lead.update!(wizard_status: matches.any? ? 'distributed' : 'unmatched')
    end
  end

  def notify_company!(distribution)
    distribution.company.company_members.where(role: %w[owner manager editor]).includes(:user).find_each do |member|
      Notification.create_and_deliver!(
        user: member.user,
        company: distribution.company,
        notifiable: distribution,
        notification_type: 'new_lead',
        title: 'Novo pedido de orçamento',
        body: 'Uma nova oportunidade compatível está disponível no seu painel.',
        delivery_channels: %w[in_app email]
      )
    end
  rescue StandardError => e
    Rails.logger.warn("[LeadRoutingJob] notification failed distribution_id=#{distribution.id}: #{e.class}: #{e.message}")
  end
end
