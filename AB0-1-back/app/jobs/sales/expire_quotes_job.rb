# frozen_string_literal: true

module Sales
  class ExpireQuotesJob < ApplicationJob
    queue_as :default

    def perform
      ExpireQuotes.call
    end
  end
end
