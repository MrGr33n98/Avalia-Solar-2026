# frozen_string_literal: true

module Api
  module V1
    module Sales
      class EmailSequencesController < BaseController
        def index
          render json: { sequences: scoped_sequences.includes(:steps).order(updated_at: :desc).map { |sequence| serialize(sequence) } }
        end

        def show
          render json: { sequence: serialize(scoped_sequences.includes(:steps).find(params[:id])) }
        end

        def create
          attributes = sequence_params
          return render_hidden_template unless sequence_templates_accessible?(attributes[:steps_attributes])

          sequence = scoped_sequences.create!(attributes.merge(company_id: current_user.company_id, user_id: current_user.id))
          render json: { sequence: serialize(sequence) }, status: :created
        rescue ActiveRecord::RecordInvalid => e
          render json: { error: e.record.errors.full_messages.to_sentence }, status: :unprocessable_entity
        end

        def update
          sequence = scoped_sequences.find(params[:id])
          attributes = sequence_params
          return render_hidden_template unless sequence_templates_accessible?(attributes[:steps_attributes])

          sequence.update!(attributes)
          render json: { sequence: serialize(sequence) }
        end

        def destroy
          scoped_sequences.find(params[:id]).destroy!
          render json: { message: 'Sequência removida.' }
        end

        private

        def scoped_sequences
          ::Sales::EmailSequence.where(company_id: current_user.company_id)
        end

        def sequence_params
          params.require(:sequence).permit(:name, :description, :active, steps_attributes: %i[id position delay_days step_type email_template_id _destroy])
        end

        def sequence_templates_accessible?(steps_attributes)
          steps = steps_attributes.respond_to?(:values) ? steps_attributes.values : Array(steps_attributes)
          template_ids = steps.filter_map { |step| step[:email_template_id].presence }.map(&:to_s).uniq
          return true if template_ids.empty?

          ::Sales::EmailTemplate.where(company_id: current_user.company_id)
                                .where(user_id: [nil, current_user.id])
                                .where(id: template_ids).count == template_ids.size
        end

        def render_hidden_template
          log_sales_denial(reason: 'template_out_of_scope', resource: 'EmailTemplate')
          render_error_response(message: 'Recurso não encontrado.', status: :not_found, code: 'NOT_FOUND')
        end

        def serialize(sequence)
          { id: sequence.id, name: sequence.name, description: sequence.description, active: sequence.active,
            steps: sequence.steps.order(:position).map { |step| { id: step.id, position: step.position, delay_days: step.delay_days, step_type: step.step_type, email_template_id: step.email_template_id } } }
        end
      end
    end
  end
end
