module Api
  module V1
    class ReviewerSolutionsController < Api::V1::Reviewer::BaseController
      def index
        solutions = current_user.reviewer_solutions
                                 .where.not(status: 'disabled')
                                 .includes(:brand, :product)
                                 .order(created_at: :desc)
        render json: solutions
      end

      def create
        existing = current_user.reviewer_solutions.find_by(name: solution_params[:name])
        if existing && existing.status == 'disabled'
          existing.assign_attributes(solution_params)
          existing.status = 'active'
          existing.verified = false
          if existing.save
            ReviewerSolutionEvent.create!(
              reviewer_solution: existing,
              actor: current_user,
              action: 'reactivated',
              old_status: 'disabled',
              new_status: 'active'
            )
            render json: existing, status: :ok
            return
          else
            render json: { errors: existing.errors.full_messages }, status: :unprocessable_entity
            return
          end
        end

        solution = current_user.reviewer_solutions.new(solution_params)
        solution.verified = false
        if solution.save
          ReviewerSolutionEvent.create!(
            reviewer_solution: solution,
            actor: current_user,
            action: 'created',
            new_status: solution.status
          )
          render json: solution, status: :created
        else
          render json: { errors: solution.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        solution = current_user.reviewer_solutions.find(params[:id])
        old_status = solution.status
        solution.update!(status: 'disabled')
        ReviewerSolutionEvent.create!(
          reviewer_solution: solution,
          actor: current_user,
          action: 'removed',
          old_status: old_status,
          new_status: 'disabled'
        )
        head :no_content
      end

      private

      def solution_params
        params.require(:solution).permit(
          :name,
          :solution_type,
          :category,
          :company_id,
          :brand_id,
          :product_id,
          :usage_context
        )
      end
    end
  end
end
