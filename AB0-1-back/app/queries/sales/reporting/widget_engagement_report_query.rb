# frozen_string_literal: true

module Sales
  module Reporting
    class WidgetEngagementReportQuery
      VALID_GRANULARITIES = %w[day week month].freeze

      def self.call(**args)
        new(**args).execute
      end

      attr_reader :user, :from_date, :to_date, :granularity

      def initialize(user:, from: nil, to: nil, granularity: 'day')
        @user = user
        @granularity = VALID_GRANULARITIES.include?(granularity.to_s) ? granularity.to_s : 'day'
        parse_dates(from, to)
      end

      def execute
        funnel = calculate_funnel
        series = build_time_series

        {
          period: {
            from: from_date.to_s,
            to: to_date.to_s,
            granularity: granularity
          },
          widget_status: 'enabled',
          surface: 'mobivolt',
          kpis: funnel[:kpis],
          rates: funnel[:rates],
          series: series,
          meta: {
            attribution_model: 'session_and_source_linked',
            coverage: 'production_ready'
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

      def date_range
        from_date..to_date
      end

      def tenant_scope
        @tenant_scope ||= ::Sales::TenantScope.for(user)
      end

      def calculate_funnel
        # 1. Visitors: tracking sessions no site
        tracking_visitors = if defined?(::Sales::TrackingSession)
                              ::Sales::TrackingSession.where(started_at: date_range).select(:session_id).distinct.count
                            else
                              0
                            end
        chat_visitors = ::ChatSession.where(created_at: date_range).select(:visitor_id).distinct.count
        visitors_count = [tracking_visitors, chat_visitors].max

        # 2. Opens: sessões de chat iniciadas / abertas
        opens_count = ::ChatSession.where(created_at: date_range).count

        # 3. Actions: mensagens de usuário ou ações no chat
        actions_count = ::ChatMessage.where(role: 'user', created_at: date_range).count

        # 4. Contacts: leads gerados via chat
        contacts_count = ::ChatLead.where(created_at: date_range).count

        # 5. Sales: leads convertidos ou oportunidades ganhas originadas do chat
        converted_chat_leads = ::ChatLead.where(sales_status: 'converted', created_at: date_range).count
        attributed_opps = tenant_scope.opportunities.where(
          status: 'won',
          source: %w[chat mobivolt website_chat],
          updated_at: date_range
        )
        sales_count = [converted_chat_leads, attributed_opps.count].max
        attributed_cents = attributed_opps.sum(:value_cents) || 0

        # Se visitors for 0 mas houver opens, ajusta visitors de forma consistente
        visitors_count = [visitors_count, opens_count].max

        open_rate = visitors_count.positive? ? ((opens_count.to_f / visitors_count) * 100).round(1) : 0.0
        action_rate = opens_count.positive? ? ((actions_count.to_f / opens_count) * 100).round(1) : 0.0
        contact_rate = actions_count.positive? ? ((contacts_count.to_f / actions_count) * 100).round(1) : 0.0
        sales_rate = contacts_count.positive? ? ((sales_count.to_f / contacts_count) * 100).round(1) : 0.0

        {
          kpis: {
            visitors: visitors_count,
            opens: opens_count,
            actions: actions_count,
            contacts: contacts_count,
            sales: sales_count,
            attributed_value_cents: attributed_cents
          },
          rates: {
            open_rate: open_rate,
            action_rate: action_rate,
            contact_rate: contact_rate,
            sales_rate: sales_rate
          }
        }
      end

      def build_time_series
        date_format = case granularity
                      when 'day' then '%Y-%m-%d'
                      when 'week' then '%Y-W%W'
                      when 'month' then '%Y-%m'
                      end

        buckets = {}
        cur = from_date.to_date
        end_d = to_date.to_date
        step = granularity == 'day' ? 1.day : (granularity == 'week' ? 1.week : 1.month)

        while cur <= end_d
          key = cur.strftime(date_format)
          buckets[key] = {
            date: key,
            visitors: 0,
            opens: 0,
            actions: 0,
            contacts: 0,
            sales: 0
          }
          cur += step
        end

        # Agrupamento de ChatSessions (Opens)
        ::ChatSession.where(created_at: date_range).group("DATE_TRUNC('#{granularity}', created_at)").count.each do |ts, cnt|
          k = ts.to_date.strftime(date_format)
          buckets[k][:opens] += cnt if buckets[k]
          # visitors no mínimo igual aos opens se não houver telemetria externa
          buckets[k][:visitors] = [buckets[k][:visitors], buckets[k][:opens]].max if buckets[k]
        end

        # Agrupamento de ChatMessages (Actions)
        ::ChatMessage.where(role: 'user', created_at: date_range).group("DATE_TRUNC('#{granularity}', created_at)").count.each do |ts, cnt|
          k = ts.to_date.strftime(date_format)
          buckets[k][:actions] += cnt if buckets[k]
        end

        # Agrupamento de ChatLeads (Contacts)
        ::ChatLead.where(created_at: date_range).group("DATE_TRUNC('#{granularity}', created_at)").count.each do |ts, cnt|
          k = ts.to_date.strftime(date_format)
          buckets[k][:contacts] += cnt if buckets[k]
        end

        # Agrupamento de Converted ChatLeads (Sales)
        ::ChatLead.where(sales_status: 'converted', created_at: date_range).group("DATE_TRUNC('#{granularity}', created_at)").count.each do |ts, cnt|
          k = ts.to_date.strftime(date_format)
          buckets[k][:sales] += cnt if buckets[k]
        end

        buckets.values
      end
    end
  end
end
