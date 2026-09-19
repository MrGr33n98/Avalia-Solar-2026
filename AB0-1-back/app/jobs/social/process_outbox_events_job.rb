# frozen_string_literal: true

module Social
  class ProcessOutboxEventsJob < ApplicationJob
    queue_as :default

    def perform
      Outbox::DispatcherService.call(batch_size: 100)
    end
  end
end
