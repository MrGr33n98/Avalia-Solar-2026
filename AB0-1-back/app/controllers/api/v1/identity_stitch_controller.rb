module Api
  module V1
    class IdentityStitchController < BaseController
      before_action :authenticate_api_user, only: :create

      # POST /api/v1/identity/stitch
      # Stitch anonymous session to identified user
      def create
        # The account identifier is resolved from the authenticated JWT.
        # Never stitch arbitrary user IDs supplied by the browser.
        anonymous_id = params[:anonymous_id].to_s
        if anonymous_id.blank? || anonymous_id.length > 128
          return render json: { error: 'anonymous_id required' }, status: :bad_request
        end

        session = AnonymousSession.find_by(anonymous_id: anonymous_id)
        unless session && session.updated_at >= 30.days.ago &&
               ActiveSupport::SecurityUtils.secure_compare(
                 session.ip_hash.to_s, Digest::SHA256.hexdigest(request.ip.to_s)
               ) &&
               ActiveSupport::SecurityUtils.secure_compare(
                 session.user_agent_hash.to_s, Digest::SHA256.hexdigest(request.user_agent.to_s)
               )
          return render json: { error: 'Session ownership could not be verified' }, status: :forbidden
        end

        StitchIdentityJob.perform_later(current_user.id, anonymous_id)

        render json: {
          status: 'stitching_scheduled',
          user_id: "user_#{current_user.id}"
        }
      end

      # POST /api/v1/identity/track_session
      # Track anonymous session activity
      def track_session
        anonymous_id = params[:anonymous_id]
        company_id = params[:company_id]
        page_url = params[:page_url]

        anonymous_id = SecureRandom.uuid if anonymous_id.blank?

        session = AnonymousSession.find_or_create_by(anonymous_id: anonymous_id) do |s|
          s.ip_hash = Digest::SHA256.hexdigest(request.ip)
          s.user_agent_hash = Digest::SHA256.hexdigest(request.user_agent || '')
          s.device_type = detect_device_type(request.user_agent)
          s.utm_source = params[:utm_source]
          s.utm_medium = params[:utm_medium]
          s.utm_campaign = params[:utm_campaign]
          s.referrer_domain = extract_domain(request.referrer)
        end

        session.track_visit(company_id, page_url) if company_id.present? && page_url.present?
        # A consented login may register an already-known anonymous session.
        # Refresh its server-side proof timestamp without requiring a new visit.
        session.touch

        render json: {
          anonymous_id: anonymous_id,
          session_id: session.id,
          status: session.status
        }
      end

      private

      def detect_device_type(user_agent)
        return 'unknown' if user_agent.blank?

        case user_agent
        when /mobile/i then 'mobile'
        when /tablet/i then 'tablet'
        else 'desktop'
        end
      end

      def extract_domain(url)
        return nil if url.blank?

        URI.parse(url).host
      rescue URI::InvalidURIError
        nil
      end
    end
  end
end
