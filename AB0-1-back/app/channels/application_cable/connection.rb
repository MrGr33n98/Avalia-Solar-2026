# frozen_string_literal: true

module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    private

    def find_verified_user
      token = request.params[:token].to_s
      header = request.headers['Authorization'].to_s
      token = header.split.last if token.blank? && header.present?
      return nil if token.blank?

      payload = decode_token(token)
      return nil unless payload && payload['user_id']

      User.find_by(id: payload['user_id'])
    rescue StandardError
      nil
    end

    def decode_token(token)
      JWT.decode(token, Rails.application.secret_key_base, true, algorithm: 'HS256').first
    rescue JWT::DecodeError
      nil
    end
  end
end
