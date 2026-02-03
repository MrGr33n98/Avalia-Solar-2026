# frozen_string_literal: true

# Concern for JWT token authentication and revocation checking
# TASK: P0 - Implementar revogação de JWT via Redis (Logout real)
#
# Usage:
#   class Api::V1::SomeController < Api::V1::BaseController
#     include JwtAuthenticatable
#   end
#
module JwtAuthenticatable
  extend ActiveSupport::Concern
  
  included do
    before_action :check_token_revocation, unless: :skip_token_check?
  end
  
  private
  
  # Check if the current token has been revoked
  # This runs before every action in controllers that include this concern
  def check_token_revocation
    return true unless current_token
    
    # Check if specific token is blacklisted
    if JwtBlacklistService.revoked?(current_token)
      Rails.logger.warn("[Auth] Revoked token attempt: user_id=#{current_user&.id} ip=#{request.remote_ip}")
      
      render json: { 
        error: 'Token has been revoked',
        message: 'Your session has been terminated. Please login again.',
        code: 'TOKEN_REVOKED'
      }, status: :unauthorized
      return false
    end
    
    # Check if all user tokens were revoked (logout from all devices)
    if current_user
      revoked_at = JwtBlacklistService.user_tokens_revoked_at(current_user.id)
      
      if revoked_at && token_issued_before?(revoked_at)
        Rails.logger.warn("[Auth] Expired session attempt: user_id=#{current_user.id} token_iat=#{token_issued_at} revoked_at=#{revoked_at}")
        
        render json: { 
          error: 'Session expired',
          message: 'You have been logged out from all devices. Please login again.',
          code: 'SESSION_EXPIRED'
        }, status: :unauthorized
        return false
      end
    end
    
    true
  end
  
  # Get the current JWT token from request
  # Checks cookie first, then Authorization header
  # @return [String, nil]
  def current_token
    @current_token ||= extract_token_from_request
  end
  
  # Extract token from cookie or Authorization header
  # @return [String, nil]
  def extract_token_from_request
    # Try cookie first (preferred method)
    token = cookies.signed[:jwt_token]
    return token if token.present?
    
    # Fallback to Authorization header (for backward compatibility)
    header = request.headers['Authorization']
    return nil unless header
    
    # Extract token from "Bearer <token>" format
    header.split(' ').last if header.start_with?('Bearer ')
  end

  # Set the JWT token as an httpOnly cookie
  # @param token [String]
  def set_jwt_cookie(token, expires: 24.hours.from_now)
    cookie_opts = {
      value: token,
      httponly: true,
      secure: Rails.env.production?,
      same_site: :lax,
      expires: expires,
      path: "/"
    }
    cookies.signed[:jwt_token] = cookie_opts
  end

  def set_refresh_cookie(token, expires: 30.days.from_now)
    cookie_opts = {
      value: token,
      httponly: true,
      secure: Rails.env.production?,
      same_site: :lax,
      expires: expires,
      path: "/"
    }
    cookies.signed[:refresh_token] = cookie_opts
  end
  
  # Check if token was issued before a given timestamp
  # Used to validate against user-wide token revocation
  # @param timestamp [Time, Integer] The comparison timestamp
  # @return [Boolean]
  def token_issued_before?(timestamp)
    return false unless current_token
    
    iat = token_issued_at
    return false unless iat
    
    iat < timestamp.to_i
  end
  
  # Get the token issued at time (iat claim)
  # @return [Integer, nil] Unix timestamp or nil
  def token_issued_at
    return @token_iat if defined?(@token_iat)
    
    payload = JWT.decode(current_token, nil, false).first
    @token_iat = (payload['iat'] || payload[:iat])&.to_i
  rescue JWT::DecodeError
    @token_iat = nil
  end
  
  # Override this method in controllers to skip token revocation check
  # @return [Boolean]
  def skip_token_check?
    false
  end
  
  # Revoke current user's token on logout
  # Call this method in logout action
  # @return [Boolean]
  def revoke_current_token
    return false unless current_token
    
    success = JwtBlacklistService.revoke_token(current_token)
    
    if success
      Rails.logger.info("[Auth] Token revoked on logout: user_id=#{current_user&.id}")
    else
      Rails.logger.warn("[Auth] Failed to revoke token: user_id=#{current_user&.id}")
    end
    
    success
  end
  
  # Revoke all tokens for current user (logout from all devices)
  # @return [Boolean]
  def revoke_all_user_tokens
    return false unless current_user
    
    success = JwtBlacklistService.revoke_all_user_tokens(current_user.id)
    
    if success
      Rails.logger.info("[Auth] All tokens revoked: user_id=#{current_user.id}")
    else
      Rails.logger.warn("[Auth] Failed to revoke all tokens: user_id=#{current_user.id}")
    end
    
    success
  end

  # Encode a new JWT token
  # @param payload [Hash]
  # @param exp [ActiveSupport::Duration]
  # @return [String]
  def jwt_encode(payload, exp = 24.hours.from_now)
    payload[:exp] = exp.to_i
    payload[:iat] = Time.current.to_i
    payload[:jti] = SecureRandom.uuid
    JWT.encode(payload, Rails.application.secret_key_base)
  end
end
