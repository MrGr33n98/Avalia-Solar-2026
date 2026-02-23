module Api
  module V1
    class SectorRatingsController < BaseController
      before_action :authenticate_user!
      before_action :set_company
      before_action :ensure_member!

      def create
        rating = @company.sector_ratings.find_or_initialize_by(user: current_user)
        if rating.persisted?
          render json: { error: 'Você já avaliou esta empresa.' }, status: :conflict
          return
        end

        rating.assign_attributes(rating_params.merge(status: :published))
        if rating.save
          render json: rating_response(rating), status: :created
        else
          render json: { errors: rating.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def summary
        summary = @company.sector_ratings.published
        render json: {
          average: summary.average(:total_score).to_f.round(2),
          count: summary.count,
          by_question: question_averages(summary)
        }
      end

      private

      def set_company
        @company = Company.find(params[:company_id])
      end

      def ensure_member!
        allowed_company_ids = current_user.company_members.active.pluck(:company_id)
        return if allowed_company_ids.include?(@company.id)

        render json: { error: 'Usuário não autorizado para avaliar esta empresa' }, status: :forbidden
      end

      def rating_params
        params.require(:sector_rating).permit(:homologation, :technical_quality, :safety, :consultancy, :comment)
      end

      def rating_response(rating)
        {
          id: rating.id,
          total_score: rating.average_score,
          status: rating.status,
          created_at: rating.created_at,
          answers: {
            homologation: rating.homologation,
            technical_quality: rating.technical_quality,
            safety: rating.safety,
            consultancy: rating.consultancy
          }
        }
      end

      def question_averages(scope)
        SectorRating::WEIGHTS.keys.each_with_object({}) do |question, memo|
          memo[question] = scope.average(question).to_f.round(2)
        end
      end
    end
  end
end
