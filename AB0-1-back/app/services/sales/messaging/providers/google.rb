# frozen_string_literal: true

module Sales
  module Messaging
    module Providers
      class Google < Base
        def send_message(email_message, options = {})
          Result.new(success?: false, error_code: 'GOOGLE_NOT_IMPLEMENTED', error_message: 'Google provider ainda não implementado.')
        end
      end
    end
  end
end
