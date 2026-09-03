# frozen_string_literal: true

module Sales
  module Messaging
    module Providers
      class Microsoft < Base
        def send_message(email_message, options = {})
          Result.new(success?: false, error_code: 'MICROSOFT_NOT_IMPLEMENTED', error_message: 'Microsoft provider ainda não implementado.')
        end
      end
    end
  end
end
