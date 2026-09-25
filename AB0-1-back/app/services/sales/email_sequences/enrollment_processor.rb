# frozen_string_literal: true

module Sales
  module EmailSequences
    class EnrollmentProcessor
      MAX_EMAIL_ATTEMPTS = 3
      RETRY_DELAY = 5.minutes

      def self.process(enrollment)
        new(enrollment).process
      end

      def self.email_sent(email)
        enrollment_step = email.sequence_enrollment_step
        return unless enrollment_step

        new(enrollment_step.enrollment).complete_step!(enrollment_step)
      end

      def self.email_failed(email)
        enrollment_step = email.sequence_enrollment_step
        return unless enrollment_step

        new(enrollment_step.enrollment).fail_step!(enrollment_step, 'PROVIDER_SEND_FAILED')
      end

      def self.task_completed(task)
        enrollment_step = task.sequence_enrollment_step
        return unless enrollment_step

        new(enrollment_step.enrollment).complete_step!(enrollment_step)
      end

      def self.stop_for_contact(contact:, reason:)
        EmailSequenceEnrollment.where(sales_contact_id: contact.id, status: %w[active paused]).find_each do |enrollment|
          enrollment.stop!(reason: reason)
          AuditRecorder.call(record: enrollment, action: 'sequence_stopped', actor: enrollment.owner)
        end
      end

      def initialize(enrollment)
        @enrollment = enrollment
      end

      def process
        email_message_id = nil
        @enrollment.with_lock do
          @enrollment.reload
          return unless @enrollment.status == 'active' && @enrollment.next_action_at &&
                        @enrollment.next_action_at <= Time.current

          reason = stop_reason
          if reason
            @enrollment.stop!(reason: reason)
          else
            step = next_step
            if step.nil?
              complete_enrollment!
            else
              execution = enrollment_step_for(step)
              if %w[task call_task].include?(step.step_type)
                process_task(step, execution)
              elsif ::Sales::Messaging::SendingGate.enabled?
                email_message_id = process_email(step, execution)
              else
                @enrollment.pause!(reason: 'email_sending_disabled')
              end
            end
          end
        end
        enqueue_email(email_message_id) if email_message_id
      rescue StandardError => e
        Rails.logger.error({ event: 'sales_sequence_step_failed', enrollment_id: @enrollment.id,
                             sequence_id: @enrollment.sales_email_sequence_id, error_class: e.class.name }.to_json)
        raise
      end

      def complete_step!(execution)
        @enrollment.with_lock do
          execution.reload
          return if execution.status == 'completed'

          execution.update!(status: 'completed', completed_at: Time.current, next_attempt_at: nil, error_code: nil)
          advance_enrollment!(execution.position)
        end
        AuditRecorder.call(record: @enrollment, action: 'sequence_step_completed', actor: @enrollment.owner)
      end

      def fail_step!(execution, error_code)
        @enrollment.with_lock do
          execution.reload
          if execution.attempt_count >= MAX_EMAIL_ATTEMPTS
            execution.update!(status: 'failed', error_code: error_code, next_attempt_at: nil)
            @enrollment.update!(status: 'failed', next_action_at: nil, stop_reason: error_code)
          else
            retry_at = RETRY_DELAY.from_now
            execution.update!(status: 'failed', error_code: error_code, next_attempt_at: retry_at)
            @enrollment.update!(next_action_at: retry_at)
          end
        end
      end

      private

      def stop_reason
        return 'suppressed' if ::Sales::Messaging::SuppressionChecker.blocked?(
          company_id: @enrollment.company_id, email: @enrollment.contact.email
        )
        return 'reply_received' if replied?
        return 'opportunity_won' if @enrollment.opportunity&.status == 'won'
        return 'opportunity_lost' if @enrollment.opportunity&.status == 'lost'

        nil
      end

      def replied?
        ::Sales::EmailEvent.joins(:email_message)
                           .where(sales_email_messages: { company_id: @enrollment.company_id,
                                                          sales_contact_id: @enrollment.sales_contact_id },
                                  event_type: 'replied').exists?
      end

      def next_step
        @enrollment.sequence.steps.where('position >= ?', @enrollment.current_step).order(:position).first
      end

      def enrollment_step_for(step)
        @enrollment.steps.create_or_find_by!(sales_email_sequence_step_id: step.id) do |record|
          record.company_id = @enrollment.company_id
          record.position = step.position
          record.status = 'queued'
        end
      end

      def process_email(step, execution)
        unless @enrollment.contact.email.present?
          execution.update!(status: 'failed', error_code: 'CONTACT_EMAIL_MISSING')
          @enrollment.update!(status: 'failed', next_action_at: nil, stop_reason: 'contact_email_missing')
          return
        end

        template = step.email_template
        raise ActiveRecord::RecordNotFound unless template && template.company_id == @enrollment.company_id

        if @enrollment.company.email.blank?
          execution.update!(status: 'failed', error_code: 'SENDER_EMAIL_MISSING')
          @enrollment.update!(status: 'failed', next_action_at: nil, stop_reason: 'sender_email_missing')
          return
        end

        message = execution.email_message
        if message&.status == 'sending'
          @enrollment.update!(next_action_at: nil)
          return
        end
        if %w[sent delivered].include?(message&.status)
          execution.update!(status: 'completed', completed_at: Time.current)
          advance_enrollment!(step.position)
          return
        end
        if message&.status == 'failed' && execution.attempt_count >= MAX_EMAIL_ATTEMPTS
          execution.update!(status: 'failed', error_code: 'MAX_EMAIL_ATTEMPTS')
          @enrollment.update!(status: 'failed', next_action_at: nil, stop_reason: 'max_email_attempts')
          return
        end

        execution.update!(status: 'queued', attempt_count: execution.attempt_count + 1,
                          next_attempt_at: nil, error_code: nil)
        message ||= create_email_message!(execution, template)
        if message.status == 'failed'
          message.update!(status: 'queued',
                          metadata: (message.metadata || {}).except('error'))
        end
        @enrollment.update!(next_action_at: nil)
        message.id
      end

      def create_email_message!(execution, template)
        thread = ::Sales::EmailThread.create!(
          company_id: @enrollment.company_id,
          sales_account_id: @enrollment.sales_account_id,
          sales_contact_id: @enrollment.sales_contact_id,
          subject_normalized: template.subject_template.to_s.downcase.strip,
          first_message_at: Time.current,
          last_message_at: Time.current,
          message_count: 0
        )
        ::Sales::EmailMessage.create!(
          company_id: @enrollment.company_id,
          sales_email_thread_id: thread.id,
          sales_email_sequence_enrollment_step_id: execution.id,
          sales_account_id: @enrollment.sales_account_id,
          sales_contact_id: @enrollment.sales_contact_id,
          sales_opportunity_id: @enrollment.sales_opportunity_id,
          sender_user_id: @enrollment.owner_id,
          from_email: @enrollment.company.email,
          to_email: @enrollment.contact.email,
          subject: template.subject_template,
          body_html: template.body_html,
          body_json: template.body_json || {},
          status: 'queued',
          metadata: { sequence_id: @enrollment.sales_email_sequence_id,
                      enrollment_id: @enrollment.id, sequence_step_id: execution.sales_email_sequence_step_id }
        ).tap { thread.update!(message_count: 1, last_message_at: Time.current) }
      end

      def process_task(step, execution)
        return if execution.task.present?

        task = ::Sales::Task.create!(
          sales_account_id: @enrollment.sales_account_id,
          sales_contact_id: @enrollment.sales_contact_id,
          sales_opportunity_id: @enrollment.sales_opportunity_id,
          sales_email_sequence_enrollment_step_id: execution.id,
          owner_id: @enrollment.owner_id,
          task_type: step.step_type == 'call_task' ? 'call' : 'follow_up',
          title: "Follow-up: #{@enrollment.sequence.name}",
          description: "Etapa #{step.position + 1} da cadência #{@enrollment.sequence.name}.",
          status: 'pending',
          priority: 'medium',
          due_at: Time.current
        )
        execution.update!(status: 'task_pending')
        @enrollment.update!(next_action_at: nil)
        AuditRecorder.call(record: task, action: 'sequence_task_created', actor: @enrollment.owner)
      end

      def enqueue_email(email_message_id)
        ::Sales::SendEmailJob.perform_later(email_message_id)
      rescue StandardError => e
        email = ::Sales::EmailMessage.find_by(id: email_message_id)
        self.class.email_failed(email) if email
        Rails.logger.error({ event: 'sales_sequence_email_enqueue_failed', enrollment_id: @enrollment.id,
                             error_class: e.class.name }.to_json)
      end

      def advance_enrollment!(completed_position)
        upcoming = @enrollment.sequence.steps.where('position > ?', completed_position).order(:position).first
        if upcoming
          @enrollment.update!(current_step: upcoming.position,
                              next_action_at: Time.current + upcoming.delay_days.days)
        else
          @enrollment.update!(status: 'completed', completed_at: Time.current, next_action_at: nil)
        end
      end

      def complete_enrollment!
        @enrollment.update!(status: 'completed', completed_at: Time.current, next_action_at: nil)
      end
    end
  end
end
