# frozen_string_literal: true

class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  include JwtAuthenticatable

  skip_before_action :verify_authenticity_token, only: %i[google_oauth2 linkedin facebook]

  # Skip token revocation check — user is not authenticated yet during OAuth
  def skip_token_check?
    true
  end

  def google_oauth2
    handle_oauth('Google')
  end

  def linkedin
    handle_oauth('LinkedIn')
  end

  def facebook
    handle_oauth('Facebook')
  end

  def failure
    message = CGI.escape(params[:message].to_s.presence || 'oauth_failed')
    redirect_to "#{frontend_url}/auth/callback?status=error&message=#{message}",
                allow_other_host: true
  end

  private

  def frontend_url
    ENV.fetch('FRONTEND_ORIGIN', ENV.fetch('FRONTEND_URL', Rails.env.production? ? 'https://www.avaliasolar.com.br' : 'http://localhost:3000'))
  end

  def handle_oauth(provider_name)
    @user = User.from_omniauth(request.env['omniauth.auth'])
    blocked_url = blocked_oauth_redirect_url(@user, provider_name)
    return redirect_to(blocked_url, allow_other_host: true) if blocked_url

    issue_oauth_tokens(@user, provider_name)
    return_to = stored_location_for(:user)
    if oauth_authorize_return_to?(return_to)
      sign_in(:user, @user)
      return redirect_to(return_to, allow_other_host: false)
    end

    redirect_to "#{frontend_url}/auth/callback?status=success", allow_other_host: true
  end

  def blocked_oauth_redirect_url(user, provider_name)
    unless user.persisted?
      message = CGI.escape("Falha ao autenticar com #{provider_name}.")
      return "#{frontend_url}/auth/callback?status=error&message=#{message}"
    end
    return "#{frontend_url}/auth/callback?status=pending_approval" if user.company_user? && !user.approved_by_admin?
    return nil if user.active? && user.active_for_authentication?

    reason = CGI.escape(user.status.to_s)
    "#{frontend_url}/auth/callback?status=inactive&reason=#{reason}"
  end

  def oauth_authorize_return_to?(location)
    return false unless location.is_a?(String) && location.start_with?('/oauth/authorize')

    uri = URI.parse(location)
    uri.scheme.nil? && uri.host.nil? && uri.path == '/oauth/authorize'
  rescue URI::InvalidURIError
    false
  end

  def issue_oauth_tokens(user, provider_name)
    access_exp  = 1.hour.from_now
    refresh_exp = 60.days.from_now

    access_token  = jwt_encode({ user_id: user.id, typ: 'access' },  access_exp)
    refresh_token = jwt_encode({ user_id: user.id, typ: 'refresh' }, refresh_exp)

    set_jwt_cookie(access_token, expires: access_exp)
    set_refresh_cookie(refresh_token, expires: refresh_exp)

    Analytics::PostHogService.identify(distinct_id: user.posthog_distinct_id, properties: user.posthog_properties)
    Analytics::PostHogService.capture(
      'social_login_completed',
      { provider: provider_name.downcase, role: user.role },
      distinct_id: user.posthog_distinct_id
    )
    WelcomeEmailJob.perform_later(user.id) if user.previously_new_record?
  rescue StandardError => e
    Rails.logger.error("[OmniAuth] Token issue failed for #{provider_name}: #{e.message}")
    raise
  end
end
