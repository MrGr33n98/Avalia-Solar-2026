module Api
  module V1
    class CompanySectorQuestionsController < BaseController
      before_action :authenticate_api_user
      before_action :set_company
      before_action :ensure_can_manage_sector_questions!
      before_action :ensure_sector_ratings_enabled!
      before_action :set_question, only: %i[update destroy]

      def index
        questions = @company.company_sector_questions.order(:order, :created_at)

        render json: {
          questions: questions.as_json(only: %i[id prompt weight order enabled]),
          meta: meta_payload(questions.count)
        }
      end

      def create
        next_count = @company.company_sector_questions.count + 1
        return plan_required! if @company.requires_paid_plan_for_sector_question?(new_count: next_count)
        return limit_reached! if @company.sector_question_limit_reached?(new_count: next_count)

        question = @company.company_sector_questions.new(question_params)
        if question.save
          render json: { question: question.as_json(only: %i[id prompt weight order enabled]), meta: meta_payload }, status: :created
        else
          render json: { errors: question.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @question.update(question_params)
          render json: { question: @question.as_json(only: %i[id prompt weight order enabled]), meta: meta_payload }
        else
          render json: { errors: @question.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @question.destroy
        render json: { meta: meta_payload(@company.company_sector_questions.count) }
      end

      private

      def set_company
        requested_id = params[:company_id] || cookies.signed[:active_company_id]

        @company =
          if current_user&.admin?
            requested_id.present? ? ::Company.find_by(id: requested_id) : ::Company.first
          else
            scope = current_user&.active_member_companies || ::Company.none
            if requested_id.present?
              scope.find_by(id: requested_id) ||
                (current_user&.company_id == requested_id.to_i ? current_user&.company : nil) ||
                current_user&.company
            else
              current_user&.company || scope.first
            end
          end

        return if @company

        render_error_response(
          message: 'Empresa não encontrada ou não autorizada',
          status: :forbidden,
          code: 'COMPANY_NOT_FOUND'
        )
      end

      def ensure_can_manage_sector_questions!
        return if current_user&.admin?
        return if @company.can_manage_sector_questions?

        render_error_response(
          message: 'Gerenciamento de perguntas setoriais indisponivel para esta empresa.',
          status: :forbidden,
          code: 'SECTOR_QUESTIONS_NOT_ALLOWED'
        )
      end

      def ensure_sector_ratings_enabled!
        return if @company.sector_ratings_enabled?

        render_error_response(
          message: 'Perguntas setoriais desabilitadas para esta empresa',
          status: :forbidden,
          code: 'SECTOR_RATINGS_DISABLED'
        )
      end

      def set_question
        @question = @company.company_sector_questions.find(params[:id])
      end

      def question_params
        params.require(:company_sector_question).permit(:prompt, :weight, :order, :enabled)
      end

      def plan_required!
        render_error_response(
          message: 'Limite gratuito atingido. Contrate um plano para adicionar mais perguntas.',
          status: :forbidden,
          code: 'PLAN_REQUIRED',
          details: { limit: @company.sector_question_limit }
        )
      end

      def limit_reached!
        render_error_response(
          message: 'Limite de perguntas para o plano atual foi atingido.',
          status: :forbidden,
          code: 'SECTOR_QUESTION_LIMIT_REACHED',
          details: { limit: @company.sector_question_limit }
        )
      end

      def meta_payload(count = @company.company_sector_questions.count)
        {
          sector_ratings_enabled: @company.sector_ratings_enabled?,
          limit: @company.sector_question_limit,
          free_limit: ::Company::SECTOR_QUESTIONS_FREE_LIMIT,
          total: count,
          remaining: [@company.sector_question_limit - count, 0].max,
          paid_required: @company.requires_paid_plan_for_sector_question?(new_count: count + 1),
          limit_reached: @company.sector_question_limit_reached?(new_count: count + 1)
        }
      end
    end
  end
end
