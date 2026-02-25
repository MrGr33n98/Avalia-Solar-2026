module Api
  module V1
    class SectorRatingsController < BaseController
      before_action :authenticate_api_user
      before_action :set_company
      before_action :ensure_reviewer_or_member!
      before_action :ensure_sector_ratings_enabled!

      def create
        rating = @company.sector_ratings.find_or_initialize_by(user: current_user)
        if rating.persisted?
          render json: { error: 'Voce ja avaliou esta empresa.' }, status: :conflict
          return
        end

        payload = rating_params.to_h.symbolize_keys
        custom_answers = extract_custom_answers

        rating.assign_attributes(
          status: :published,
          comment: payload[:comment],
          **payload.except(:comment)
        )

        if custom_answers.present?
          apply_legacy_scores_for_custom_answers!(rating, payload, custom_answers)
          rating.answers = custom_answers
        end

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
        @company = ::Company.find(params[:company_id] || params[:id])
      end

      def ensure_reviewer_or_member!
        return if current_user.admin?
        return if current_user.review_user?
        return if current_user.company_id == @company.id
        return if current_user.company_members.active.exists?(company_id: @company.id)

        render json: { error: 'Usuario nao autorizado para avaliar esta empresa' }, status: :forbidden
      end

      def ensure_sector_ratings_enabled!
        return if @company.sector_ratings_enabled?

        render json: { error: 'Avaliacoes setoriais nao estao habilitadas para esta empresa' }, status: :forbidden
      end

      def rating_params
        params.require(:sector_rating).permit(:homologation, :technical_quality, :safety, :consultancy, :comment)
      end

      def extract_custom_answers
        active_questions = @company.company_sector_questions.active
        return {} if active_questions.blank?

        sr_params = params.require(:sector_rating)
        answers_param = sr_params[:answers]

        if answers_param.respond_to?(:to_unsafe_h)
          return answers_param.to_unsafe_h.each_with_object({}) do |(qid, value), memo|
            question_id = qid.to_i
            next if question_id.zero?

            memo[question_id] = value.to_i
          end
        elsif answers_param.is_a?(Hash)
          return answers_param.each_with_object({}) do |(qid, value), memo|
            question_id = qid.to_i
            next if question_id.zero?

            memo[question_id] = value.to_i
          end
        end

        custom_keys = active_questions.map { |q| "question_#{q.id}" }
        permitted = sr_params.permit(custom_keys)
        permitted.to_h.each_with_object({}) do |(key, value), memo|
          qid = key.to_s.sub('question_', '').to_i
          next if qid.zero?

          memo[qid] = value.to_i
        end
      end

      def apply_legacy_scores_for_custom_answers!(rating, payload, custom_answers)
        valid_custom_scores = custom_answers.values.map(&:to_i).select { |score| score.between?(1, 5) }
        fallback_score = if valid_custom_scores.empty?
                           3
                         else
                           (valid_custom_scores.sum.to_f / valid_custom_scores.size).round.clamp(1, 5)
                         end

        SectorRating::WEIGHTS.each_key do |attribute|
          provided_score = payload[attribute].to_i
          score = provided_score.between?(1, 5) ? provided_score : fallback_score
          rating.public_send("#{attribute}=", score)
        end
      end

      def rating_response(rating)
        base_payload = {
          id: rating.id,
          total_score: rating.average_score,
          status: rating.status,
          created_at: rating.created_at
        }

        base_payload[:answers] = if rating.answers.present?
                                   rating.answers
                                 else
                                   {
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
