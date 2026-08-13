module Api
  module V1
    class ReviewerSolutionsController < Api::V1::Reviewer::BaseController

      def index
        render json: current_user.reviewer_solutions.where.not(status: 'disabled').order(created_at: :desc)
      end

      def create
        solution = current_user.reviewer_solutions.new(solution_params)
        solution.verified = false
        if solution.save
          ReviewerSolutionEvent.create!(reviewer_solution: solution, actor: current_user, action: 'created', new_status: solution.status)
          render json: solution, status: :created
        else
          render json: { errors: solution.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        solution = current_user.reviewer_solutions.find(params[:id])
        old_status = solution.status
        solution.update!(status: 'disabled')
        ReviewerSolutionEvent.create!(reviewer_solution: solution, actor: current_user, action: 'removed', old_status: old_status, new_status: 'disabled')
        head :no_content
      end

      private


      def solution_params
        params.require(:solution).permit(:name, :solution_type, :category, :company_id)
      end
    end
  end
end
