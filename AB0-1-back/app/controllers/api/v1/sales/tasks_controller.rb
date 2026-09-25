# frozen_string_literal: true

module Api
  module V1
    module Sales
      class TasksController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        def index
          scope = current_tenant_scope.tasks.where(owner_id: current_user.id).includes(:account, :contact)
          if params[:account_id].present?
            account = current_tenant_scope.accounts.find(params[:account_id])
            scope = scope.where(sales_account_id: account.id)
          end

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
          attrs = task_params.to_h.symbolize_keys
          if params[:account_id].present? && attrs[:sales_account_id].present? &&
             attrs[:sales_account_id].to_s != params[:account_id].to_s
            return render_relation_conflict(resource: 'Task')
          end
          acc_id = params[:account_id].presence || attrs[:sales_account_id]
          opp_id = attrs[:sales_opportunity_id]
          cnt_id = attrs[:sales_contact_id]

          account = current_tenant_scope.accounts.find_by(id: acc_id) if acc_id.present?
          opportunity = current_tenant_scope.opportunities.find_by(id: opp_id) if opp_id.present?
          contact = current_tenant_scope.contacts.find_by(id: cnt_id) if cnt_id.present?

          unless acc_id.present?
            return render_error_response(message: 'Conta é obrigatória.', status: :unprocessable_entity, code: 'ACCOUNT_REQUIRED')
          end
          if account.nil?
            log_sales_denial(reason: 'foreign_key_out_of_scope', resource: 'Account')
            return render_error_response(message: 'Recurso não encontrado.', status: :not_found, code: 'NOT_FOUND')
          end

          if opp_id.present? && opportunity.nil?
            log_sales_denial(reason: 'foreign_key_out_of_scope', resource: 'Opportunity')
            return render_error_response(message: 'Recurso não encontrado.', status: :not_found, code: 'NOT_FOUND')
          end

          if cnt_id.present? && contact.nil?
            log_sales_denial(reason: 'foreign_key_out_of_scope', resource: 'Contact')
            return render_error_response(message: 'Recurso não encontrado.', status: :not_found, code: 'NOT_FOUND')
          end

          if !current_tenant_scope.valid_relation?(account: account, contact: contact, opportunity: opportunity)
            return render_relation_conflict(resource: 'Task')
          end
          return render_relation_conflict(resource: 'Task') unless current_tenant_scope.valid_owner?(current_user, account: account)

          task = ::Sales::Task.new(attrs.merge(owner: current_user, sales_account_id: account&.id))
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
          task = current_tenant_scope.tasks.where(owner_id: current_user.id).find(params[:id])
          attrs = task_params.to_h.symbolize_keys
          acc_id = attrs[:sales_account_id].presence || task.sales_account_id
          opp_id = attrs.key?(:sales_opportunity_id) ? attrs[:sales_opportunity_id] : task.sales_opportunity_id
          cnt_id = attrs.key?(:sales_contact_id) ? attrs[:sales_contact_id] : task.sales_contact_id

          account = current_tenant_scope.accounts.find_by(id: acc_id) if acc_id.present?
          opportunity = current_tenant_scope.opportunities.find_by(id: opp_id) if opp_id.present?
          contact = current_tenant_scope.contacts.find_by(id: cnt_id) if cnt_id.present?

          if acc_id.present? && account.nil?
            log_sales_denial(reason: 'foreign_key_out_of_scope', resource: 'Account')
            return render_error_response(message: 'Recurso não encontrado.', status: :not_found, code: 'NOT_FOUND')
          end

          if opp_id.present? && opportunity.nil?
            log_sales_denial(reason: 'foreign_key_out_of_scope', resource: 'Opportunity')
            return render_error_response(message: 'Recurso não encontrado.', status: :not_found, code: 'NOT_FOUND')
          end

          if cnt_id.present? && contact.nil?
            log_sales_denial(reason: 'foreign_key_out_of_scope', resource: 'Contact')
            return render_error_response(message: 'Recurso não encontrado.', status: :not_found, code: 'NOT_FOUND')
          end

          if account.nil? || !current_tenant_scope.valid_relation?(account: account, contact: contact, opportunity: opportunity)
            return render_relation_conflict(resource: 'Task')
          end
          return render_relation_conflict(resource: 'Task') unless current_tenant_scope.valid_owner?(current_user, account: account)

          task.update!(attrs)
          if (task.status == 'completed' || task.status == 'done') && task.completed_at.blank?
            task.update!(completed_at: Time.current)
          elsif task.status == 'pending' && task.completed_at.present?
            task.update!(completed_at: nil)
          end
          ::Sales::EmailSequences::EnrollmentProcessor.task_completed(task) if task.completed_at.present?
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
          scope = current_tenant_scope
          contact = task.contact
          opportunity = task.opportunity
          if !scope.valid_relation?(account: task.account, contact: contact, opportunity: opportunity)
            contact = nil
            opportunity = nil
          end
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
            sales_opportunity_id: opportunity&.id,
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
