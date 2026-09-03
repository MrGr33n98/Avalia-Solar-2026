# frozen_string_literal: true

module Sales
  module Messaging
    module Providers
      class Microsoft < Base
        def send_message(email_message, options = {})
          Result.new(
            success?: true,
            provider_message_id: "msgraph-#{SecureRandom.hex(10)}"
          )
        end
      end
    end
  end
end
