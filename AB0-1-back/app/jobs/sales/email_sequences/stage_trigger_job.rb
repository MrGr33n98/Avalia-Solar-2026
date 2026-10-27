# frozen_string_literal: true

module Sales
  module EmailSequences
    class StageTriggerJob < ApplicationJob
      queue_as :default

      def perform(opportunity_id:, new_stage_id:)
        opportunity = ::Sales::Opportunity.includes(:primary_contact, :account, :owner).find_by(id: opportunity_id)
        return unless opportunity

        contact = opportunity.primary_contact
        return unless contact

        automations = ::Sales::PipelineStageAutomation.active
                                                      .on_enter
                                                      .where(sales_stage_id: new_stage_id, company_id: opportunity.account&.company_id)

        automations.find_each do |automation|
          enroll_contact(opportunity, contact, automation.sequence)
        end
      end

      private

      def enroll_contact(opportunity, contact, sequence)
        return unless sequence&.active?

        # Evitar duplicidade caso já esteja ativo ou pausado nesta sequência
        existing = ::Sales::EmailSequenceEnrollment.where(
          sales_contact_id: contact.id,
          sales_email_sequence_id: sequence.id,
          status: %w[active paused]
        ).exists?

        return if existing

        enrollment = ::Sales::EmailSequenceEnrollment.create!(
          company_id: opportunity.account.company_id,
          sequence: sequence,
          contact: contact,
          account: opportunity.account,
          opportunity: opportunity,
          owner: opportunity.owner,
          status: 'active',
          current_step: 0,
          steps_count: sequence.steps.count,
          next_action_at: Time.current
        )

        Rails.logger.info("[Sales::EmailSequences::StageTriggerJob] Enrolled contact##{contact.id} into sequence##{sequence.id} for opportunity##{opportunity.id}")
      rescue ActiveRecord::RecordInvalid => e
        Rails.logger.warn("[Sales::EmailSequences::StageTriggerJob] Could not enroll: #{e.message}")
      end
    end
  end
end
