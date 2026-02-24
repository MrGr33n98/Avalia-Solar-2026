module Api
  module V1
    class SectorRatingsController < BaseController
      before_action :authenticate_user!
      before_action :set_company
      before_action :ensure_reviewer_or_member!
      before_action :ensure_sector_ratings_enabled!

      def create
        rating = @company.sector_ratings.find_or_initialize_by(user: current_user)
        if rating.persisted?
          render json: { error: 'Você já avaliou esta empresa.' }, status: :conflict
          return
        end

        payload = rating_params
        custom_answers = extract_custom_answers

        rating.assign_attributes(
          status: :published,
          comment: payload[:comment],
          **payload.except(:comment)
        )
        rating.answers = custom_answers if custom_answers.present?

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

      def questions
        render json: @company.company_sector_questions.active.map(&:to_api_payload)
      end

      private

      def set_company
        @company = Company.find(params[:company_id])
      end

      def ensure_reviewer_or_member!
        return if current_user.admin?
        return if current_user.review_user?
        return if current_user.company_members.active.exists?(company_id: @company.id)

        render json: { error: 'Usuário não autorizado para avaliar esta empresa' }, status: :forbidden
      end

      def ensure_sector_ratings_enabled!
        return if @company.sector_ratings_enabled?

        render json: { error: 'Avaliações setoriais não estão habilitadas para esta empresa' }, status: :forbidden
      end

      def rating_params
        params.require(:sector_rating).permit(:homologation, :technical_quality, :safety, :consultancy, :comment)
      end

      def extract_custom_answers
        active_questions = @company.company_sector_questions.active
        return {} if active_questions.blank?

        sr_params = params.require(:sector_rating)
        answers_param = sr_params[:answers]

        if answers_param.is_a?(ActionController::Parameters) || answers_param.is_a?(Hash)
          return answers_param.to_unsafe_h.transform_keys(&:to_i).transform_values(&:to_i)
        end

        custom_keys = active_questions.map { |q| "question_#{q.id}" }
        permitted = sr_params.permit(custom_keys)
        permitted.to_h.each_with_object({}) do |(key, value), memo|
          qid = key.to_s.sub('question_', '').to_i
          next if qid.zero?
          memo[qid] = value.to_i
        end
      end

      def rating_response(rating)
        base_payload = {
          id: rating.id,
          total_score: rating.average_score,
          status: rating.status,
          created_at: rating.created_at
        }

        if rating.answers.present?
          base_payload[:answers] = rating.answers
        else
          base_payload[:answers] = {
            homologation: rating.homologation,
            technical_quality: rating.technical_quality,
            safety: rating.safety,
            consultancy: rating.consultancy
          }
        end

        base_payload
      end

      def question_averages(scope)
        memo = SectorRating::WEIGHTS.keys.each_with_object({}) do |question, acc|
          acc[question] = scope.average(question).to_f.round(2)
        end

        json_totals = Hash.new { |h, k| h[k] = { sum: 0.0, count: 0 } }
        scope.find_each do |rating|
          next unless rating.answers.present?
          rating.answers.each do |qid, value|
            numeric_value = value.to_f
            json_totals[qid][:sum] += numeric_value
            json_totals[qid][:count] += 1
          end
        end

        json_totals.each do |qid, data|
          memo["question_#{qid}"] = data[:count].positive? ? (data[:sum] / data[:count]).round(2) : 0
        end

        memo
      end
    end
  end
end
