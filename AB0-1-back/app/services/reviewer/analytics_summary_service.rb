# frozen_string_literal: true

module Reviewer
  class AnalyticsSummaryService
    DAYS = 7

    def initialize(user:, profile:)
      @user = user
      @profile = profile
    end

    def call
      publication_views = publication_views_scope
      publication_events = publication_events_scope

      {
        views: publication_views.count + @profile.tree_views_count,
        followers: SocialFollow.where(followable: @profile).count,
        clicks: @profile.creator_tree_blocks.sum(:clicks_count),
        daily_views: daily_views(publication_views),
        publications: @user.reviewer_publications.published.count,
        publication_views: publication_views.count,
        publication_reactions: publication_reactions_count,
        publication_comments: publication_events.where(event_name: 'publication_comment').count,
        publication_shares: publication_events.where(event_name: 'publication_share').count,
        tree_views: @profile.tree_views_count,
        tree_clicks: @profile.creator_tree_blocks.sum(:clicks_count),
        whatsapp_clicks: whatsapp_clicks_count,
        leads: publication_events.where(event_name: 'publication_lead').count
      }
    end

    private

    def publication_views_scope
      ReviewerPublicationEvent.where(
        reviewer_publication_id: @user.reviewer_publications.select(:id),
        event_name: 'publication_view'
      )
    end

    def publication_events_scope
      ReviewerPublicationEvent.where(
        reviewer_publication_id: @user.reviewer_publications.select(:id)
      )
    end

    def publication_reactions_count
      ReviewerPublicationLike.where(
        reviewer_publication_id: @user.reviewer_publications.select(:id)
      ).count
    end

    def whatsapp_clicks_count
      return 0 unless ActiveRecord::Base.connection.table_exists?('analytics_events')

      AnalyticsEvent.where(user_id: @user.id, event_type: 'whatsapp_click').count
    end

    def daily_views(publication_views)
      end_date = Time.zone.today
      start_date = end_date - (DAYS - 1).days
      counts = grouped_daily_counts(publication_views, start_date, end_date)

      (start_date..end_date).map do |date|
        {
          date: date.strftime('%d/%m'),
          views: counts.fetch(date, 0)
        }
      end
    end

    def grouped_daily_counts(publication_views, start_date, end_date)
      publication_views
        .where(created_at: start_date.beginning_of_day..end_date.end_of_day)
        .group(Arel.sql('DATE(reviewer_publication_events.created_at)'))
        .count
        .transform_keys(&:to_date)
    end
  end
end
