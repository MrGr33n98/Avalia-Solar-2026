# frozen_string_literal: true

require 'cgi'
require 'openssl'
require 'base64'

module Api
  module V1
    module Sales
      class VoiceController < BaseController
        E164_PHONE_REGEX = /\A\+[1-9]\d{9,14}\z/

        skip_before_action :authenticate_api_user, only: %i[twiml call_status]
        skip_before_action :require_internal_sales, only: %i[twiml call_status]
        skip_before_action :verify_authenticity_token, raise: false
        before_action :authenticate_api_user, only: %i[token log_call]
        before_action :require_internal_sales, only: %i[token log_call]
        before_action :verify_twilio_webhook!, only: %i[twiml call_status]

        # GET /api/v1/sales/voice/token
        def token
          result = ::Sales::Voice::TwilioTokenService.generate_token(user: current_user)
          render json: result
        end

        # POST /api/v1/sales/voice/twiml
        # Twilio chama esse endpoint quando a chamada sai do navegador
        def twiml
          caller_id = ENV['TWILIO_CALLER_ID'].presence || ENV['TWILIO_PHONE_NUMBER'].presence
          cleaned_caller_id = normalize_e164_phone(caller_id)

          unless cleaned_caller_id && E164_PHONE_REGEX.match?(cleaned_caller_id)
            Rails.logger.error('[TwilioVoice] Caller ID ausente ou inválido na configuração do servidor.')
            return render_twiml_say('Configuração de número de origem ausente no servidor.')
          end

          cleaned_number = normalize_e164_phone(params[:To])
          unless cleaned_number && E164_PHONE_REGEX.match?(cleaned_number)
            Rails.logger.warn("[TwilioVoice] Destino inválido rejeitado: #{params[:To].inspect}")
            return render_twiml_say('O número de destino informado é inválido.')
          end

          record_attr = ENV['TWILIO_RECORD_CALLS'] == 'true' ? ' record="record-from-answer-dual"' : ''
          escaped_caller = CGI.escapeHTML(cleaned_caller_id)
          escaped_dest = CGI.escapeHTML(cleaned_number)

          xml = <<~XML
            <?xml version="1.0" encoding="UTF-8"?>
            <Response>
              <Dial callerId="#{escaped_caller}"#{record_attr} timeout="35">
                <Number>#{escaped_dest}</Number>
              </Dial>
            </Response>
          XML

          render xml: xml, content_type: 'application/xml'
        end

        # POST /api/v1/sales/voice/call_status
        # Twilio webhook de status de término de chamada
        def call_status
          duration = params[:CallDuration].to_i
          call_sid = params[:CallSid].to_s
          status = params[:CallStatus].to_s

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
          account ||= current_tenant_scope.accounts.first

          unless account
            return render json: { error: 'Nenhuma conta encontrada para vincular a chamada' },
                          status: :unprocessable_entity
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

        private

        def normalize_e164_phone(raw_phone)
          cleaned = raw_phone.to_s.strip.gsub(/[^0-9+]/, '')
          return nil if cleaned.blank?

          return cleaned if cleaned.start_with?('+')

          digits = cleaned.gsub(/\D/, '')
          if digits.start_with?('55') && digits.length.between?(12, 13)
            "+#{digits}"
          elsif digits.length.between?(10, 11)
            "+55#{digits}"
          else
            "+#{digits}"
          end
        end

        def render_twiml_say(message)
          escaped_msg = CGI.escapeHTML(message.to_s)
          xml = <<~XML
            <?xml version="1.0" encoding="UTF-8"?>
            <Response>
              <Say language="pt-BR">#{escaped_msg}</Say>
              <Hangup/>
            </Response>
          XML
          render xml: xml, content_type: 'application/xml'
        end

        def verify_twilio_webhook!
          return if Rails.env.test? && ENV['TWILIO_ENFORCE_SIGNATURE_IN_TEST'] != 'true'

          auth_token = ENV['TWILIO_AUTH_TOKEN'].presence
          signature = request.headers['X-Twilio-Signature'].to_s

          if auth_token.present?
            if signature.blank? || !valid_twilio_signature?(auth_token, signature)
              Rails.logger.warn('[TwilioVoice] Assinatura X-Twilio-Signature inválida ou ausente.')
              head :forbidden
              return
            end
          else
            expected_sid = ENV['TWILIO_ACCOUNT_SID'].presence
            if expected_sid.blank? || params[:AccountSid].to_s != expected_sid
              Rails.logger.warn('[TwilioVoice] Webhook rejeitado: AccountSid inválido ou TWILIO_AUTH_TOKEN ausente.')
              head :forbidden
              return
            end
          end
        end

        def valid_twilio_signature?(auth_token, signature)
          post_params = request.post? ? request.request_parameters : {}
          candidate_urls = [
            request.original_url,
            request.original_url.sub(/\Ahttp:/i, 'https:')
          ].uniq

          candidate_urls.any? do |url|
            data = url.dup
            post_params.sort_by { |k, _| k.to_s }.each do |key, value|
              data << key.to_s << value.to_s
            end
            expected = Base64.strict_encode64(OpenSSL::HMAC.digest('sha1', auth_token, data))
            ActiveSupport::SecurityUtils.secure_compare(expected, signature)
          end
        end
      end
    end
  end
end
