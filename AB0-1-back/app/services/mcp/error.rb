# frozen_string_literal: true

module Mcp
  class Error < StandardError
    attr_reader :code, :status, :details

    def initialize(code:, message:, status: :unprocessable_entity, details: nil)
      super(message)
      @code = code.to_s
      @status = status
      @details = details
    end
  end
end
