# frozen_string_literal: true

module Api
  module V1
    module Sales
      class EmailSequenceEnrollmentsController < BaseController
        def index
          enrollments = visible_enrollments.includes(:sequence, :contact, :account, :opportunity)
                                           .order(created_at: :desc).limit(200)
          render json: { enrollments: enrollments.map { |enrollment| serialize(enrollment) } }
        end

        def show
          render json: { enrollment: serialize(visible_enrollments.find(params[:id])) }
        end

        def create
          input = params.require(:enrollment)
          sequence = scoped_sequences.find(input.require(:sequence_id))
          contact = current_tenant_scope.contacts.find(input.require(:contact_id))
          account = contact.account
          opportunity = scoped_opportunity
          return render_error_response(message: 'Sequência inativa.', status: :unprocessable_entity,
                                       code: 'SEQUENCE_INACTIVE') unless sequence.active?
          return render_relation_conflict(resource: 'EmailSequenceEnrollment') unless account&.company_id == sequence.company_id &&
            current_tenant_scope.valid_relation?(account: account, contact: contact, opportunity: opportunity)

          first_step = sequence.steps.order(:position).first
          return render_error_response(message: 'A sequência não possui etapas.', status: :unprocessable_entity,
                                       code: 'SEQUENCE_EMPTY') unless first_step

          enrollment = ::Sales::EmailSequenceEnrollment.create!(
            company_id: sequence.company_id,
            sales_email_sequence_id: sequence.id,
            sales_contact_id: contact.id,
            sales_account_id: account.id,
            sales_opportunity_id: opportunity&.id,
            owner_id: current_user.id,
            status: 'active',
            current_step: first_step.position,
            enrolled_at: Time.current,
            next_action_at: Time.current + first_step.delay_days.days
          )
          ::Sales::AuditRecorder.call(record: enrollment, action: 'sequence_enrolled', actor: current_user)
          render json: { enrollment: serialize(enrollment) }, status: :created
        rescue ActiveRecord::RecordNotUnique
          enrollment = scoped_enrollments.find_by!(sales_email_sequence_id: params.dig(:enrollment, :sequence_id),
                                                   sales_contact_id: params.dig(:enrollment, :contact_id),
                                                   status: %w[active paused])
          render json: { enrollment: serialize(enrollment) }, status: :ok
        rescue ActiveRecord::RecordInvalid => e
          render json: { error: { code: 'VALIDATION_ERROR', message: e.record.errors.full_messages.to_sentence } },
                 status: :unprocessable_entity
        end

        def pause
          transition('pause') { |enrollment| enrollment.pause!(reason: 'manual_pause') }
        end

        def resume
          transition('resume') { |enrollment| enrollment.resume! }
        end

        def stop
          transition('stop') { |enrollment| enrollment.stop!(reason: 'manual_stop') }
        end

        private

        def transition(action)
          enrollment = visible_enrollments.find(params[:id])
          previous_status = enrollment.status
          enrollment.with_lock { yield enrollment }
          if enrollment.status != previous_status
            ::Sales::AuditRecorder.call(record: enrollment, action: "sequence_#{action}", actor: current_user)
          end
          render json: { enrollment: serialize(enrollment.reload) }
        end

        def visible_enrollments
          scope = scoped_enrollments
          return scope if team_sequence_access?

          scope.where(owner_id: current_user.id)
        end

        def scoped_enrollments
          ::Sales::EmailSequenceEnrollment.where(company_id: current_user.company_id)
        end

        def scoped_sequences
          ::Sales::EmailSequence.where(company_id: current_user.company_id)
        end

        def scoped_opportunity
          return if params.dig(:enrollment, :opportunity_id).blank?

          current_tenant_scope.opportunities.find(params.dig(:enrollment, :opportunity_id))
        end

        def team_sequence_access?
          ::Sales::AuthorizationService.can?(user: current_user, resource: 'email_sequences', action: 'read_team') ||
            ::Sales::AuthorizationService.can?(user: current_user, resource: 'email_sequences', action: 'manage')
        end

        def serialize(enrollment)
          {
            id: enrollment.id,
            sequence_id: enrollment.sales_email_sequence_id,
            sequence_name: enrollment.sequence.name,
            contact_id: enrollment.sales_contact_id,
            contact_name: [enrollment.contact.first_name, enrollment.contact.last_name].compact.join(' '),
            account_id: enrollment.sales_account_id,
            opportunity_id: enrollment.sales_opportunity_id,
            owner_id: enrollment.owner_id,
            status: enrollment.status,
            current_step: enrollment.current_step,
            steps_count: enrollment.sequence.steps.count,
            next_action_at: enrollment.next_action_at,
            enrolled_at: enrollment.enrolled_at,
            paused_at: enrollment.paused_at,
            stopped_at: enrollment.stopped_at,
            stop_reason: enrollment.stop_reason,
            completed_at: enrollment.completed_at,
            history: enrollment.steps.includes(:sequence_step, :email_message, :task).order(:position).map do |step|
              { position: step.position, step_type: step.sequence_step.step_type, status: step.status,
                attempt_count: step.attempt_count, completed_at: step.completed_at,
                email_message_id: step.email_message&.id, task_id: step.task&.id, error_code: step.error_code }
            end
          }
        end
      end
    end
  end
end
