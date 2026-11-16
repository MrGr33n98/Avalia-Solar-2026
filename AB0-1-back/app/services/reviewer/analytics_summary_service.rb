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
      scoped = publication_views.where(created_at: start_date.beginning_of_day..end_date.end_of_day)
      connection = ActiveRecord::Base.connection

      if connection.adapter_name.downcase.include?('postgres')
        # Rails stores UTC timestamps without a time-zone offset in PostgreSQL.
        # Convert them to the Rails display zone before grouping by calendar day.
        # DATE(created_at) alone misattributes late-evening Brasília views to tomorrow.
        zone = connection.quote(Time.zone.tzinfo.identifier)
        local_day = "DATE((reviewer_publication_events.created_at AT TIME ZONE 'UTC') AT TIME ZONE #{zone})"
        scoped.group(Arel.sql(local_day)).count.transform_keys(&:to_date)
      else
        # Portable fallback for development/test databases such as SQLite.
        scoped.pluck(:created_at).group_by { |timestamp| timestamp.in_time_zone.to_date }
              .transform_values(&:size)
      end
    end
  end
end
