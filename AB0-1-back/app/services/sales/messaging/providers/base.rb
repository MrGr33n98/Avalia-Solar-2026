# frozen_string_literal: true

module Sales
  module Messaging
    module Providers
      class Base
        Result = Struct.new(:success?, :provider_message_id, :error_code, :error_message, keyword_init: true)

        def send_message(message, options = {})
          raise NotImplementedError, "#{self.class.name}#send_message must be implemented"
        end

        def create_draft(message)
          raise NotImplementedError, "#{self.class.name}#create_draft must be implemented"
        end

        def sync_folder(account, folder = 'inbox', cursor = nil)
          raise NotImplementedError, "#{self.class.name}#sync_folder must be implemented"
        end
      end
    end
  end
end
