# frozen_string_literal: true

module Sales
  class LeadConversionService
    def self.call(opportunity:, actor:, deal_name: nil, pipeline_id: nil, stage_id: nil)
      ActiveRecord::Base.transaction do
        account = opportunity.account
        unless account
          account = ::Sales::Account.create!(
            name: opportunity.name,
            owner: actor,
            status: 'active'
          )
          opportunity.update!(account: account)
        end

        contact = opportunity.primary_contact
        unless contact
          contact = ::Sales::Contact.create!(
            sales_account_id: account.id,
            first_name: opportunity.name.split(' ').first || 'Contato',
            last_name: opportunity.name.split(' ').drop(1).join(' ').presence,
            email: "#{opportunity.name.parameterize}-#{SecureRandom.hex(2)}@contato.crm",
            user: actor
          )
          opportunity.update!(primary_contact: contact)
        end

        target_stage = if stage_id.present?
                        ::Sales::Stage.find_by(id: stage_id)
                      else
                        opportunity.pipeline.stages.find_by(key: 'qualification') || opportunity.pipeline.stages.first
                      end

        if target_stage && opportunity.sales_stage_id != target_stage.id
          ::Sales::StageTransition.call(
            opportunity: opportunity,
            to_stage: target_stage,
            actor: actor
          )
        end

        begin
          DomainEvent.create!(
            event_type: 'sales.lead.converted',
            aggregate_type: 'Sales::Opportunity',
            aggregate_id: opportunity.id,
            occurred_at: Time.current,
            status: 'pending',
            payload: {
              opportunity_id: opportunity.id,
              account_id: account.id,
              contact_id: contact.id,
              actor_id: actor.id
            }
          )
        rescue => e
          Rails.logger.warn("[DomainEvent] Failed to emit sales.lead.converted: #{e.message}")
        end

        { opportunity: opportunity, account: account, contact: contact }
      end
    end
  end
end
