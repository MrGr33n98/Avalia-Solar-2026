# frozen_string_literal: true

module Sales
  module Reporting
    class WinRateHistoryQuery
      def self.call(user:, from: nil, to: nil, pipeline_id: nil, owner_ids: nil, granularity: 'week')
        new(
          user: user,
          from: from,
          to: to,
          pipeline_id: pipeline_id,
          owner_ids: owner_ids,
          granularity: granularity
        ).execute
      end

      attr_reader :user, :from_date, :to_date, :pipeline_id, :owner_ids, :granularity

      def initialize(user:, from: nil, to: nil, pipeline_id: nil, owner_ids: nil, granularity: 'week')
        @user = user
        @to_date = to.present? ? Date.parse(to.to_s) : Date.current
        @from_date = from.present? ? Date.parse(from.to_s) : 90.days.ago.to_date
        @from_date, @to_date = @to_date, @from_date if @from_date > @to_date
        @pipeline_id = pipeline_id.presence
        @owner_ids = Array(owner_ids).map(&:to_i).reject(&:zero?).presence
        @granularity = %w[day week month].include?(granularity.to_s) ? granularity.to_s : 'week'
      end

      def execute
        from_time = from_date.beginning_of_day
        to_time = to_date.end_of_day

        scoped_opps = base_scope

        # Busca ganhos agrupados por data canônica won_at
        won_records = scoped_opps
                      .where(status: 'won')
                      .where(won_at: from_time..to_time)
                      .group("DATE_TRUNC('#{sql_trunc_interval}', won_at)")
                      .count

        # Busca perdas agrupadas por data canônica lost_at
        lost_records = scoped_opps
                       .where(status: 'lost')
                       .where(lost_at: from_time..to_time)
                       .group("DATE_TRUNC('#{sql_trunc_interval}', lost_at)")
                       .count

        # Gera buckets no intervalo
        series = build_buckets(won_records, lost_records)

        # Sumários globais e deltas em p.p.
        summary = calculate_summary(series, scoped_opps)

        {
          meta: {
            from: from_date.to_s,
            to: to_date.to_s,
            granularity: granularity,
            as_of: Time.current.in_time_zone('America/Sao_Paulo').iso8601
          },
          summary: summary,
          series: series
        }
      end

      private

      def base_scope
        scope = ::Sales::TenantScope.for(user).opportunities
        scope = scope.where(sales_pipeline_id: pipeline_id) if pipeline_id.present?
        scope = scope.where(owner_id: owner_ids) if owner_ids.present?
        scope
      end

      def sql_trunc_interval
        case granularity
        when 'day' then 'day'
        when 'month' then 'month'
        else 'week'
        end
      end

      def build_buckets(won_records, lost_records)
        # Normaliza chaves de datas truncadas
        normalized_won = won_records.transform_keys { |k| Date.parse(k.to_s) rescue nil }.compact
        normalized_lost = lost_records.transform_keys { |k| Date.parse(k.to_s) rescue nil }.compact

        bucket_dates = case granularity
                       when 'day'
                         (from_date..to_date).to_a
                       when 'month'
                         (from_date..to_date).map(&:beginning_of_month).uniq
                       else
                         (from_date..to_date).map(&:beginning_of_week).uniq
                       end

        bucket_dates.map do |b_date|
          won_c = normalized_won[b_date] || 0
          lost_c = normalized_lost[b_date] || 0
          closed_c = won_c + lost_c

          win_rate = if closed_c.positive?
                       ((won_c.to_f / closed_c) * 100).round(1)
                     else
                       nil # null canônico quando não há denominador (não 0%)
                     end

          {
            date: b_date.to_s,
            won_count: won_c,
            lost_count: lost_c,
            cancelled_count: 0,
            closed_count: closed_c,
            win_rate_pct: win_rate
          }
        end
      end

      def calculate_summary(series, scoped_opps)
        total_won = series.sum { |s| s[:won_count] }
        total_lost = series.sum { |s| s[:lost_count] }
        total_closed = total_won + total_lost

        overall_win_rate = if total_closed.positive?
                             ((total_won.to_f / total_closed) * 100).round(1)
                           else
                             nil
                           end

        # Comparação com o período anterior
        duration_days = (to_date - from_date).to_i + 1
        prev_to = from_date - 1.day
        prev_from = prev_to - duration_days.days + 1.day

        prev_won = scoped_opps.where(status: 'won', won_at: prev_from.beginning_of_day..prev_to.end_of_day).count
        prev_lost = scoped_opps.where(status: 'lost', lost_at: prev_from.beginning_of_day..prev_to.end_of_day).count
        prev_closed = prev_won + prev_lost

        delta_pp = nil
        if prev_closed.positive? && overall_win_rate.present?
          prev_rate = (prev_won.to_f / prev_closed) * 100
          delta_pp = (overall_win_rate - prev_rate).round(1)
        end

        {
          won_count: total_won,
          lost_count: total_lost,
          closed_count: total_closed,
          win_rate_pct: overall_win_rate,
          win_rate_delta_pp: delta_pp
        }
      end
    end
  end
end
