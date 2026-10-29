# frozen_string_literal: true

module Api
  module V1
    module Sales
      class VoiceController < BaseController
        skip_before_action :authenticate_api_user, only: %i[twiml call_status]
        skip_before_action :verify_authenticity_token, raise: false
        before_action :authenticate_api_user, only: %i[token log_call]
        before_action :require_internal_sales, only: %i[token log_call]

        # GET /api/v1/sales/voice/token
        def token
          result = ::Sales::Voice::TwilioTokenService.generate_token(user: current_user)
          render json: result
        end

        # POST /api/v1/sales/voice/twiml
        # Twilio chama esse endpoint quando a chamada sai do navegador
        def twiml
          to_number = params[:To].to_s.strip
          caller_id = ENV['TWILIO_CALLER_ID'] || ENV['TWILIO_PHONE_NUMBER'] || '+551199999999'

          # Sanitiza número para formato E.164
          cleaned_number = to_number.gsub(/[^0-9+]/, '')
          cleaned_number = "+55#{cleaned_number}" unless cleaned_number.start_with?('+')

          xml = <<~XML
            <?xml version="1.0" encoding="UTF-8"?>
            <Response>
              <Dial callerId="#{caller_id}" record="record-from-answer-dual" timeout="35">
                <Number>#{cleaned_number}</Number>
              </Dial>
            </Response>
          XML

          render xml: xml, content_type: 'application/xml'
        end

        # POST /api/v1/sales/voice/call_status
        # Twilio webhook de status de término de chamada
        def call_status
          duration = params[:CallDuration].to_i
          call_sid = params[:CallSid]
          status = params[:CallStatus]

          Rails.logger.info("[TwilioVoice] Call #{call_sid} ended with status=#{status}, duration=#{duration}s")
          head :ok
        end

        # POST /api/v1/sales/voice/log_call
        # Chamado pelo frontend ao finalizar a ligação para registrar na Activity
        def log_call
          acc_id = params[:sales_account_id] || params[:account_id]
          cnt_id = params[:sales_contact_id] || params[:contact_id]
          opp_id = params[:sales_opportunity_id] || params[:opportunity_id]
          duration = params[:duration_seconds].to_i
          outcome = params[:outcome].presence || 'completed'
          subject = params[:subject].presence || "Ligação telefônica para #{params[:phone_number] || 'cliente'}"
          notes = params[:notes].presence || params[:body]

          account = current_tenant_scope.accounts.find_by(id: acc_id) if acc_id.present?
          opportunity = current_tenant_scope.opportunities.find_by(id: opp_id) if opp_id.present?
          contact = current_tenant_scope.contacts.find_by(id: cnt_id) if cnt_id.present?

          account ||= opportunity&.account
          account ||= contact&.account

          # Se não houver conta específica, vincula à primeira conta acessível do tenant ou cria atividade direta
          account ||= current_tenant_scope.accounts.first

          unless account
            return render json: { error: 'Nenhuma conta encontrada para vincular a chamada' }, status: :unprocessable_entity
          end

          activity = ::Sales::Activity.new(
            sales_account_id: account.id,
            sales_opportunity_id: opportunity&.id,
            sales_contact_id: contact&.id,
            actor: current_user,
            activity_type: 'call',
            direction: 'outbound',
            subject: subject,
            body: notes,
            duration_seconds: duration,
            log_status: outcome == 'no_answer' ? 'cancelled' : 'completed',
            occurred_at: Time.current,
            metadata: {
              phone_number: params[:phone_number],
              call_outcome: outcome,
              call_sid: params[:call_sid],
              provider: 'twilio_voice'
            }
          )

          if activity.save
            render json: { activity: activity, message: 'Ligação registrada com sucesso!' }, status: :created
          else
            render json: { error: activity.errors.full_messages.join(', ') }, status: :unprocessable_entity
          end
        end
      end
    end
  end
end
