# frozen_string_literal: true

module Sales
  class EmailSequenceEnrollmentSchedulerJob < ApplicationJob
    queue_as :default

    def perform
      ::Sales::EmailSequenceEnrollment.due.find_each do |enrollment|
        ::Sales::EmailSequences::EnrollmentProcessor.process(enrollment)
      rescue StandardError => e
        Rails.logger.error({ event: 'sales_sequence_enrollment_scheduler_error', enrollment_id: enrollment.id,
                             tenant_id: enrollment.company_id, error_class: e.class.name }.to_json)
      end
    end
  end
end
