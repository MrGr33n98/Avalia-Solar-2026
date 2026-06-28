# frozen_string_literal: true

module Chat
  module Agents
    class CRMHandoffAgent < BaseAgent
      def self.process(session:, user_message:, router_state:, lead_qualification_result:, agent_result: nil,
                       context: nil)
        should_trigger = lead_qualification_result[:should_trigger_lead]
        score = lead_qualification_result[:lead_score]
        temperature = lead_qualification_result[:lead_temperature]
        reason = lead_qualification_result[:lead_reason]
        intent = router_state[:intent]
        next_agent = router_state[:next_agent]

        existing_lead = ChatLead.find_by(chat_session_id: session.id)

        if existing_lead
          # Avaliar se a temperatura/score atual da conversa é maior (Enriquecimento)
          old_score = existing_lead.lead_score.to_i

          if !should_trigger
            track_handoff(
              event: 'mobivolt_crm_handoff_duplicate_prevented',
              session_id: session.id,
              properties: { intent: intent, next_agent: next_agent, lead_score: old_score,
                            lead_temperature: existing_lead.lead_temperature, lead_reason: reason, handoff_triggered: false, duplicate_prevented: true }
            )

            {
              success: true,
              handoff_triggered: false,
              lead_id: existing_lead.id,
              lead_status: 'duplicate_prevented',
              lead_score: old_score,
              lead_temperature: existing_lead.lead_temperature,
              lead_reason: reason,
              duplicate_prevented: true,
              fallback_triggered: false,
              error: nil
            }
          elsif score > old_score
            # Atualiza apenas campos permitidos de inteligência comercial
            existing_lead.update!(
              lead_score: score,
              lead_temperature: temperature,
              intent: intent
            )

            track_handoff(
              event: 'mobivolt_crm_handoff_updated',
              session_id: session.id,
              properties: { intent: intent, next_agent: next_agent, lead_score: score, lead_temperature: temperature,
                            lead_reason: reason, handoff_triggered: true, duplicate_prevented: true }
            )

            {
              success: true,
              handoff_triggered: true,
              lead_id: existing_lead.id,
              lead_status: 'updated',
              lead_score: score,
              lead_temperature: temperature,
              lead_reason: reason,
              duplicate_prevented: true,
              fallback_triggered: false,
              error: nil
            }
          else
            # Impede degradação: O cliente já demonstrou interesse forte antes, não vamos baixar a temperatura por uma pergunta de suporte
            track_handoff(
              event: 'mobivolt_crm_handoff_duplicate_prevented',
              session_id: session.id,
              properties: { intent: intent, next_agent: next_agent, lead_score: score, lead_temperature: temperature,
                            lead_reason: reason, handoff_triggered: false, duplicate_prevented: true }
            )

            {
              success: true,
              handoff_triggered: false,
              lead_id: existing_lead.id,
              lead_status: 'duplicate_prevented',
              lead_score: old_score, # Mantém o score maior que já estava
              lead_temperature: existing_lead.lead_temperature,
              lead_reason: reason,
              duplicate_prevented: true,
              fallback_triggered: false,
              error: nil
            }
          end
        elsif should_trigger
          # Contato ainda não existe. Deixa a interface abrir o form.
          track_handoff(
            event: 'mobivolt_crm_handoff_evaluated',
            session_id: session.id,
            properties: { intent: intent, next_agent: next_agent, lead_score: score, lead_temperature: temperature,
                          lead_reason: reason, handoff_triggered: false, duplicate_prevented: false }
          )

          {
            success: true,
            handoff_triggered: false, # Aguardando form do frontend
            lead_id: nil,
            lead_status: 'pending_contact_info',
            lead_score: score,
            lead_temperature: temperature,
            lead_reason: reason,
            duplicate_prevented: false,
            fallback_triggered: false,
            error: nil
          }
        else
          {
            success: true,
            handoff_triggered: false,
            lead_status: 'ignored',
            lead_score: score,
            lead_temperature: temperature,
            lead_reason: reason,
            duplicate_prevented: false,
            fallback_triggered: false,
            error: nil
          }
        end
      rescue StandardError => e
        Rails.logger.error("[Chat::Agents::CRMHandoffAgent] Failed: #{e.message}")
        track_handoff(
          event: 'mobivolt_crm_handoff_fallback',
          session_id: session.id,
          properties: { intent: router_state[:intent], fallback_triggered: true, error: e.message }
        )

        {
          success: false,
          handoff_triggered: false,
          lead_status: 'error',
          fallback_triggered: true,
          error: e.message,
          duplicate_prevented: false
        }
      end

      def self.track_handoff(event:, session_id:, properties:)
        Chat::PosthogTrackingService.track(
          event: event,
          properties: properties.merge({ session_id: session_id })
        )
      end
    end
  end
end
