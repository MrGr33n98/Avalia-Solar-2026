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
          unless [true, 'true'].include?(params[:consent_given])
            return render_error_response(
              message: 'Consentimento LGPD é obrigatório para salvar dados pessoais.',
              status: :unprocessable_entity,
              code: 'CONSENT_REQUIRED'
            )
          end

          begin
            lead = ChatLead.find_or_initialize_by(chat_session_id: session.id)

            # Impede sobrescrita maligna de dados válidos por campos vazios no submit duplo
            safe_params = lead_params.to_h.reject do |key, value|
              lead.respond_to?(key) && lead.send(key).present? && value.blank?
            end

            lead.assign_attributes(safe_params)

            assigned_company = resolve_assigned_company(lead_params[:metadata])
            lead.assigned_company = assigned_company if assigned_company

            # Preenche defaults de sessão apenas se não existirem
            lead.consent_given = true
            lead.consent_given_at ||= Time.current
            lead.source_page ||= session.source_page
            lead.utm_source ||= session.utm_source
            lead.utm_medium ||= session.utm_medium
            lead.utm_campaign ||= session.utm_campaign

            lead.save!
          rescue ActiveRecord::RecordNotUnique
            # Race condition detectada! Outra thread acabou de salvar este lead no banco.
            # Capturamos a versão já existente para enriquecer com segurança.
            lead = ChatLead.find_by!(chat_session_id: session.id)

            safe_params = lead_params.to_h.reject do |key, value|
              lead.respond_to?(key) && lead.send(key).present? && value.blank?
            end

            lead.update!(safe_params)
          end

          assigned_company ||= resolve_assigned_company(lead_params[:metadata])
          lead.update!(assigned_company: assigned_company) if assigned_company && lead.assigned_company_id != assigned_company.id

          attach_session_to_company!(session, lead)
          enqueue_live_inbox_notifications(lead)

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
            success: true,
            id: lead.id,
            lead_id: lead.id,
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

        def resolve_assigned_company(metadata)
          raw = metadata.respond_to?(:to_h) ? metadata.to_h : {}
          company_id = raw['quote_requested_company_id'] || raw[:quote_requested_company_id] ||
                       Array(raw['recommended_company_ids'] || raw[:recommended_company_ids]).first
          Company.find_by(id: company_id)
        end

        def attach_session_to_company!(session, lead)
          return unless lead.assigned_company_id.present?

          session.update!(
            company_id: lead.assigned_company_id,
            inbox_status: lead.lead_score.to_i >= 75 ? 'waiting_agent' : 'active',
            human_requested_at: (Time.current if lead.lead_score.to_i >= 75)
          )
          ::Chat::InboxBroadcastService.session_updated(session)
        end

        def enqueue_live_inbox_notifications(lead)
          return unless lead.assigned_company_id.present?

          ::Chat::LeadEmailNotificationJob.perform_later(lead.id)
          ::Chat::CRMWebhookDispatchJob.perform_later(lead.id, 'lead.captured')
        rescue StandardError => e
          Rails.logger.error("[Chat::LeadsController] live inbox dispatch failed: #{e.class}: #{e.message}")
        end
      end
    end
  end
end
