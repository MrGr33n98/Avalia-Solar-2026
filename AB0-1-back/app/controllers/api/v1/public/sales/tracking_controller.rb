# frozen_string_literal: true

require 'digest'

module Api
  module V1
    module Public
      module Sales
        class TrackingController < Api::V1::Sales::BaseController
          MAX_PAYLOAD_BYTES = 16.kilobytes
          ALLOWED_EVENTS = %w[
            page_view company_view cta_click quote_request_started quote_request_submitted
            form_started form_submitted lead_confirmed consent_granted consent_revoked
          ].freeze

          skip_before_action :authenticate_api_user
          skip_before_action :require_internal_sales
          before_action :resolve_site
          before_action :reject_oversized_payload, except: %i[options script]
          after_action :apply_origin_headers
          rescue_from ActionDispatch::Http::Parameters::ParseError, with: :invalid_event

          def options
            head :no_content
          end

          def script
            response.set_header('Cache-Control', 'public, max-age=300')
            render body: tracking_script, content_type: 'application/javascript; charset=utf-8'
          end

          def create_session
            return oversized_payload if oversized_request?

            raw_consent = params.dig(:session, :consent_state).to_s.strip.downcase
            consent_state = %w[granted denied].include?(raw_consent) ? raw_consent : 'unknown'

            as_click_id = params.dig(:session, :as_click_id).presence || params[:as_click_id].presence
            outbound_click = nil
            click_hash = nil

            if as_click_id.present? && consent_state != 'denied'
              outbound_click, click_hash = resolve_verified_outbound_click(as_click_id)
            end

            session = ::Sales::TrackingSession.create!(
              company: @site.company,
              session_id: SecureRandom.uuid,
              anonymous_id: SecureRandom.uuid,
              outbound_click: outbound_click,
              consent_state: consent_state,
              as_click_id_hash: click_hash,
              utm_source: safe_utm(:utm_source),
              utm_medium: safe_utm(:utm_medium),
              utm_campaign: safe_utm(:utm_campaign),
              referrer_host: visitor_referrer_host,
              landing_path: safe_path(params.dig(:session, :landing_path)),
              traffic_class: traffic_class,
              started_at: Time.current
            )

            render json: {
              session_id: session.session_id,
              anonymous_id: session.anonymous_id,
              attributed: session.attributed?,
              consent_state: session.consent_state
            }, status: :created
          end

          def create_event
            return oversized_payload if oversized_request?

            attributes = event_params
            return invalid_event unless valid_event?(attributes)

            session = ::Sales::TrackingSession.where(company_id: @site.company_id)
                                              .find_by!(session_id: attributes[:session_id])

            if session.consent_denied? && attributes[:event_name] != 'consent_granted'
              return render json: { accepted: false, reason: 'consent_denied' }, status: :ok
            end

            if attributes[:event_name] == 'consent_revoked'
              session.update!(consent_state: 'denied')
            elsif attributes[:event_name] == 'consent_granted'
              session.update!(consent_state: 'granted')
            end

            _, created = persist_event(session, attributes)
            render json: { accepted: true, duplicate: !created }, status: created ? :accepted : :ok
          rescue ActiveRecord::RecordNotUnique
            render json: { accepted: true, duplicate: true }, status: :ok
          end

          private

          def resolve_site
            public_key = request.path_parameters[:public_key]
            @site = ::Sales::TrackingSite.find_by!(public_key: public_key, active: true)
            origin = request.headers['Origin'].presence || referer_origin
            unless origin.present? && @site.allowed_origins.include?(normalize_origin(origin))
              return render_error_response(message: 'Origem não autorizada para este site.', status: :forbidden,
                                           code: 'TRACKING_ORIGIN_FORBIDDEN')
            end
            @tracking_origin = origin
          end

          def normalize_origin(value)
            ::Sales::TrackingSite.normalize_origin(value)
          end

          def apply_origin_headers
            return unless @tracking_origin

            response.set_header('Access-Control-Allow-Origin', @tracking_origin)
            response.set_header('Vary', 'Origin')
            response.set_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
            response.set_header('Access-Control-Allow-Headers', 'Content-Type, Idempotency-Key')
            response.set_header('Access-Control-Max-Age', '600')
          end

          def event_params
            params.require(:event).permit(:session_id, :event_uuid, :event_name, :path, properties: {})
          end

          def valid_event?(attributes)
            ALLOWED_EVENTS.include?(attributes[:event_name]) &&
              attributes[:event_uuid].to_s.match?(/\A[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\z/i)
          end

          def persist_event(session, attributes)
            event = session.events.find_or_initialize_by(event_uuid: attributes[:event_uuid])
            created = event.new_record?
            event.assign_attributes(event_attributes(attributes))
            event.save! if created
            [event, created]
          end

          def event_attributes(attributes)
            {
              company: @site.company,
              event_name: attributes[:event_name],
              path: safe_path(attributes[:path]),
              properties: ::Sales::Tracking::PropertiesSanitizer.call(attributes[:properties]),
              occurred_at: Time.current
            }
          end

          def oversized_request?
            request.raw_post.bytesize > MAX_PAYLOAD_BYTES
          end

          def reject_oversized_payload
            oversized_payload if oversized_request?
          end

          def safe_utm(key)
            value = params.dig(:session, key).to_s.strip
            return if value.blank? || value.bytesize > 200 || value.match?(/@|\b\d{8,}\b/)

            value
          end

          def visitor_referrer_host
            URI.parse(params.dig(:session, :referrer).to_s).host&.downcase
          rescue URI::InvalidURIError
            nil
          end

          def referer_origin
            URI.parse(request.headers['Referer'].to_s).then do |uri|
              uri.port == uri.default_port ? "#{uri.scheme}://#{uri.host}" : "#{uri.scheme}://#{uri.host}:#{uri.port}"
            end
          rescue URI::InvalidURIError
            nil
          end

          def tracking_script
            ::Sales::Tracking::ScriptRenderer.new(api_root: request.base_url, public_key: @site.public_key).call
          end

          def safe_path(value)
            path = URI.parse(value.to_s).path.to_s
            path.start_with?('/') && path.bytesize <= 500 ? path : nil
          rescue URI::InvalidURIError
            nil
          end

          def traffic_class
            internal_hosts = %w[avaliasolar.com.br www.avaliasolar.com.br app.avaliasolar.com.br
                                crm.avaliasolar.com.br accounts.google.com localhost 127.0.0.1]
            site_host = URI.parse(@tracking_origin).host
            referrer = visitor_referrer_host
            internal = [site_host, referrer].compact.any? do |host|
              internal_hosts.include?(host) || host.end_with?('.avaliasolar.com.br')
            end
            internal ? 'internal' : 'commercial'
          end

          def resolve_verified_outbound_click(token)
            return [nil, nil] if token.blank? || token.to_s.bytesize > 1024

            payload = OutboundTokenService.decode(token)
            unless payload
              Rails.logger.warn("[TrackingController] Token as_click_id inválido ou adulterado para site=#{@site.public_key}")
              return [nil, nil]
            end

            token_company_id = payload[:cid].to_i
            if token_company_id != @site.company_id.to_i
              Rails.logger.warn(
                "[TrackingController] Bloqueio cross-tenant: token.cid=#{token_company_id} != site.company_id=#{@site.company_id}"
              )
              return [nil, nil]
            end

            click_id = payload[:clk].to_s
            click = ::OutboundClick.find_by(id: click_id, company_id: @site.company_id)
            unless click
              Rails.logger.warn("[TrackingController] OutboundClick id=#{click_id} não encontrado para company_id=#{@site.company_id}")
              return [nil, nil]
            end

            _encoded_payload, signature = token.to_s.split('.')
            unless ActiveSupport::SecurityUtils.secure_compare(click.click_token_signature.to_s, signature.to_s)
              Rails.logger.warn("[TrackingController] Assinatura do token não confere com OutboundClick id=#{click_id}")
              return [nil, nil]
            end

            click_hash = Digest::SHA256.hexdigest(token.to_s)[0..63]
            [click, click_hash]
          rescue StandardError => e
            Rails.logger.error("[TrackingController] Erro ao resolver outbound click: #{e.message}")
            [nil, nil]
          end

          def oversized_payload
            render_error_response(message: 'Payload de tracking excede 16 KB.', status: :unprocessable_entity,
                                  code: 'TRACKING_PAYLOAD_TOO_LARGE')
          end

          def invalid_event
            render_error_response(message: 'Evento ou identificador inválido.', status: :unprocessable_entity,
                                  code: 'TRACKING_EVENT_INVALID')
          end
        end
      end
    end
  end
end
