# frozen_string_literal: true

require 'uri'

module Api
  module V1
    class OutboundController < BaseController
      skip_before_action :authenticate_api_user, raise: false
      skip_before_action :verify_authenticity_token, raise: false

      def redirect_to_target
        company_param = params[:company_id].presence || params[:cid].presence || params[:company_slug].presence
        if company_param.blank?
          return render_error_response(
            message: 'Identificador de empresa é obrigatório (company_id ou slug)',
            status: :bad_request,
            code: 'COMPANY_ID_REQUIRED'
          )
        end

        company = find_target_company(company_param)
        unless company
          return render_error_response(
            message: 'Empresa não encontrada',
            status: :not_found,
            code: 'COMPANY_NOT_FOUND'
          )
        end

        destination_type = params[:destination_type].to_s.presence || 'website'
        destination_type = 'website' unless OutboundClick::ALLOWED_DESTINATION_TYPES.include?(destination_type)

        custom_target = params[:target_url].presence || params[:url].presence
        target_destination = company.resolve_outbound_destination(
          destination_type: destination_type,
          custom_url: custom_target
        )

        if target_destination.blank?
          return render_error_response(
            message: 'Destino não autorizado ou não configurado para esta empresa',
            status: :unprocessable_entity,
            code: 'UNAUTHORIZED_DESTINATION_URL'
          )
        end

        source_context = params[:source_context].to_s.presence || params[:source].to_s.presence || 'profile'
        source_context = 'other' unless OutboundClick::ALLOWED_SOURCES.include?(source_context)

        tracking_enabled = ENV.fetch('TRACK_PROSPECTS_ENABLED', 'false').to_s.casecmp?('true')
        unless tracking_enabled
          Rails.logger.info(
            "[OutboundController] TRACK_PROSPECTS_ENABLED=false: direct 302 to #{target_destination} (company_id=#{company.id})"
          )
          return redirect_to target_destination, status: :found, allow_other_host: true
        end

        idempotency_key = params[:idempotency_key].presence&.slice(0, 128)
        if idempotency_key.present?
          existing_click = OutboundClick.find_by(idempotency_key: idempotency_key)
          if existing_click
            token = OutboundTokenService.encode(
              company_id: existing_click.company_id,
              source_context: existing_click.source_context,
              outbound_click_id: existing_click.id
            )
            redirect_target = append_click_token(existing_click.target_url, token)
            Rails.logger.info(
              "[OutboundController] Replay detectado para idempotency_key=#{idempotency_key}. Redirecionando com click_id=#{existing_click.id}"
            )
            return redirect_to redirect_target, status: :found, allow_other_host: true
          end
        end

        raw_session_id = params[:anonymous_session_id].presence
        anonymous_session_id = valid_uuid?(raw_session_id) ? raw_session_id : nil

        click = company.outbound_clicks.build(
          anonymous_session_id: anonymous_session_id,
          source_context: source_context,
          destination_type: destination_type,
          target_url: target_destination,
          clicked_at: Time.current,
          idempotency_key: idempotency_key,
          ip_hash: OutboundClick.anonymize_ip(request.remote_ip),
          user_agent_hash: OutboundClick.hash_user_agent(request.user_agent),
          click_token_signature: 'temporary'
        )

        click.id = SecureRandom.uuid unless click.id.present?

        token = OutboundTokenService.encode(
          company_id: company.id,
          source_context: source_context,
          outbound_click_id: click.id
        )

        _payload, signature = token.split('.')
        click.click_token_signature = signature.to_s

        if click.save
          destination_with_token = append_click_token(target_destination, token)
          Rails.logger.info(
            "[OutboundController] Registrado click_id=#{click.id} company_id=#{company.id} src=#{source_context}"
          )
          redirect_to destination_with_token, status: :found, allow_other_host: true
        else
          Rails.logger.error(
            "[OutboundController] Falha ao persistir outbound click: #{click.errors.full_messages.join(', ')}"
          )
          redirect_to target_destination, status: :found, allow_other_host: true
        end
      end

      private

      def find_target_company(identifier)
        if identifier.to_s =~ /\A\d+\z/
          ::Company.find_by(id: identifier)
        else
          ::Company.find_by(slug: identifier)
        end
      end

      def valid_uuid?(value)
        return false if value.blank?

        value.to_s.match?(/\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/i)
      end

      def append_click_token(url, token)
        return url if token.blank?

        uri = URI.parse(url)
        query_params = URI.decode_www_form(uri.query.to_s)
        query_params << ['as_click_id', token]
        uri.query = URI.encode_www_form(query_params)
        uri.to_s
      rescue URI::InvalidURIError
        url
      end
    end
  end
end
