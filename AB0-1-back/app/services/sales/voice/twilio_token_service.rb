# frozen_string_literal: true

require 'base64'
require 'openssl'
require 'json'

module Sales
  module Voice
    class TwilioTokenService
      def self.generate_token(user:)
        new(user: user).generate
      end

      attr_reader :user

      def initialize(user:)
        @user = user
      end

      def generate
        account_sid = ENV['TWILIO_ACCOUNT_SID'].presence
        api_key = ENV['TWILIO_API_KEY'].presence
        api_secret = ENV['TWILIO_API_SECRET'].presence
        app_sid = ENV['TWILIO_TWIML_APP_SID'].presence

        unless account_sid && api_key && api_secret && app_sid
          return {
            configured: false,
            error: 'Twilio não configurado. Defina TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET e TWILIO_TWIML_APP_SID no .env'
          }
        end

        identity = "user_#{user.id}_#{user.email.to_s.gsub(/[^a-zA-Z0-9_-]/, '_')}"
        now = Time.current.to_i
        exp = now + 3600 # 1 hora de validade

        header = {
          typ: 'JWT',
          alg: 'HS256',
          cty: 'twilio-fpa;v=1'
        }

        payload = {
          jti: "#{api_key}-#{now}",
          iss: api_key,
          sub: account_sid,
          exp: exp,
          nbf: now,
          grants: {
            identity: identity,
            voice: {
              outgoing: {
                application_sid: app_sid
              },
              incoming: {
                allow: true
              }
            }
          }
        }

        encoded_header = Base64.urlsafe_encode64(header.to_json, padding: false)
        encoded_payload = Base64.urlsafe_encode64(payload.to_json, padding: false)
        data = "#{encoded_header}.#{encoded_payload}"
        signature = Base64.urlsafe_encode64(OpenSSL::HMAC.digest('sha256', api_secret, data), padding: false)

        token = "#{data}.#{signature}"

        {
          configured: true,
          token: token,
          identity: identity,
          expires_at: Time.at(exp).iso8601,
          caller_id: ENV['TWILIO_CALLER_ID'] || ENV['TWILIO_PHONE_NUMBER']
        }
      end
    end
  end
end
