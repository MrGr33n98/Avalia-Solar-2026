module ApiControllerAuthHelpers
  def sign_in(resource, scope: nil)
    super if defined?(super)
    request.headers['Authorization'] = "Bearer #{JWT.encode({ user_id: resource.id, typ: 'access' }, Rails.application.secret_key_base, 'HS256')}"
  end

  def auth_headers_for(user)
    token = JWT.encode({ user_id: user.id, typ: 'access' }, Rails.application.secret_key_base, 'HS256')
    {
      'ACCEPT' => 'application/json',
      'Authorization' => "Bearer #{token}"
    }
  end

  def json_body
    JSON.parse(response.body)
  end
end
