# frozen_string_literal: true

module CompanyConversion
  # Tenant-scoped read model. Does not change plan access, user settings or
  # recommendation ranking. Uninstrumented analytics are null, never zero.
  class SurfaceSnapshot
    PERIODS = { '7d' => 7, '30d' => 30, '90d' => 90 }.freeze
    COMPLETED_WIZARD_STATUSES = %w[
      verified matched open in_progress distributed converted closed
      proposal_submitted proposal_processing proposal_sent proposal_failed
    ].freeze

    def initialize(company:, preset: '30d')
      @company = company
      @preset = preset.to_s
      raise ArgumentError, 'invalid period' unless PERIODS.key?(@preset)
    end

    def call
      registry = CompanyConversion::ConversionSurfaceRegistry
      registry.validate!
      visibility = CompanyCtaVisibilityResolver.new(@company).call
      certified = registry.certified_ids
      products_present = @company.respond_to?(:products) && @company.products.exists?
      rows = registry.all.map do |entry|
        applicable = applicable?(entry, products_present)
        published = certified.include?(entry[:id]) && !%w[legacy retired].include?(entry[:lifecycle])
        channels = entry[:channels].index_with do |channel|
          allowed = visibility.dig(:effective, channel.to_sym) == true
          reason = if !applicable
                     'not_applicable'
                   elsif !published
                     'awaiting_certification'
                   elsif !allowed
                     'not_entitled_or_disabled'
                   else
                     'active'
                   end
          { state: reason == 'active' ? 'active' : reason, enabled: reason == 'active', reason: reason }
        end
        {
          surface_id: entry[:id], group: entry[:group], route: entry[:route],
          component: entry[:component], variant_group: entry[:variant_group],
          lifecycle: entry[:lifecycle], certified: published,
          applicable: applicable, channels: channels
        }
      end
      period_start = PERIODS.fetch(@preset).days.ago
      period_end = Time.current
      metrics = metrics_for(period_start, period_end, registry.ids)
      rows.each do |row|
        surface = metrics[:by_surface].fetch(row[:surface_id], {})
        row[:observed] = {
          data_status: metrics[:status],
          impressions: metrics[:status] == 'ready' ? surface.fetch(:impressions, 0) : nil,
          quote_clicks: metrics[:status] == 'ready' ? surface.fetch(:quote_clicks, 0) : nil,
          whatsapp_clicks: metrics[:status] == 'ready' ? surface.fetch(:whatsapp_clicks, 0) : nil
        }
      end
      active_quote = rows.select { |row| row.dig(:channels, 'quote', :enabled) }
      active_whatsapp = rows.select { |row| row.dig(:channels, 'whatsapp', :enabled) }
      observed = metrics[:status] == 'ready' ? metrics[:by_surface].count { |_id, values| values[:impressions].to_i.positive? } : nil

      {
        company_id: @company.id,
        registry_version: registry::VERSION,
        as_of: Time.current.iso8601,
        data_status: metrics[:status],
        period: { preset: @preset, start_at: period_start.utc.iso8601, end_at: period_end.utc.iso8601 },
        summary: {
          catalog_candidates: registry.all.size,
          certified_live_surfaces: rows.count { |row| row[:certified] },
          # Eligible means that at least one paid channel is EFFECTIVELY allowed.
          # A Free company may be listed everywhere, but has zero paid CTA surfaces.
          applicable_surfaces: rows.select do |row|
            row[:applicable] && row[:channels].keys.any? { |channel| visibility.dig(:effective, channel.to_sym) == true }
          end.map { |row| row[:variant_group] }.uniq.size,
          active_surface_count: rows.select { |row| row[:channels].values.any? { |channel| channel[:enabled] } }
                                    .map { |row| row[:variant_group] }.uniq.size,
          active_quote_points: active_quote.map { |row| row[:variant_group] }.uniq.size,
          active_whatsapp_points: active_whatsapp.map { |row| row[:variant_group] }.uniq.size,
          observed_surface_count: observed,
          impressions: metrics[:impressions],
          quote_clicks: metrics[:quote_clicks],
          whatsapp_clicks: metrics[:whatsapp_clicks],
          quote_submissions: metrics[:quote_submissions]
        },
        surfaces: rows
      }
    end

    private

    def applicable?(entry, products_present)
      return false if %w[legacy retired].include?(entry[:lifecycle])
      return false unless @company.status == 'active' && @company.moderation_status == 'approved'
      return products_present if entry[:id].start_with?('CV-PRODUCT-')
      return @company.p2p_chat_enabled == true if entry[:id] == 'CV-CHAT-REC'

      true
    end

    def metrics_for(from_time, to_time, ids)
      unavailable = {
        status: 'unavailable', by_surface: {},
        impressions: nil, quote_clicks: nil,
        whatsapp_clicks: nil, quote_submissions: nil
      }
      return unavailable unless ENV['CONVERSION_EVENTS_V2_ENABLED'] == 'true'

      # PostgreSQL JSON path is fixed SQL; user input never enters the expression.
      scope = AnalyticsEvent.where(company_id: @company.id, tracked_at: from_time..to_time)
                            .where.not(event_id: nil)
                            .where("metadata ->> 'surface_id' IN (?)", ids)
                            .where("COALESCE(metadata ->> 'is_internal', 'false') <> 'true'")
                            .where("COALESCE(metadata ->> 'is_admin', 'false') <> 'true'")
                            .where("COALESCE(metadata ->> 'is_employee', 'false') <> 'true'")
      impression_scope = scope.where(event_type: 'surface_impression')
                              .where("metadata ->> 'qualified' = 'true'")
      clicks_scope = scope.where(event_type: 'cta_click')
      count_grouped = lambda do |relation|
        relation.group("metadata ->> 'surface_id'").count('DISTINCT event_id')
      end
      impressions = count_grouped.call(impression_scope)
      quotes = count_grouped.call(clicks_scope.where("metadata ->> 'cta_type' = 'quote'"))
      whatsapp = count_grouped.call(clicks_scope.where("metadata ->> 'cta_type' = 'whatsapp'"))
      by_surface = ids.index_with do |id|
        { impressions: impressions.fetch(id, 0), quote_clicks: quotes.fetch(id, 0),
          whatsapp_clicks: whatsapp.fetch(id, 0) }
      end
      {
        status: 'ready', by_surface: by_surface,
        impressions: impressions.values.sum,
        quote_clicks: quotes.values.sum,
        whatsapp_clicks: whatsapp.values.sum,
        quote_submissions: Lead.where(company_id: @company.id, created_at: from_time..to_time,
                                      wizard_status: COMPLETED_WIZARD_STATUSES).count
      }
    rescue StandardError => e
      Rails.logger.warn("[CompanyConversion::SurfaceSnapshot] metrics unavailable company_id=#{@company.id}: #{e.class}")
      unavailable
    end
  end
end
