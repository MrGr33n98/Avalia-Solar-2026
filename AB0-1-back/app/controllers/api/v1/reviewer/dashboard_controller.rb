# frozen_string_literal: true

module Api
  module V1
    module Reviewer
      class DashboardController < Api::V1::Reviewer::BaseController

        def show
          render json: ::Reviewer::DashboardService.new(user: current_user).call
        end

        def analytics
          profile = current_user.reviewer_profile
          unless profile
            return render json: { error: 'Perfil de criador não encontrado' }, status: :not_found
          end

          pub_views = ReviewerPublicationEvent.where(reviewer_publication_id: current_user.reviewer_publication_ids, event_name: 'publication_view').count
          tree_views = profile.tree_views_count
          total_views = pub_views + tree_views

          followers_count = SocialFollow.where(followable: profile).count
          total_clicks = profile.creator_tree_blocks.sum(:clicks_count)

          daily_views = []
          (0..6).reverse_each do |i|
            date = i.days.ago.to_date
            p_count = ReviewerPublicationEvent.where(reviewer_publication_id: current_user.reviewer_publication_ids, event_name: 'publication_view')
                                             .where('created_at >= ? AND created_at <= ?', date.beginning_of_day, date.end_of_day)
                                             .count
            daily_views << {
              date: date.strftime('%d/%m'),
              views: p_count
            }
          end

          render json: {
            views: total_views,
            followers: followers_count,
            clicks: total_clicks,
            daily_views: daily_views
          }
        end

        private

      end
    end
  end
end
