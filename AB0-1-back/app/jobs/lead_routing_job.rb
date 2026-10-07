class LeadRoutingJob < ApplicationJob
  queue_as :default

  def perform(lead_id, preferred_company_id = nil)
    lead = Lead.find(lead_id)
    return unless lead.otp_verified_at.present?

    slots = remaining_slots(lead)
    return unless slots.positive?

    track_routing_started(lead)
    matches = Leads::LeadMatchingService.call(lead, preferred_company_id: preferred_company_id).first(slots)
    LeadDistribution.transaction do
      matches.each { |match| persist_match!(lead, match) }
      lead.update!(wizard_status: matches.any? ? 'distributed' : 'unmatched')
    end
  end

  private

  def remaining_slots(lead)
    active = lead.lead_distributions.where(status: %w[sent viewed accepted]).count
    Leads::LeadMatchingService::MAX_DISTRIBUTIONS - active
  end

  def track_routing_started(lead)
    return if lead.company_id.blank?

    Analytics::TrackEventService.call(
      company_id: lead.company_id,
      event_type: 'lead_routing_started',
      metadata: { lead_id: lead.id }
    )
  end

  def persist_match!(lead, match)
    distribution = LeadDistribution.find_or_initialize_by(lead: lead, company: match[:company])
    return unless redistributable?(distribution)

    distribution.assign_attributes(distribution_attributes(distribution, match))
    distribution.save!
    Marketplace::ProposalBootstrapService.new(distribution: distribution).call
    schedule_expiration(distribution)
    track_distribution(distribution)
    notify_company!(distribution)
  end

  def redistributable?(distribution)
    distribution.new_record? ||
      distribution.failed_status? ||
      distribution.expired_status? ||
      distribution.rejected_status?
  end

  def distribution_attributes(distribution, match)
    {
      status: 'sent',
      match_score: match[:match_score],
      match_reasons: match[:match_reasons],
      assigned_at: distribution.assigned_at || Time.current,
      sent_at: distribution.sent_at || Time.current
    }
  end

  def schedule_expiration(distribution)
    wait = LeadDistribution.acceptance_sla_minutes.minutes
    LeadDistributionExpirationJob.set(wait: wait).perform_later(distribution.id)
  end

  def track_distribution(distribution)
    Analytics::TrackEventService.call(
      company_id: distribution.company_id,
      event_type: 'lead_distributed',
      metadata: { lead_id: distribution.lead_id, distribution_id: distribution.id }
    )
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
    Rails.logger.warn(
      "[LeadRoutingJob] notification failed distribution_id=#{distribution.id}: #{e.class}: #{e.message}"
    )
  end
end
