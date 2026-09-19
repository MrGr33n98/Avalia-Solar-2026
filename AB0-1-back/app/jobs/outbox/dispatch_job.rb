# frozen_string_literal: true

module Outbox
  class DispatchJob < ApplicationJob
    queue_as :default

    def perform(batch_size: 100)
      Outbox::DispatcherService.call(batch_size: batch_size)
    end
  end
end
