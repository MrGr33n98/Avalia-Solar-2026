# frozen_string_literal: true

module Sales
  class LeadConversionService
    def self.call(opportunity:, actor:, deal_name: nil, pipeline_id: nil, stage_id: nil, contact_params: nil)
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
        if contact.nil? && contact_params.is_a?(Hash) && (contact_params[:first_name].present? || contact_params[:email].present?)
          c_email = contact_params[:email].to_s.strip.downcase.presence
          contact = ::Sales::Contact.create!(
            sales_account_id: account.id,
            first_name: contact_params[:first_name].to_s.strip.presence || 'Contato',
            last_name: contact_params[:last_name].to_s.strip.presence,
            email: c_email,
            phone: contact_params[:phone].to_s.strip.presence,
            user: actor
          )
          opportunity.update!(primary_contact: contact)
        end

        target_pipeline = if pipeline_id.present?
                            ::Sales::TenantScope.for(actor).opportunities.find_by(sales_pipeline_id: pipeline_id)&.pipeline || opportunity.pipeline
                          else
                            opportunity.pipeline
                          end

        target_stage = if stage_id.present?
                         target_pipeline.stages.find_by(id: stage_id)
                       else
                         target_pipeline.stages.find_by(key: 'qualification') || target_pipeline.stages.order(:position).first
                       end

        if target_stage && (opportunity.sales_stage_id != target_stage.id || opportunity.sales_pipeline_id != target_pipeline.id)
          ::Sales::StageTransition.call(
            opportunity: opportunity,
            to_stage: target_stage,
            actor: actor
          )
        end

        if defined?(DomainEvent) && ActiveRecord::Base.connection.table_exists?('domain_events')
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
                contact_id: contact&.id,
                actor_id: actor.id
              }
            )
          rescue => e
            Rails.logger.warn("[DomainEvent] Failed to emit sales.lead.converted: #{e.message}")
          end
        end

        { opportunity: opportunity, account: account, contact: contact }
      end
    end
  end
end
