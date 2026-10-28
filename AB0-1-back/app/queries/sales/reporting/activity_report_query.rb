# frozen_string_literal: true

module Sales
  module Reporting
    class ActivityReportQuery
      VALID_GRANULARITIES = %w[day week month quarter year].freeze
      VALID_SEGMENTS = %w[type actor status].freeze

      def self.call(**args)
        new(**args).execute
      end

      attr_reader :user, :from_date, :to_date, :granularity, :types, :actor_ids,
                  :log_statuses, :include_emails, :include_notes, :segment_by

      def initialize(user:, from: nil, to: nil, granularity: 'day', types: [], actor_ids: [],
                     log_statuses: [], include_emails: false, include_notes: false, segment_by: 'type')
        @user = user
        @granularity = VALID_GRANULARITIES.include?(granularity.to_s) ? granularity.to_s : 'day'
        @segment_by = VALID_SEGMENTS.include?(segment_by.to_s) ? segment_by.to_s : 'type'
        @types = Array(types).map(&:to_s).reject(&:blank?)
        @actor_ids = Array(actor_ids).map(&:to_i).reject(&:zero?)
        @log_statuses = Array(log_statuses).map(&:to_s).reject(&:blank?)
        @include_emails = ActiveModel::Type::Boolean.new.cast(include_emails)
        @include_notes = ActiveModel::Type::Boolean.new.cast(include_notes)
        parse_dates(from, to)
      end

      def execute
        acts = fetch_activities
        kpis = calculate_kpis(acts)
        series = build_time_series(acts)
        reps = build_actor_breakdown(acts)
        types_breakdown = build_type_breakdown(acts)
        recent = build_recent_activities(acts)

        {
          period: {
            from: from_date.to_s,
            to: to_date.to_s,
            granularity: granularity
          },
          kpis: kpis,
          series: series,
          by_actor: reps,
          by_type: types_breakdown,
          recent_activities: recent,
          meta: {
            filters: {
              types: types,
              actor_ids: actor_ids,
              log_statuses: log_statuses,
              include_emails: include_emails,
              include_notes: include_notes,
              segment_by: segment_by
            }
          }
        }
      end

      private

      def parse_dates(from, to)
        now = Time.current
        @from_date = begin
          from.present? ? Time.zone.parse(from.to_s).beginning_of_day : 30.days.ago.beginning_of_day
        rescue StandardError
          30.days.ago.beginning_of_day
        end

        @to_date = begin
          to.present? ? Time.zone.parse(to.to_s).end_of_day : now.end_of_day
        rescue StandardError
          now.end_of_day
        end
      end

      def tenant_scope
        @tenant_scope ||= ::Sales::TenantScope.for(user)
      end

      def fetch_activities
        scope = tenant_scope.activities.includes(:actor, :account, :contact, :opportunity)
                            .where(occurred_at: from_date..to_date)

        scope = scope.where(activity_type: types) if types.any?
        scope = scope.where(actor_id: actor_ids) if actor_ids.any?

        if log_statuses.any? && scope.column_names.include?('log_status')
          scope = scope.where(log_status: log_statuses)
        end

        scope.order(occurred_at: :desc)
      end

      def calculate_kpis(activities)
        total = activities.size
        ai_count = activities.count { |a| a.metadata.is_a?(Hash) && a.metadata['ai_summary'].present? }
        note_count = activities.count { |a| a.body.present? }

        durations = activities.filter_map do |a|
          if a.respond_to?(:duration_seconds) && a.duration_seconds.to_i.positive?
            a.duration_seconds.to_i
          elsif a.metadata.is_a?(Hash) && a.metadata['duration_seconds'].to_i.positive?
            a.metadata['duration_seconds'].to_i
          end
        end

        has_duration = durations.any?
        avg_seconds = has_duration ? (durations.sum.to_f / durations.size).round : nil
        total_hours = has_duration ? (durations.sum / 3600.0).round(1) : nil

        days_count = [((to_date - from_date) / 1.day).round, 1].max
        weeks_count = [days_count / 7.0, 1.0].max
        avg_week = total.positive? ? (total / weeks_count).round(1) : 0.0

        {
          total_activities: total,
          ai_summarized: ai_count,
          with_notes: note_count,
          avg_duration_seconds: avg_seconds,
          total_duration_hours: total_hours,
          avg_per_week: avg_week,
          has_real_duration: has_duration
        }
      end

      def build_time_series(activities)
        date_format = case granularity
                      when 'day' then '%Y-%m-%d'
                      when 'week' then '%Y-W%W'
                      when 'month' then '%Y-%m'
                      when 'quarter' then '%Y-Q'
                      when 'year' then '%Y'
                      end

        # Cria os buckets de data
        buckets = {}
        cur = from_date.to_date
        end_d = to_date.to_date

        step = case granularity
               when 'day' then 1.day
               when 'week' then 1.week
               when 'month' then 1.month
               when 'quarter' then 3.months
               when 'year' then 1.year
               end

        while cur <= end_d
          key = cur.strftime(date_format)
          buckets[key] ||= { date: key, total: 0 }
          cur += step
        end

        # Agrupa atividades
        activities.each do |act|
          d = act.occurred_at.to_date
          key = d.strftime(date_format)
          next unless buckets[key]

          buckets[key][:total] += 1

          seg_key = case segment_by
                    when 'type' then act.activity_type.presence || 'other'
                    when 'actor' then act.actor&.name.presence || 'user'
                    when 'status'
                      act.respond_to?(:log_status) ? act.log_status.presence || 'completed' : 'completed'
                    else 'total'
                    end

          buckets[key][seg_key] = (buckets[key][seg_key] || 0) + 1
        end

        buckets.values
      end

      def build_actor_breakdown(activities)
        actors_map = {}

        activities.each do |act|
          actor = act.actor
          next unless actor

          actors_map[actor.id] ||= {
            id: actor.id,
            name: actor.name.presence || actor.email,
            email: actor.email,
            total_activities: 0,
            calls: 0,
            meetings: 0,
            emails: 0,
            notes: 0,
            tasks: 0,
            total_duration_seconds: 0
          }

          item = actors_map[actor.id]
          item[:total_activities] += 1

          case act.activity_type
          when 'call' then item[:calls] += 1
          when 'meeting', 'virtual_meeting' then item[:meetings] += 1
          when 'email' then item[:emails] += 1
          when 'note' then item[:notes] += 1
          when 'task' then item[:tasks] += 1
          end

          dur = if act.respond_to?(:duration_seconds) && act.duration_seconds.to_i.positive?
                  act.duration_seconds.to_i
                elsif act.metadata.is_a?(Hash) && act.metadata['duration_seconds'].to_i.positive?
                  act.metadata['duration_seconds'].to_i
                else
                  0
                end
          item[:total_duration_seconds] += dur
        end

        actors_map.values.sort_by { |a| -a[:total_activities] }
      end

      def build_type_breakdown(activities)
        total = activities.size
        return [] if total.zero?

        counts = activities.group_by(&:activity_type).transform_values(&:size)
        colors = {
          'call' => '#f59e0b',
          'meeting' => '#8b5cf6',
          'virtual_meeting' => '#6366f1',
          'visit' => '#10b981',
          'note' => '#64748b',
          'email' => '#3b82f6',
          'whatsapp' => '#059669',
          'task' => '#ec4899',
          'voicemail' => '#f97316'
        }

        labels = {
          'call' => 'Ligações',
          'meeting' => 'Reuniões Presenciais',
          'virtual_meeting' => 'Reuniões Virtuais',
          'visit' => 'Vistorias Técnicas',
          'note' => 'Notas Comerciais',
          'email' => 'E-mails',
          'whatsapp' => 'WhatsApp B2B',
          'task' => 'Tarefas Concluídas',
          'voicemail' => 'Recados de Voz'
        }

        counts.map do |type, count|
          {
            type: type,
            name: labels[type] || type.titleize,
            count: count,
            percentage: ((count.to_f / total) * 100).round(1),
            color: colors[type] || '#94a3b8'
          }
        end.sort_by { |t| -t[:count] }
      end

      def build_recent_activities(activities)
        activities.first(30).map do |act|
          {
            id: act.id,
            activity_type: act.activity_type,
            direction: act.direction,
            subject: act.subject.presence || "(Sem assunto)",
            occurred_at: act.occurred_at.iso8601,
            actor: act.actor ? { id: act.actor.id, name: act.actor.name.presence || act.actor.email } : nil,
            account: act.account ? { id: act.account.id, name: act.account.name } : nil,
            contact: act.contact ? { id: act.contact.id, name: act.contact.name } : nil,
            opportunity: act.opportunity ? { id: act.opportunity.id, name: act.opportunity.name } : nil,
            duration_seconds: act.respond_to?(:duration_seconds) ? act.duration_seconds : nil,
            log_status: act.respond_to?(:log_status) ? act.log_status : 'completed'
          }
        end
      end
    end
  end
end
