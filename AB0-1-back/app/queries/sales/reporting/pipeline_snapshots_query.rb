# frozen_string_literal: true

module Sales
  module Reporting
    class PipelineSnapshotsQuery
      def self.call(user:, from: nil, to: nil, pipeline_id: nil, owner_ids: nil, granularity: 'day')
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

      def initialize(user:, from: nil, to: nil, pipeline_id: nil, owner_ids: nil, granularity: 'day')
        @user = user
        @to_date = to.present? ? Date.parse(to.to_s) : Date.current
        @from_date = from.present? ? Date.parse(from.to_s) : 90.days.ago.to_date
        @from_date, @to_date = @to_date, @from_date if @from_date > @to_date
        @pipeline_id = pipeline_id.presence
        @owner_ids = Array(owner_ids).map(&:to_i).reject(&:zero?).presence
        @granularity = %w[day week month].include?(granularity.to_s) ? granularity.to_s : 'day'
      end

      def execute
        scope = base_scope
        earliest_snapshot_date = scope.minimum(:snapshot_date)

        # Agrupa dados por data no intervalo selecionado
        records = scope.where(snapshot_date: from_date..to_date)
                       .group(:snapshot_date)
                       .pluck(
                         :snapshot_date,
                         Arel.sql('SUM(open_count)'),
                         Arel.sql('SUM(open_value_cents)')
                       )

        data_by_date = records.each_with_object({}) do |(date, count, value_cents), h|
          h[date] = { count: count.to_i, value_cents: value_cents.to_i }
        end

        # Gera série contínua com tratamento canônico de ausência de snapshot (nil vs 0)
        series = build_series(data_by_date, earliest_snapshot_date)

        # Calcula sumários e deltas em relação ao período anterior
        summary = calculate_summary(series, scope)

        coverage = if earliest_snapshot_date.nil?
                     'none'
                   elsif earliest_snapshot_date > from_date
                     'partial'
                   else
                     'full'
                   end

        {
          meta: {
            from: from_date.to_s,
            to: to_date.to_s,
            granularity: granularity,
            coverage: coverage,
            historical_coverage_from: earliest_snapshot_date&.to_s,
            as_of: Time.current.in_time_zone('America/Sao_Paulo').iso8601
          },
          summary: summary,
          series: series
        }
      end

      private

      def base_scope
        scope = ::Sales::PipelineDailySnapshot.all

        # Tenant isolation
        if user&.admin?
          # Administradores globais podem ver todos ou filtrar
        elsif user&.company_id.present?
          scope = scope.where(company_id: user.company_id)
        else
          scope = scope.where(owner_id: user.id)
        end

        scope = scope.where(sales_pipeline_id: pipeline_id) if pipeline_id.present?
        scope = scope.where(owner_id: owner_ids) if owner_ids.present?
        scope
      end

      def build_series(data_by_date, earliest_date)
        dates = (from_date..to_date).to_a

        if granularity == 'week'
          dates = dates.group_by(&:beginning_of_week).map { |_w, ds| ds.last }
        elsif granularity == 'month'
          dates = dates.group_by(&:beginning_of_month).map { |_m, ds| ds.last }
        end

        dates.map do |date|
          # Se o dia é anterior ao primeiro snapshot capturado ou não tem entrada registrada
          if earliest_date.nil? || date < earliest_date || !data_by_date.key?(date)
            # Verifica se é hoje e podemos fornecer um dado live como fallback rotulado
            if date == Date.current && live_fallback_available?
              live_data = live_current_pipeline
              {
                date: date.to_s,
                open_count: live_data[:count],
                open_value_cents: live_data[:value_cents],
                has_snapshot: true,
                is_live_estimated: true
              }
            else
              {
                date: date.to_s,
                open_count: nil,
                open_value_cents: nil,
                has_snapshot: false
              }
            end
          else
            item = data_by_date[date]
            {
              date: date.to_s,
              open_count: item[:count],
              open_value_cents: item[:value_cents],
              has_snapshot: true
            }
          end
        end
      end

      def calculate_summary(series, scope)
        valid_points = series.select { |s| s[:has_snapshot] && !s[:open_count].nil? }

        if valid_points.empty?
          return {
            avg_open_count: nil,
            avg_open_value_cents: nil,
            delta_open_count_pct: nil,
            delta_open_value_pct: nil,
            valid_snapshots_count: 0
          }
        end

        avg_count = (valid_points.sum { |s| s[:open_count] }.to_f / valid_points.size).round
        avg_value = (valid_points.sum { |s| s[:open_value_cents] }.to_f / valid_points.size).round

        # Comparação com período anterior de mesma duração
        duration_days = (to_date - from_date).to_i + 1
        prev_to = from_date - 1.day
        prev_from = prev_to - duration_days.days + 1.day

        prev_records = scope.where(snapshot_date: prev_from..prev_to).group(:snapshot_date).pluck(
          Arel.sql('SUM(open_count)'),
          Arel.sql('SUM(open_value_cents)')
        )

        delta_count_pct = nil
        delta_value_pct = nil

        if prev_records.any?
          prev_avg_count = prev_records.sum { |r| r[0].to_i }.to_f / prev_records.size
          prev_avg_value = prev_records.sum { |r| r[1].to_i }.to_f / prev_records.size

          if prev_avg_count.positive?
            delta_count_pct = (((avg_count - prev_avg_count) / prev_avg_count) * 100).round(1)
          end

          if prev_avg_value.positive?
            delta_value_pct = (((avg_value - prev_avg_value) / prev_avg_value) * 100).round(1)
          end
        end

        {
          avg_open_count: avg_count,
          avg_open_value_cents: avg_value,
          delta_open_count_pct: delta_count_pct,
          delta_open_value_pct: delta_value_pct,
          valid_snapshots_count: valid_points.size
        }
      end

      def live_fallback_available?
        true
      end

      def live_current_pipeline
        opps = ::Sales::TenantScope.for(user).opportunities.open
        opps = opps.where(sales_pipeline_id: pipeline_id) if pipeline_id.present?
        opps = opps.where(owner_id: owner_ids) if owner_ids.present?

        {
          count: opps.count,
          value_cents: opps.sum(:value_cents) || 0
        }
      end
    end
  end
end
