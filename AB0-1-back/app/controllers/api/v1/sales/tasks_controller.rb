# frozen_string_literal: true

module Api
  module V1
    module Sales
      class TasksController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        def index
          scope = ::Sales::Task.includes(:account, :contact).where(owner: current_user)

          if params[:status].present? && params[:status] != 'all'
            if params[:status] == 'completed'
              scope = scope.where(status: %w[completed done])
            elsif params[:status] == 'pending'
              scope = scope.where.not(status: %w[completed done])
            else
              scope = scope.where(status: params[:status])
            end
          end

          if params[:priority].present?
            scope = scope.where(priority: params[:priority])
          end

          if params[:task_type].present?
            scope = scope.where(task_type: params[:task_type])
          end

          if params[:q].present?
            q = "%#{params[:q].downcase}%"
            scope = scope.left_joins(:account, :contact).where(
              'LOWER(sales_tasks.title) LIKE :q OR LOWER(sales_accounts.name) LIKE :q OR LOWER(sales_contacts.first_name) LIKE :q OR LOWER(sales_contacts.last_name) LIKE :q',
              q: q
            )
          end

          tasks = scope.order(due_at: :asc, created_at: :desc).limit(200)

          render json: { tasks: tasks.map { |t| task_json(t) } }
        end

        def create
          task = ::Sales::Task.new(task_params.merge(owner: current_user))
          task.save!
          render json: { task: task_json(task.reload) }, status: :created
        rescue ActiveRecord::RecordInvalid => e
          render json: {
            error: {
              code: 'VALIDATION_ERROR',
              message: e.message,
              fields: e.record.errors.messages
            }
          }, status: :unprocessable_entity
        end

        def update
          task = ::Sales::Task.where(owner: current_user).find(params[:id])
          task.update!(task_params)
          if (task.status == 'completed' || task.status == 'done') && task.completed_at.blank?
            task.update!(completed_at: Time.current)
          elsif task.status == 'pending' && task.completed_at.present?
            task.update!(completed_at: nil)
          end
          render json: { task: task_json(task.reload) }
        rescue ActiveRecord::RecordNotFound => e
          render_error_response(message: 'Tarefa não encontrada.', status: :not_found, code: 'NOT_FOUND')
        rescue ActiveRecord::RecordInvalid => e
          render json: {
            error: {
              code: 'VALIDATION_ERROR',
              message: e.message,
              fields: e.record.errors.messages
            }
          }, status: :unprocessable_entity
        end

        private



        def task_params
          params.require(:task).permit(
            :sales_account_id, :sales_opportunity_id, :sales_contact_id,
            :task_type, :title, :description, :status, :priority, :due_at
          )
        end

        def task_json(task)
          contact = task.contact
          {
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            task_type: task.task_type,
            due_at: task.due_at,
            completed_at: task.completed_at,
            owner_id: task.owner_id,
            sales_account_id: task.sales_account_id,
            sales_opportunity_id: task.sales_opportunity_id,
            sales_contact_id: task.sales_contact_id,
            account_name: task.account&.name,
            contact_name: contact ? [contact.first_name, contact.last_name].compact.join(' ') : nil,
            created_at: task.created_at,
            updated_at: task.updated_at
          }
        end
      end
    end
  end
end
