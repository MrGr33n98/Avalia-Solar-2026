# frozen_string_literal: true

module Api
  module V1
    module Chat
      class LeadsController < BaseController
        # POST /api/v1/chat/leads
        def create
          unless ENV.fetch('CHAT_CAPTURE_LEADS_ENABLED', 'true') == 'true'
            return render_error_response(
              message: 'Captura de leads desabilitada.',
              status: :service_unavailable,
              code: 'LEADS_DISABLED'
            )
          end

          session = ChatSession.find(params[:chat_session_id])

          # LGPD: Exigir consentimento
          unless params[:consent_given] == true || params[:consent_given] == 'true'
            return render_error_response(
              message: 'Consentimento LGPD é obrigatório para salvar dados pessoais.',
              status: :unprocessable_entity,
              code: 'CONSENT_REQUIRED'
            )
          end

          lead = ChatLead.create!(lead_params.merge(
            chat_session_id: session.id,
            consent_given: true,
            consent_given_at: Time.current,
            source_page: session.source_page,
            utm_source: session.utm_source,
            utm_medium: session.utm_medium,
            utm_campaign: session.utm_campaign
          ))

          # Extract insights (async-safe)
          ::Chat::InsightExtractionService.extract_from_lead(lead)

          # Sincroniza para a tabela principal de Leads (Lead Sync v2)
          if ActiveModel::Type::Boolean.new.cast(ENV.fetch('MOBIVOLT_LEAD_SYNC_ENABLED', 'true'))
            begin
              ::Chat::Mobivolt::LeadSyncJob.perform_later(lead.id)
              
              # Dispara evento analítico PostHog informando que o lead foi salvo localmente
              ::Chat::PosthogTrackingService.track(
                event: 'mobivolt_lead_saved',
                distinct_id: session.visitor_id,
                properties: {
                  chat_lead_id: lead.id,
                  session_id: session.id
                }
              )
            rescue StandardError => e
              Rails.logger.error("[Chat::LeadsController] Failed to enqueue sync job: #{e.message}")
            end
          end

          # Track PostHog
          ::Chat::PosthogTrackingService.track(
            event: 'chat_lead_created',
            distinct_id: session.visitor_id,
            properties: {
              lead_id: lead.id,
              session_id: session.id,
              vertical: lead.vertical,
              intent: lead.intent,
              city: lead.city,
              state: lead.state,
              lead_score: lead.lead_score,
              lead_temperature: lead.lead_temperature,
              source_page: lead.source_page,
              utm_source: lead.utm_source,
              utm_campaign: lead.utm_campaign
            }
          )

          render json: {
            id: lead.id,
            lead_score: lead.lead_score,
            lead_temperature: lead.lead_temperature,
            recommended_next_action: lead.recommended_next_action,
            message: 'Seus dados foram salvos com sucesso! Em breve entraremos em contato.'
          }, status: :created
        end

        private

        def lead_params
          params.permit(
            :name, :email, :phone, :city, :state,
            :vertical, :intent, :project_type, :monthly_bill,
            :vehicle_count, :solution_type, :budget_range,
            :urgency, :decision_timeline, :decision_role,
            :property_type, :company_size,
            :summary, :recommended_next_action,
            pain_points: [], objections: [],
            metadata: {}
          )
        end
      end
    end
  end
end
