# frozen_string_literal: true

if ENV['MCP_STAGING_MODE'] == 'true'
  Rails.application.config.after_initialize do
    module Mcp
      module Canary
        module Configuration
          def self.enforced?
            false
          end
        end
      end
    end
  end
end
