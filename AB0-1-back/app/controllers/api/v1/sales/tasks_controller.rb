module Api
  module V1
    module Sales
      class TasksController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        def index
          tasks = ::Sales::Task.where(owner: current_user).order(due_at: :asc).limit(100)
          render json: { tasks: tasks }
        end

        def create
          task = ::Sales::Task.new(task_params.merge(owner: current_user))
          task.save!
          render json: { task: task }, status: :created
        end

        def update
          task = ::Sales::Task.where(owner: current_user).find(params[:id])
          task.update!(task_params)
          task.update!(completed_at: Time.current) if task.status == 'completed' && task.completed_at.blank?
          render json: { task: task }
        end

        private

        def require_internal_sales
          return if current_user&.admin?
          render_error_response(message: 'CRM interno requer autorização de vendas.', status: :forbidden, code: 'SALES_FORBIDDEN')
        end

        def task_params
          params.require(:task).permit(:sales_account_id, :sales_opportunity_id, :sales_contact_id, :task_type, :title,
                                       :description, :status, :priority, :due_at)
        end
      end
    end
  end
end
