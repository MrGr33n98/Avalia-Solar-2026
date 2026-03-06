# frozen_string_literal: true

module Api
  module V1
    class ConsentController < Api::V1::BaseController
      # POST /api/v1/consent/log
      def log
        consent_log = ConsentLog.create!(
          user_id: current_user&.id,
          session_id: session_id,
          consent_type: params[:consent_type],
          consent_given: ActiveModel::Type::Boolean.new.cast(params[:consent_given]),
          policy_version: params[:policy_version] || 'v1.0',
          consent_method: params[:consent_method] || 'banner',
          ip_address: request.remote_ip,
          user_agent: request.user_agent,
          page_url: params[:page_url],
          referrer: params[:referrer],
          metadata: params[:metadata] || {},
          consented_at: Time.current
        )
        
        render json: { 
          status: 'success', 
          id: consent_log.id,
          consented_at: consent_log.consented_at
        }, status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { 
          status: 'error', 
          message: e.message,
          errors: e.record.errors.full_messages
        }, status: :unprocessable_entity
      rescue StandardError => e
        Rails.logger.error("[Consent] Failed to log: #{e.message}")
        Rails.logger.error(e.backtrace.join("\n"))
        render json: { status: 'error', message: 'Internal server error' }, status: :internal_server_error
      end
      
      # POST /api/v1/consent/revoke
      def revoke
        consent_log = ConsentLog.create!(
          user_id: current_user&.id,
          session_id: session_id,
          consent_type: 'all',
          consent_given: false,
          policy_version: 'v1.0',
          consent_method: 'settings_page',
          ip_address: request.remote_ip,
          user_agent: request.user_agent,
          metadata: { 
            revoke_reason: params[:revoke_reason],
            revoked_at: Time.current.iso8601
          },
          consented_at: Time.current
        )
        
        # Mark analytics_events for anonymization if user is authenticated
        if current_user
          AnalyticsEvent.where(user_id: current_user.id).update_all(
            metadata: Arel.sql("metadata || '{\"anonymized\": true, \"anonymized_at\": \"#{Time.current.iso8601}\"}'::jsonb")
          )
        end
        
        render json: { 
          status: 'revoked', 
          id: consent_log.id,
          revoked_at: consent_log.consented_at
        }
      rescue StandardError => e
        Rails.logger.error("[Consent] Failed to revoke: #{e.message}")
        render json: { status: 'error' }, status: :internal_server_error
      end
      
      # GET /api/v1/consent/status
      def status
        consent = ConsentLog.current_consent(
          user_id: current_user&.id,
          session_id: session_id
        )
        
        if consent
          render json: {
            consent_type: consent.consent_type,
            consent_given: consent.consent_given,
            consented_at: consent.consented_at,
            policy_version: consent.policy_version,
            expires_at: consent.expires_at
          }
        else
          render json: { status: 'no_consent' }, status: :not_found
        end
      rescue StandardError => e
        Rails.logger.error("[Consent] Failed to get status: #{e.message}")
        render json: { status: 'error' }, status: :internal_server_error
      end
      
      private
      
      def session_id
        cookies.signed[:as_sid] || begin
          new_sid = SecureRandom.uuid
          cookies.signed[:as_sid] = { 
            value: new_sid, 
            expires: 1.year.from_now,
            httponly: true,
            secure: Rails.env.production?
          }
          new_sid
        end
      end
    end
  end
end
