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
    ENV.fetch('FRONTEND_URL', 'http://localhost:3000')
  end

  def handle_oauth(provider_name)
    @user = User.from_omniauth(request.env['omniauth.auth'])

    unless @user.persisted?
      message = CGI.escape("Falha ao autenticar com #{provider_name}.")
      return redirect_to "#{frontend_url}/auth/callback?status=error&message=#{message}",
                         allow_other_host: true
    end

    if @user.company_user? && !@user.approved_by_admin?
      return redirect_to "#{frontend_url}/auth/callback?status=pending_approval",
                         allow_other_host: true
    end

    unless @user.active?
      reason = CGI.escape(@user.status.to_s)
      return redirect_to "#{frontend_url}/auth/callback?status=inactive&reason=#{reason}",
                         allow_other_host: true
    end

    issue_oauth_tokens(@user, provider_name)
    redirect_to "#{frontend_url}/auth/callback?status=success", allow_other_host: true
  end

  def issue_oauth_tokens(user, provider_name)
    access_exp  = 15.minutes.from_now
    refresh_exp = 30.days.from_now

    access_token  = jwt_encode({ user_id: user.id, typ: 'access' },  access_exp)
    refresh_token = jwt_encode({ user_id: user.id, typ: 'refresh' }, refresh_exp)

    set_jwt_cookie(access_token,  expires: access_exp)
    set_refresh_cookie(refresh_token, expires: refresh_exp)

    PostHog.identify(distinct_id: user.posthog_distinct_id, properties: user.posthog_properties)
    PostHog.capture(
      distinct_id: user.posthog_distinct_id,
      event: 'social_login_completed',
      properties: { provider: provider_name.downcase, role: user.role }
    )
    WelcomeEmailJob.perform_later(user.id) if user.previously_new_record?
  rescue StandardError => e
    Rails.logger.error("[OmniAuth] Token issue failed for #{provider_name}: #{e.message}")
    raise
  end
end
