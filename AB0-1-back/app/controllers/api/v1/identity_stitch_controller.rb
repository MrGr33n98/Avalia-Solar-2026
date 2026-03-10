module Api
  module V1
    class IdentityStitchController < BaseController
      skip_before_action :verify_authenticity_token
      before_action :authenticate_api_user, only: []

      # POST /api/v1/identity/stitch
      # Stitch anonymous session to identified user
      def create
        user_id = params[:user_id]
        anonymous_id = params[:anonymous_id]
        
        if user_id.blank? || anonymous_id.blank?
          return render json: { 
            error: 'user_id and anonymous_id required' 
          }, status: :bad_request
        end
        
        # Trigger async stitching
        StitchIdentityJob.perform_later(user_id, anonymous_id)
        
        render json: { 
          status: 'stitching_scheduled',
          user_id: user_id,
          anonymous_id: anonymous_id
        }
      end

      # POST /api/v1/identity/track_session
      # Track anonymous session activity
      def track_session
        anonymous_id = params[:anonymous_id]
        company_id = params[:company_id]
        page_url = params[:page_url]
        
        if anonymous_id.blank?
          anonymous_id = SecureRandom.uuid
        end
        
        session = AnonymousSession.find_or_create_by(anonymous_id: anonymous_id) do |s|
          s.ip_hash = Digest::SHA256.hexdigest(request.ip)
          s.user_agent_hash = Digest::SHA256.hexdigest(request.user_agent || '')
          s.device_type = detect_device_type(request.user_agent)
          s.utm_source = params[:utm_source]
          s.utm_medium = params[:utm_medium]
          s.utm_campaign = params[:utm_campaign]
          s.referrer_domain = extract_domain(request.referrer)
        end
        
        if company_id.present? && page_url.present?
          session.track_visit(company_id, page_url)
        end
        
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
