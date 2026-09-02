module ApiControllerAuthHelpers
  def sign_in(resource, scope: nil)
    super
    request.headers['Authorization'] = "Bearer #{JWT.encode({ user_id: resource.id, typ: 'access' }, Rails.application.secret_key_base, 'HS256')}"
  end
end
