# frozen_string_literal: true

module CompanyDashboard
  class ProspectsWorkspaceService
    SOURCE_LABELS = {
      'profile' => 'Perfil no Marketplace',
      'compare' => 'Comparador Solar',
      'calculator' => 'Calculadora Solar',
      'directory' => 'Catálogo de Empresas',
      'quote_modal' => 'Solicitação de Proposta',
      'ad_rail' => 'Destaque Patrocinado',
      'banner' => 'Banner Institucional',
      'search' => 'Busca Direta',
      'other' => 'Outros Canais'
    }.freeze

    def self.call(company:, from_time:, to_time:, params: {}, api_root: '')
      new(company:, from_time:, to_time:, params:, api_root:).call
    end

    def initialize(company:, from_time:, to_time:, params: {}, api_root: '')
      @company = company
      @from_time = from_time
      @to_time = to_time
      @params = params
      @api_root = api_root
    end

    def call
      site = ::Sales::TrackingSite.find_by(company_id: @company.id)
      status = resolve_workspace_status(site)

      summary = calculate_summary
      timeseries = calculate_timeseries
      source_breakdown = calculate_source_breakdown
      pagination_data = paginate_records

      {
        status: status,
        range: {
          from: @from_time.to_date.iso8601,
          to: @to_time.to_date.iso8601
        },
        summary: summary,
        timeseries: timeseries,
        source_breakdown: source_breakdown,
        records: pagination_data[:records],
        pagination: pagination_data[:meta],
        tag_info: build_tag_info(site),
        integrations: build_integrations(site)
      }
    end

    private

    def resolve_workspace_status(site)
      return 'tag_not_installed' unless site
      return 'inactive' unless site.active

      has_any_history = ::OutboundClick.where(company_id: @company.id).exists? ||
                        ::Sales::TrackingSession.where(company_id: @company.id).exists?
      return 'configured_no_evidence' unless has_any_history

      has_period_traffic = clicks_scope.exists? || sessions_scope.exists?
      return 'active_no_attributed_traffic' unless has_period_traffic

      'ready'
    end

    def clicks_scope
      ::OutboundClick.where(company_id: @company.id, clicked_at: @from_time..@to_time)
    end

    def sessions_scope
      ::Sales::TrackingSession.where(company_id: @company.id, started_at: @from_time..@to_time)
    end

    def events_scope
      ::Sales::TrackingEvent.where(company_id: @company.id, occurred_at: @from_time..@to_time)
    end

    def calculate_summary
      clicks = clicks_scope.count
      landings = sessions_scope.with_outbound_click.count
      form_submits = events_scope.where(event_name: 'form_submitted').count
      conversions = events_scope.where(event_name: %w[lead_confirmed quote_request_submitted]).count

      landing_rate = clicks.positive? ? (landings.to_f / clicks * 100).round(1) : nil
      conversion_rate = landings.positive? ? (conversions.to_f / landings * 100).round(1) : nil

      period_duration = @to_time - @from_time
      prev_from = @from_time - period_duration
      prev_to = @from_time

      prev_clicks = ::OutboundClick.where(company_id: @company.id, clicked_at: prev_from..prev_to).count
      prev_landings = ::Sales::TrackingSession.where(company_id: @company.id, started_at: prev_from..prev_to).with_outbound_click.count
      prev_conversions = ::Sales::TrackingEvent.where(company_id: @company.id, occurred_at: prev_from..prev_to, event_name: %w[lead_confirmed quote_request_submitted]).count

      {
        clicks: clicks,
        verified_landings: landings,
        form_submissions: form_submits,
        confirmed_conversions: conversions,
        landing_rate: landing_rate,
        conversion_rate: conversion_rate,
        trends: {
          clicks_change_pct: calculate_change_pct(clicks, prev_clicks),
          landings_change_pct: calculate_change_pct(landings, prev_landings),
          conversions_change_pct: calculate_change_pct(conversions, prev_conversions)
        }
      }
    end

    def calculate_change_pct(current, previous)
      return nil if previous.zero?

      ((current - previous).to_f / previous * 100).round(1)
    end

    def calculate_timeseries
      days = (@from_time.to_date..@to_time.to_date).to_a
      return [] if days.empty?

      # Agrupa cliques por data
      clicks_by_day = clicks_scope
                      .group("DATE(clicked_at AT TIME ZONE 'America/Sao_Paulo')")
                      .count

      # Agrupa landings verificadas por data
      landings_by_day = sessions_scope.with_outbound_click
                                      .group("DATE(started_at AT TIME ZONE 'America/Sao_Paulo')")
                                      .count

      # Agrupa conversões por data
      conversions_by_day = events_scope.where(event_name: %w[lead_confirmed quote_request_submitted])
                                       .group("DATE(occurred_at AT TIME ZONE 'America/Sao_Paulo')")
                                       .count

      days.map do |day|
        day_str = day.iso8601
        {
          date: day_str,
          clicks: clicks_by_day[day] || 0,
          verified_landings: landings_by_day[day] || 0,
          conversions: conversions_by_day[day] || 0
        }
      end
    end

    def calculate_source_breakdown
      total_clicks = clicks_scope.count
      clicks_by_src = clicks_scope.group(:source_context).count
      landings_by_src = ::Sales::TrackingSession.joins(:outbound_click)
                                                .where(sales_tracking_sessions: { company_id: @company.id, started_at: @from_time..@to_time })
                                                .group('outbound_clicks.source_context')
                                                .count

      conversions_by_src = ::Sales::TrackingEvent.joins(session: :outbound_click)
                                                 .where(sales_tracking_events: { company_id: @company.id, occurred_at: @from_time..@to_time, event_name: %w[lead_confirmed quote_request_submitted] })
                                                 .group('outbound_clicks.source_context')
                                                 .count

      SOURCE_LABELS.keys.map do |src|
        c = clicks_by_src[src] || 0
        l = landings_by_src[src] || 0
        cv = conversions_by_src[src] || 0
        pct = total_clicks.positive? ? (c.to_f / total_clicks * 100).round(1) : 0.0

        {
          source: src,
          label: SOURCE_LABELS[src] || src.titleize,
          clicks: c,
          verified_landings: l,
          conversions: cv,
          percentage: pct
        }
      end.select { |item| item[:clicks].positive? || item[:verified_landings].positive? }
         .sort_by { |item| -item[:clicks] }
    end

    def paginate_records
      scope = ::OutboundClick.where(company_id: @company.id, clicked_at: @from_time..@to_time)

      search_term = @params[:search].to_s.strip
      if search_term.present?
        sanitized = "%#{search_term.downcase}%"
        scope = scope.where('LOWER(target_url) LIKE ? OR LOWER(source_context) LIKE ?', sanitized, sanitized)
      end

      evidence_filter = @params[:evidence_status].to_s.strip
      case evidence_filter
      when 'click_only'
        scope = scope.where.not(id: ::Sales::TrackingSession.where(company_id: @company.id).select(:outbound_click_id))
      when 'landing_verified'
        scope = scope.where(id: ::Sales::TrackingSession.where(company_id: @company.id).select(:outbound_click_id))
      end

      total_count = scope.count
      page = [(@params[:page] || 1).to_i, 1].max
      per_page = [[(@params[:per_page] || 15).to_i, 1].max, 100].min

      clicks = scope.order(clicked_at: :desc).offset((page - 1) * per_page).limit(per_page)

      # Pré-carrega sessões associadas aos cliques desta página
      click_ids = clicks.map(&:id)
      sessions_by_click = ::Sales::TrackingSession.where(company_id: @company.id, outbound_click_id: click_ids)
                                                  .includes(:account, :events)
                                                  .index_by(&:outbound_click_id)

      records = clicks.map do |click|
        session = sessions_by_click[click.id]
        evidence = determine_evidence_status(session)

        {
          id: click.id,
          clicked_at: click.clicked_at.iso8601,
          source_context: click.source_context,
          source_label: SOURCE_LABELS[click.source_context] || click.source_context.titleize,
          destination_type: click.destination_type,
          target_url: click.target_url,
          evidence_status: evidence,
          session_id: session&.session_id,
          landing_verified_at: session&.started_at&.iso8601,
          referrer_host: session&.referrer_host,
          duration_seconds: calculate_session_duration(session),
          events_count: session&.events&.length || 0,
          account_name: session&.account&.name || 'Não identificado',
          country: 'Brasil'
        }
      end

      {
        records: records,
        meta: {
          current_page: page,
          per_page: per_page,
          total_count: total_count,
          total_pages: (total_count.to_f / per_page).ceil
        }
      }
    end

    def determine_evidence_status(session)
      return 'click_only' unless session

      events = session.events
      if events.any? { |e| %w[lead_confirmed quote_request_submitted].include?(e.event_name) }
        'lead_confirmed'
      elsif events.any? { |e| e.event_name == 'form_submitted' }
        'form_event_observed'
      else
        'landing_verified'
      end
    end

    def calculate_session_duration(session)
      return nil unless session&.started_at

      last_event_time = session.events.map(&:occurred_at).max || session.ended_at
      return nil unless last_event_time && last_event_time > session.started_at

      (last_event_time - session.started_at).round
    end

    def build_tag_info(site)
      return { configured: false, status: 'tag_not_installed' } unless site

      last_telemetry = ::Sales::TrackingEvent.where(company_id: @company.id).maximum(:occurred_at) ||
                       ::Sales::TrackingSession.where(company_id: @company.id).maximum(:started_at)

      tag_status = if !site.active
                     'inactive'
                   elsif last_telemetry.nil?
                     'configured_no_evidence'
                   elsif last_telemetry < 7.days.ago
                     'possibly_inactive'
                   else
                     'healthy'
                   end

      {
        configured: true,
        active: site.active,
        public_key: site.public_key,
        allowed_origins: site.allowed_origins,
        snippet_url: "#{@api_root}/api/v1/public/sales/tracking/#{site.public_key}.js",
        last_seen_at: last_telemetry&.iso8601,
        status: tag_status,
        settings: site.settings || {}
      }
    end

    def build_integrations(site)
      settings = site&.settings || {}
      ga4_settings = settings['ga4'] || {}

      {
        ga4: {
          status: ga4_settings['measurement_id'].present? ? 'connected' : 'not_configured',
          measurement_id: ga4_settings['measurement_id'],
          updated_at: ga4_settings['updated_at']
        },
        custom_ids: {
          allowed_keys: %w[user_id crm_lead_id account_id proposal_id],
          enabled: settings.dig('custom_ids', 'enabled') || false
        }
      }
    end
  end
end
