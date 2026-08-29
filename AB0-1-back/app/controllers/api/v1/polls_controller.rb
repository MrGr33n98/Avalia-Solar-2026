module Api
  module V1
    class PollsController < BaseController
      before_action :authenticate_api_user

      def vote
        poll = Poll.find_by(id: params[:id])
        return render json: { error: 'Enquete não encontrada' }, status: :not_found unless poll
        return render json: { error: 'Enquete não está publicada' }, status: :unprocessable_entity unless poll.status == 'published'
        return render json: { error: 'Enquete encerrada' }, status: :unprocessable_entity if poll.ends_at.present? && poll.ends_at <= Time.current

        option = poll.poll_options.find_by(id: params[:poll_option_id])
        return render json: { error: 'Opção inválida' }, status: :unprocessable_entity unless option

        PollVote.transaction do
          poll.lock!
          PollVote.create!(poll: poll, poll_option: option, user: current_user)
        end
        render json: poll_result(poll), status: :created
      rescue ActiveRecord::RecordNotUnique
        render json: { error: 'Usuário já votou nesta enquete' }, status: :unprocessable_entity
      end

      private

      def poll_result(poll)
        total = poll.poll_options.sum(:votes_count)
        vote = poll.poll_votes.find_by(user: current_user)
        { poll_id: poll.id, viewer_option_id: vote&.poll_option_id, total_votes: total,
          options: poll.poll_options.map { |item| { id: item.id, text: item.label, votes_count: item.votes_count, percentage: total.positive? ? (item.votes_count.to_f / total * 100).round(1) : 0 } } }
      end
    end
  end
end
