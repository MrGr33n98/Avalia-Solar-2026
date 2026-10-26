# frozen_string_literal: true

module Sales
  module Reporting
    class NutshellReportQuery
      VALID_GRANULARITIES = %w[day week month quarter year].freeze
      VALID_TYPES = %w[sales forecast new_leads].freeze

      def self.call(user:, report_type: 'sales', granularity: 'month', measure: 'value', from: nil, to: nil, segment_by: 'none', filters: {})
        new(
          user: user,
          report_type: report_type,
          granularity: granularity,
          measure: measure,
          from: from,
          to: to,
          segment_by: segment_by,
          filters: filters
        ).execute
      end

      attr_reader :user, :report_type, :granularity, :measure, :from_date, :to_date, :segment_by, :filters

      def initialize(user:, report_type: 'sales', granularity: 'month', measure: 'value', from: nil, to: nil, segment_by: 'none', filters: {})
        @user = user
        @report_type = VALID_TYPES.include?(report_type.to_s) ? report_type.to_s : 'sales'
        @granularity = VALID_GRANULARITIES.include?(granularity.to_s) ? granularity.to_s : 'month'
        @measure = measure.to_s == 'quantity' ? 'quantity' : 'value'
        @segment_by = segment_by.to_s
        @filters = (filters.presence || {}).to_h.symbolize_keys
        parse_dates(from, to)
      end

      def execute
        scope = base_scope
        records = fetch_grouped_data(scope)
        quota_data = fetch_quota_data
        chart_data = format_chart_data(records, quota_data)
        summary = calculate_summary(scope, records)

        {
          report_type: report_type,
          granularity: granularity,
          measure: measure,
          segment_by: segment_by,
          date_range: {
            from: from_date.to_s,
            to: to_date.to_s
          },
          from: from_date.to_s,
          to: to_date.to_s,
          series: chart_data,
          chart_data: chart_data,
          summary: summary
        }
      end

      private

      def tenant_scope
        @tenant_scope ||= ::Sales::TenantScope.for(user)
      end

      def base_scope
        opps = tenant_scope.opportunities

        scoped = case report_type
        when 'sales'
          opps.where(status: 'won')
              .where('COALESCE(sales_opportunities.won_at, sales_opportunities.updated_at) BETWEEN ? AND ?', from_date.beginning_of_day, to_date.end_of_day)
        when 'forecast'
          opps.open
              .where('COALESCE(sales_opportunities.expected_close_date, (sales_opportunities.created_at + INTERVAL \'30 days\')::date) BETWEEN ? AND ?', from_date, to_date)
        when 'new_leads'
          opps.where('sales_opportunities.created_at BETWEEN ? AND ?', from_date.beginning_of_day, to_date.end_of_day)
        else
          opps.none
        end

        if filters.present?
          report_filters = filters.dup
          report_filters[:all_statuses] = true
          report_filters.delete(:status) if report_type == 'sales' || report_type == 'forecast'
          ::Sales::OpportunitiesQuery.call(report_filters, scoped)
        else
          scoped
        end
      end

      def date_column_sql
        case report_type
        when 'sales'
          "COALESCE(sales_opportunities.won_at, sales_opportunities.updated_at)::timestamp"
        when 'forecast'
          "COALESCE(sales_opportunities.expected_close_date, (sales_opportunities.created_at + INTERVAL '30 days')::date)::timestamp"
        when 'new_leads'
          "sales_opportunities.created_at::timestamp"
        end
      end

      def parse_dates(from, to)
        now = Date.current
        if from.present? && to.present?
          @from_date = Date.parse(from.to_s) rescue now - 1.year
          @to_date = Date.parse(to.to_s) rescue now
        elsif report_type == 'forecast'
          @from_date = now.beginning_of_month
          @to_date = now + 4.months
        else
          @from_date = now - 1.year
          @to_date = now
        end
      end

      def fetch_grouped_data(scope)
        date_expr = "DATE_TRUNC('#{granularity}', #{date_column_sql})"
        
        scope
          .group(Arel.sql(date_expr))
          .order(Arel.sql(date_expr))
          .pluck(
            Arel.sql("#{date_expr}::date"),
            Arel.sql('COALESCE(SUM(sales_opportunities.value_cents), 0)::bigint'),
            Arel.sql('COUNT(sales_opportunities.id)'),
            Arel.sql('COALESCE(AVG(EXTRACT(EPOCH FROM (COALESCE(sales_opportunities.won_at, sales_opportunities.updated_at) - sales_opportunities.created_at)) / 86400.0), 0)::float')
          )
      end

      def fetch_quota_data
        company_id = user.respond_to?(:company_id) ? user.company_id : nil
        quotas = ::Sales::Quota.where('starts_on <= ? AND ends_on >= ?', to_date, from_date)
        quotas = quotas.where(company_id: company_id) if company_id.present?
        return {} if quotas.empty?

        total_target_cents = quotas.sum(:target_revenue_cents)
        return {} if total_target_cents.zero?

        # Mapeia cotas rateadas por período
        { total_target_cents: total_target_cents }
      end

      def format_chart_data(records, quota_data)
        return [] if records.empty?

        quota_target = quota_data[:total_target_cents] ? (quota_data[:total_target_cents] / 100.0) : nil
        avg_quota_per_period = (quota_target && records.size.positive?) ? (quota_target / records.size).round : nil

        records.map do |period_date, total_cents, count, avg_days|
          val = measure == 'quantity' ? count : (total_cents / 100.0).round(2)
          {
            date: period_date.to_s,
            label: format_period_label(period_date),
            value: val,
            amount_cents: total_cents,
            count: count,
            avg_cycle_days: avg_days.round(1),
            quota: avg_quota_per_period
          }
        end
      end

      def format_period_label(date)
        case granularity
        when 'day'
          date.strftime('%d/%m')
        when 'week'
          date.strftime('%b %d, %Y')
        when 'month'
          date.strftime('%b %Y')
        when 'quarter'
          "T#{(date.month - 1) / 3 + 1} #{date.year}"
        when 'year'
          date.year.to_s
        else
          date.to_s
        end
      end

      def calculate_summary(scope, records)
        total_cents = scope.sum(:value_cents) || 0
        total_deals = scope.count

        periods_count = [records.size, 1].max
        avg_per_period_cents = (total_cents.to_f / periods_count).round

        cycles = scope.where.not(created_at: nil).pluck(
          Arel.sql('EXTRACT(EPOCH FROM (COALESCE(sales_opportunities.won_at, sales_opportunities.updated_at) - sales_opportunities.created_at)) / 86400.0')
        ).compact

        avg_time_open_days = cycles.size.positive? ? (cycles.sum.to_f / cycles.size).round(1) : 0.0
        avg_lead_value_cents = total_deals.positive? ? (total_cents / total_deals) : 0

        period_unit_label = case granularity
                            when 'day' then 'per day'
                            when 'week' then 'per week'
                            when 'month' then 'per month'
                            when 'quarter' then 'per quarter'
                            when 'year' then 'per year'
                            end

        {
          total_value: (total_cents / 100.0).round(2),
          total_value_cents: total_cents,
          total_count: total_deals,
          total_deals: total_deals,
          granularity_unit: period_unit_label,
          period_unit_label: period_unit_label,
          avg_per_period_value: (avg_per_period_cents / 100.0).round(2),
          avg_value_per_period_cents: avg_per_period_cents,
          avg_per_period_count: (total_deals.to_f / periods_count).round(1),
          avg_cycle_days: avg_time_open_days,
          avg_time_open_days: avg_time_open_days,
          avg_lead_value: (avg_lead_value_cents / 100.0).round(2),
          avg_lead_value_cents: avg_lead_value_cents
        }
      end
    end
  end
end
