# frozen_string_literal: true

# Security Middleware: Block sensitive tokens in URL query strings
# Prevents token leakage in logs, analytics, and browser history
class BlockTokensInUrlMiddleware
  SENSITIVE_PARAMS = %w[
    confirmation_token
    reset_password_token
    unlock_token
    invitation_token
    token
    access_token
    refresh_token
    jwt
  ].freeze

  def initialize(app)
    @app = app
  end

  def call(env)
    request = Rack::Request.new(env)

    # Check for sensitive tokens in query string
    SENSITIVE_PARAMS.each do |param|
      next unless request.params[param].present?

      Rails.logger.warn(
        "[Security] Blocked request with #{param} in URL query string | " \
        "IP: #{request.ip} | " \
        "Path: #{request.path} | " \
        "User-Agent: #{request.user_agent}"
      )

      return forbidden_response(request)
    end

    @app.call(env)
  end

  private

  def forbidden_response(_request)
    [
      403,
      {
        'Content-Type' => 'application/json',
        'X-Security-Block' => 'token-in-url'
      },
      [
        {
          error: 'Forbidden',
          message: 'Tokens não devem ser enviados na URL por questões de segurança.',
          code: 'TOKEN_IN_URL_FORBIDDEN',
          hint: 'Use o link correto enviado por email (hash fragment).'
        }.to_json
      ]
    ]
  end
end
