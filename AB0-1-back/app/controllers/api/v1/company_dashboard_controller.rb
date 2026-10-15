# app/controllers/api/v1/company_dashboard_controller.rb
module Api
  module V1
    class CompanyDashboardController < BaseController
      include PendingChangeIdempotency
      include FeatureGateEnforceable

      before_action :authenticate_company_user_or_admin!
      before_action :set_company
      before_action :authorize_dashboard_access!
      before_action :authorize_tracking_workspace_access!, only: %i[analytics_tracking_workspace analytics_prospects analytics_prospects_journey analytics_prospects_export analytics_prospects_settings]
      before_action :enforce_intent_summary_feature_access!, only: %i[intent_summary]

      # GET /api/v1/company_dashboard/analytics/overview
      def analytics_overview
        authorize @company, :view_analytics?

        begin
          range = analytics_date_range(default_days: 30)
          return render_invalid_analytics_range unless range

          freshness = ::CompanyDashboard::FreshnessProvider.call
          source = ::CompanyDashboard::MetricsSource.new(company_id: @company.id)
          stats, data_source = source.realtime_totals(
            from_day: range[:from_day],
            to_day: range[:to_day],
            last_aggregated_at: freshness[:last_aggregated_at]
          )

          if stats.blank? || data_source == 'company_daily_stats_unavailable'
            return render json: default_overview_payload(company: @company, range: range).merge(freshness)
          end

          views = stats[:profile_views].to_i
          is_premium = @company.has_paid_plan?
          range_payload = analytics_range_payload(range)
          engagement_status, engagement_payload = engagement_snapshot_for(@company)

          response = {
            views_30d: views,
            views: views,
            unique_views: stats[:unique_views].to_i,
            returning_views: stats[:returning_views].to_i,
            data_source: data_source,
            data_status: analytics_data_status(data_source, freshness: freshness),
            range: range_payload,
            engagement_status: engagement_status,
            engagement: engagement_payload
          }

          if is_premium && FeatureGateService.can_access?(@company, 'advanced_analytics')
            cta_clicks = stats[:cta_clicks].to_i
            leads = stats[:leads].to_i
            rates = analytics_rates(views: views, cta_clicks: cta_clicks, leads: leads)
            cta_breakdown = build_cta_breakdown(stats)

            response.merge!(
              metrics: { views: views, cta_clicks: cta_clicks, leads: leads },
              rates: rates,
              cta_clicks_30d: cta_clicks,
              whatsapp_clicks_30d: stats[:whatsapp_clicks].to_i,
              email_clicks_30d: stats[:email_clicks].to_i,
              phone_clicks_30d: stats[:phone_clicks].to_i,
              website_clicks_30d: stats[:website_clicks].to_i,
              quote_clicks_30d: stats[:quote_clicks].to_i,
              unique_views_30d: stats[:unique_views].to_i,
              returning_views_30d: stats[:returning_views].to_i,
              leads_30d: leads,
              cta_clicks: cta_clicks,
              whatsapp_clicks: stats[:whatsapp_clicks].to_i,
              email_clicks: stats[:email_clicks].to_i,
              phone_clicks: stats[:phone_clicks].to_i,
              website_clicks: stats[:website_clicks].to_i,
              quote_clicks: stats[:quote_clicks].to_i,
              leads: leads,
              conversion_rate: rates[:profile_to_lead_conversion],
              cta_breakdown: cta_breakdown,
              is_premium_analytics: true
            )
          else
            response.merge!(
              is_premium_analytics: false,
              upsell_message: 'Upgrade to Pro to unlock detailed analytics'
            )
          end

          render json: response.merge(freshness)
        rescue StandardError => e
          log_analytics_error('overview', e)
          render json: default_overview_payload(company: @company, range: range).merge(
            ::CompanyDashboard::FreshnessProvider.call,
            data_status: 'error'
          )
        end
      end

      # GET /api/v1/company_dashboard/analytics/timeseries
      def analytics_timeseries
        authorize @company, :view_analytics?

        begin
          freshness = ::CompanyDashboard::FreshnessProvider.call
          range = analytics_date_range(default_days: 30)
          return render_invalid_analytics_range unless range

          # ✅ FEATURE GATE: Timeseries só para premium
          unless FeatureGateService.can_access?(@company, 'advanced_analytics')
            return render json: {
              data: [],
              data_source: 'feature_not_authorized',
              data_status: 'locked',
              range: analytics_range_payload(range),
              is_premium_analytics: false,
              upsell_message: 'Upgrade to Pro to view timeseries analytics'
            }.merge(freshness), status: :ok
          end

          source = ::CompanyDashboard::MetricsSource.new(company_id: @company.id)
          series, data_source = source.realtime_timeseries(
            from_day: range[:from_day],
            to_day: range[:to_day],
            last_aggregated_at: freshness[:last_aggregated_at]
          )

          if data_source == 'company_daily_stats_unavailable'
            return render json: {
              data: [],
              data_source: 'company_daily_stats_unavailable',
              data_status: 'unavailable',
              range: analytics_range_payload(range),
              is_premium_analytics: true
            }.merge(freshness), status: :ok
          end

          data = series.map do |row|
            {
              date: row[:date],
              views: row[:profile_views],
              clicks: row[:cta_clicks],
              whatsapp: row[:whatsapp_clicks],
              email: row[:email_clicks],
              phone: row[:phone_clicks],
              website: row[:website_clicks],
              quote: row[:quote_clicks],
              leads: row[:leads],
              ctr: analytics_rate(row[:cta_clicks], row[:profile_views]),
              profile_to_lead_conversion: analytics_rate(row[:leads], row[:profile_views]),
              cta_to_lead_rate: analytics_rate(row[:leads], row[:cta_clicks])
            }
          end

          render json: {
            data: data,
            data_source: data_source,
            data_status: data.empty? ? 'empty' : analytics_data_status(data_source, freshness: freshness),
            range: analytics_range_payload(range),
            is_premium_analytics: true
          }.merge(freshness), status: :ok
        rescue StandardError => e
          log_analytics_error('timeseries', e)
          freshness = ::CompanyDashboard::FreshnessProvider.call
          fallback_range = range || analytics_date_range(default_days: 30)
          render json: {
            data: [],
            data_source: 'timeseries_unavailable',
            data_status: 'error',
            range: analytics_range_payload(fallback_range),
            is_premium_analytics: true
          }.merge(freshness), status: :ok
        end
      end

      # GET /api/v1/company_dashboard/analytics/top_campaigns
      def analytics_top_campaigns
        authorize @company, :view_analytics?
        range = analytics_date_range(default_days: 30)
        return render_invalid_analytics_range unless range

        unless FeatureGateService.can_access?(@company, 'top_campaigns')
          return render json: {
            campaigns: [],
            data_source: 'feature_not_authorized',
            data_status: 'locked',
            range: analytics_range_payload(range),
            is_premium_analytics: false,
            upsell_message: 'Upgrade to Pro to access campaign analytics'
          }, status: :ok
        end

        limit = [[params[:limit].to_i, 1].max, 20].min
        limit = 5 if params[:limit].blank?

        campaigns = ::Analytics::CampaignPerformanceService.call(
          company_id: @company.id,
          from_time: range[:from_day].beginning_of_day,
          to_time: range[:to_day].end_of_day,
          limit: limit
        )

        render json: {
          campaigns: campaigns.map.with_index do |campaign, index|
            {
              id: "#{campaign.utm_source}-#{campaign.utm_medium}-#{campaign.utm_campaign}-#{index}",
              utm_campaign: campaign.utm_campaign,
              utm_source: campaign.utm_source,
              utm_medium: campaign.utm_medium,
              total_visits: campaign.total_visits,
              total_cta_clicks: campaign.total_cta_clicks,
              total_leads: campaign.total_leads,
              conversion_rate: campaign.conversion_rate,
              ctr: campaign.ctr,
              profile_to_lead_conversion: campaign.profile_to_lead_conversion,
              cta_to_lead_rate: campaign.cta_to_lead_rate,
              last_seen_at: campaign.last_seen_at
            }
          end,
          data_source: 'analytics_events',
          data_status: campaigns.empty? ? 'empty' : 'ready',
          range: analytics_range_payload(range),
          is_premium_analytics: true
        }, status: :ok
      rescue StandardError => e
        log_analytics_error('top_campaigns', e)
        render json: {
          campaigns: [],
          data_source: 'top_campaigns_unavailable',
          data_status: 'error',
          range: analytics_range_payload(range),
          is_premium_analytics: true
        }, status: :ok
      end

      # GET /api/v1/company_dashboard/analytics/attribution
      def analytics_attribution
        authorize @company, :view_analytics?
        range = analytics_date_range(default_days: 30)
        return render_invalid_analytics_range unless range

        freshness = ::CompanyDashboard::FreshnessProvider.call
        unless FeatureGateService.can_access?(@company, 'advanced_analytics')
          return render json: { attribution_model: attribution_model, summary: nil, channels: [], campaigns: [], cta_matrix: [], landing_pages: [], data_source: 'feature_not_authorized', data_status: 'locked', range: analytics_range_payload(range), is_premium_analytics: false, upsell_message: 'Upgrade to Pro to access attribution analytics' }.merge(freshness), status: :ok
        end

        payload = ::Analytics::AttributionQuery.call(
          company_id: @company.id, from_time: range[:from_day].beginning_of_day,
          to_time: range[:to_day].end_of_day, attribution_model: attribution_model, limit: attribution_limit
        )
        render json: payload.merge(
          range: analytics_range_payload(range), attribution_model: attribution_model, data_source: 'analytics_events',
          data_status: payload[:summary].to_h.values_at(:visits, :cta_clicks, :leads).all? { |value| value.to_i.zero? } ? 'empty' : 'ready',
          is_premium_analytics: true
        ).merge(freshness), status: :ok
      rescue StandardError => e
        log_analytics_error('attribution', e)
        render json: { summary: nil, channels: [], campaigns: [], cta_matrix: [], landing_pages: [], attribution_model: attribution_model, data_source: 'analytics_events_unavailable', data_status: 'unavailable', range: analytics_range_payload(range), is_premium_analytics: true }.merge(::CompanyDashboard::FreshnessProvider.call), status: :ok
      end

      # GET /api/v1/company_dashboard/analytics/tracking_workspace
      def analytics_tracking_workspace
        range = analytics_date_range(default_days: 30)
        return render_invalid_analytics_range unless range

        advanced = EntitlementService.explain(company: @company, feature: 'advanced_analytics')[:allowed]
        payload = ::CompanyDashboard::TrackingWorkspaceService.call(
          company: @company,
          from_time: range[:from_day].beginning_of_day,
          to_time: range[:to_day].end_of_day,
          advanced: advanced,
          attribution_model: params[:attribution_model].presence || 'last_touch'
        )
        render json: payload.merge(
          range: analytics_range_payload(range),
          data_status: payload[:status],
          is_premium_analytics: advanced
        ), status: :ok
      rescue StandardError => e
        log_analytics_error('tracking_workspace', e)
        render_tracking_workspace_unavailable(range)
      end

      # GET /api/v1/company_dashboard/analytics/prospects
      def analytics_prospects
        range = analytics_date_range(default_days: 30)
        return render_invalid_analytics_range unless range

        payload = ::CompanyDashboard::ProspectsWorkspaceService.call(
          company: @company,
          from_time: range[:from_day].beginning_of_day,
          to_time: range[:to_day].end_of_day,
          params: params,
          api_root: request.base_url
        )

        render json: payload, status: :ok
      rescue StandardError => e
        log_analytics_error('prospects_workspace', e)
        render json: { status: 'error', message: 'Erro ao carregar dados de prospecção.' }, status: :internal_server_error
      end

      # GET /api/v1/company_dashboard/analytics/prospects/journey/:id
      def analytics_prospects_journey
        click = ::OutboundClick.find_by(id: params[:id], company_id: @company.id)
        unless click
          return render_error_response(message: 'Registro de clique não encontrado para esta empresa.', status: :not_found, code: 'CLICK_NOT_FOUND')
        end

        session = ::Sales::TrackingSession.find_by(outbound_click_id: click.id, company_id: @company.id)
        events = session ? session.events.order(:occurred_at) : []

        timeline = []
        timeline << {
          step: 'outbound_click',
          label: 'Clique de saída no Marketplace',
          occurred_at: click.clicked_at.iso8601,
          source_context: click.source_context,
          destination_type: click.destination_type,
          target_url: click.target_url,
          evidence_type: 'marketplace_telemetry'
        }

        if session
          timeline << {
            step: 'landing_verified',
            label: 'Chegada verificada no site parceiro',
            occurred_at: session.started_at.iso8601,
            landing_path: session.landing_path,
            referrer_host: session.referrer_host,
            consent_state: session.consent_state,
            traffic_class: session.traffic_class,
            evidence_type: 'verified_tag_attribution'
          }

          events.each do |event|
            timeline << {
              step: event.event_name,
              label: event.event_name.humanize,
              occurred_at: event.occurred_at.iso8601,
              path: event.path,
              properties: event.properties,
              evidence_type: 'observed_partner_event'
            }
          end
        end

        render json: {
          click_id: click.id,
          company_id: @company.id,
          timeline: timeline,
          summary: {
            source_context: click.source_context,
            target_url: click.target_url,
            total_steps: timeline.length,
            session_id: session&.session_id,
            account_name: session&.account&.name || 'Não identificado'
          }
        }, status: :ok
      end

      # GET /api/v1/company_dashboard/analytics/prospects/export
      def analytics_prospects_export
        range = analytics_date_range(default_days: 30)
        return render_invalid_analytics_range unless range

        scope = ::OutboundClick.where(company_id: @company.id, clicked_at: range[:from_day].beginning_of_day..range[:to_day].end_of_day)

        search_term = params[:search].to_s.strip
        if search_term.present?
          sanitized = "%#{search_term.downcase}%"
          scope = scope.where('LOWER(target_url) LIKE ? OR LOWER(source_context) LIKE ?', sanitized, sanitized)
        end

        evidence_filter = params[:evidence_status].to_s.strip
        case evidence_filter
        when 'click_only'
          scope = scope.where.not(id: ::Sales::TrackingSession.where(company_id: @company.id).select(:outbound_click_id))
        when 'landing_verified'
          scope = scope.where(id: ::Sales::TrackingSession.where(company_id: @company.id).select(:outbound_click_id))
        end

        clicks = scope.order(clicked_at: :desc).limit(10_000)
        click_ids = clicks.map(&:id)
        sessions_by_click = ::Sales::TrackingSession.where(company_id: @company.id, outbound_click_id: click_ids)
                                                    .includes(:account, :events)
                                                    .index_by(&:outbound_click_id)

        csv_data = CSV.generate(headers: true, col_sep: ',') do |csv|
          csv << [
            'ID do Clique',
            'Data/Hora (ISO8601)',
            'Origem no Marketplace',
            'Tipo de Destino',
            'URL de Destino',
            'Status de Evidência',
            'ID da Sessão',
            'Chegada Verificada em',
            'Host de Referência',
            'Duração (s)',
            'Eventos Observados',
            'Conta / Empresa',
            'País'
          ]

          clicks.each do |click|
            session = sessions_by_click[click.id]
            evidence = if !session
                         'click_only'
                       elsif session.events.any? { |e| %w[lead_confirmed quote_request_submitted].include?(e.event_name) }
                         'lead_confirmed'
                       elsif session.events.any? { |e| e.event_name == 'form_submitted' }
                         'form_event_observed'
                       else
                         'landing_verified'
                       end

            last_event_time = session&.events&.map(&:occurred_at)&.max || session&.ended_at
            duration = if session&.started_at && last_event_time && last_event_time > session.started_at
                         (last_event_time - session.started_at).round
                       end

            csv << [
              sanitize_csv_cell(click.id),
              sanitize_csv_cell(click.clicked_at.iso8601),
              sanitize_csv_cell(click.source_context),
              sanitize_csv_cell(click.destination_type),
              sanitize_csv_cell(click.target_url),
              sanitize_csv_cell(evidence),
              sanitize_csv_cell(session&.session_id),
              sanitize_csv_cell(session&.started_at&.iso8601),
              sanitize_csv_cell(session&.referrer_host),
              sanitize_csv_cell(duration),
              sanitize_csv_cell(session&.events&.length || 0),
              sanitize_csv_cell(session&.account&.name || 'Não identificado'),
              sanitize_csv_cell('Brasil')
            ]
          end
        end

        filename = "prospects_#{@company.id}_#{range[:from_day]}_#{range[:to_day]}.csv"
        send_data csv_data, type: 'text/csv; charset=utf-8', filename: filename
      end

      # PATCH /api/v1/company_dashboard/analytics/prospects/settings
      def analytics_prospects_settings
        site = ::Sales::TrackingSite.find_or_initialize_by(company_id: @company.id)
        if site.new_record?
          site.public_key = SecureRandom.urlsafe_base64(32)
          site.active = true
          site.allowed_origins = []
        end

        if params[:active].in?([true, false, 'true', 'false'])
          site.active = ActiveModel::Type::Boolean.new.cast(params[:active])
        end

        if params[:allowed_origins].is_a?(Array)
          origins = params[:allowed_origins].map(&:to_s).map(&:strip).reject(&:blank?)
          valid_origins = origins.select { |o| o.start_with?('https://') || o.start_with?('http://localhost') }
          site.allowed_origins = valid_origins.uniq
        end

        current_settings = site.settings || {}
        if params[:settings].present?
          raw_settings = params[:settings].respond_to?(:to_unsafe_h) ? params[:settings].to_unsafe_h : params[:settings]
          if raw_settings[:ga4] || raw_settings['ga4']
            ga4 = (raw_settings[:ga4] || raw_settings['ga4'])
            current_settings['ga4'] = {
              'measurement_id' => ga4[:measurement_id] || ga4['measurement_id'],
              'updated_at' => Time.current.iso8601
            }
          end
          if raw_settings.key?(:custom_ids) || raw_settings.key?('custom_ids')
            c_ids = (raw_settings[:custom_ids] || raw_settings['custom_ids'])
            current_settings['custom_ids'] = {
              'enabled' => ActiveModel::Type::Boolean.new.cast(c_ids[:enabled] || c_ids['enabled'])
            }
          end
          site.settings = current_settings
        end

        if site.save
          render json: {
            status: 'success',
            tag_info: {
              configured: true,
              active: site.active,
              public_key: site.public_key,
              allowed_origins: site.allowed_origins,
              snippet_url: "#{request.base_url}/api/v1/public/sales/tracking/#{site.public_key}.js",
              settings: site.settings
            }
          }, status: :ok
        else
          render json: { status: 'error', errors: site.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # GET /api/v1/company_dashboard/analytics/reputation
      def analytics_reputation
        authorize @company, :view_analytics?

        # ✅ FEATURE GATE: Reputation tracking só para premium
        unless FeatureGateService.can_access?(@company, 'reputation_tracking')
          return render json: {
            total_reviews: 0,
            avg_rating: 0,
            trust_score: 0,
            trust_components: {},
            is_premium_analytics: false,
            upsell_message: 'Upgrade to Pro to access reputation tracking'
          }
        end

        begin
          service = ::CompanyDashboard::ReputationService.new(company: @company)
          data = service.reputation_data
          render json: data.merge(is_premium_analytics: true)
        rescue StandardError => e
          log_analytics_error('reputation', e)
          render json: {
            total_reviews: 0,
            avg_rating: 0,
            trust_score: 0,
            trust_components: {},
            is_premium_analytics: true
          }
        end
      end

      # GET /api/v1/company_dashboard/analytics/ranking
      def analytics_ranking
        authorize @company, :view_analytics_ranking?
        started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)

        begin
          # ✅ FEATURE GATE: Ranking só para planos Pro/Enterprise
          # Usa EntitlementService (mesma fonte de verdade de intent_summary) para evitar
          # inconsistência com FeatureGateService hardcoded por tier.
          ranking_entitlement = EntitlementService.explain(company: @company, feature: 'advanced_analytics')
          unless ranking_entitlement[:allowed]
            return render json: default_ranking_payload(
              status: 'locked',
              error: { code: 'RANKING_UPGRADE_REQUIRED' },
              ranking_status: 'locked',
              quadrant_status: 'locked',
              history_status: 'locked'
            ).merge(
              is_premium_analytics: false,
              upsell_message: 'Upgrade to Pro or Enterprise to access ranking analytics',
              entitlement_reason: ranking_entitlement[:reason]
            ), status: :ok
          end

          category_id = params[:category_id].presence
          criterion_slug = params[:criterion_slug].presence
          state = params[:state].presence
          city = params[:city].presence
          sector = params[:sector].presence
          quadrant_mode = params[:quadrant_mode].presence
          filter_errors = ranking_filter_errors(
            category_id: category_id,
            criterion_slug: criterion_slug,
            state: state,
            city: city,
            sector: sector,
            quadrant_mode: quadrant_mode
          )
          if filter_errors.present?
            return render json: {
              status: 'error',
              error: { code: 'INVALID_RANKING_FILTERS', request_id: request.request_id },
              invalid_filters: filter_errors
            }, status: :unprocessable_entity
          end
          history_days = [[params.fetch(:history_days, 90).to_i, 7].max, 365].min
          service = ::CompanyDashboard::RankingService.new(
            company: @company,
            category_id: category_id,
            criterion_slug: criterion_slug,
            state: state,
            city: city,
            sector: sector,
            history_days: history_days,
            quadrant_mode: quadrant_mode,
            positioning_version: params[:positioning_version]
          )
          data = service.ranking_data
          payload = ranking_payload(data).merge(
            is_premium_analytics: true
          )
          log_ranking_success(payload, data[:observability] || {}, request.request_id)
          render json: payload
        rescue StandardError => e
          duration_ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1000).round
          log_ranking_error(e, request.request_id, duration_ms: duration_ms)
          render json: default_ranking_payload(
            status: 'error',
            error: {
              code: 'RANKING_UNAVAILABLE',
              message: 'Não foi possível carregar o ranking agora.',
              request_id: request.request_id
            },
            ranking_status: 'error',
            quadrant_status: 'error',
            history_status: 'error'
          ).merge(is_premium_analytics: true), status: :internal_server_error
        end
      end

      # GET /api/v1/company_dashboard/analytics/ranking/filter_options
      def analytics_ranking_filter_options
        authorize @company, :view_analytics_ranking?

        entitlement = EntitlementService.explain(company: @company, feature: 'advanced_analytics')
        unless entitlement[:allowed]
          return render json: {
            status: 'locked',
            error: { code: 'RANKING_UPGRADE_REQUIRED', request_id: request.request_id },
            categories: [], states: [], sectors: [], cities: [], selected_state: nil
          }, status: :ok
        end

        render json: ::CompanyDashboard::RankingFilterOptionsService.call(company: @company, state: params[:state])
      end

      def ranking_payload(data)
        definition = data[:definition] || data[:transparency] || {}
        ranking = data[:ranking] || legacy_ranking_payload(data)
        history = data[:history] || { status: data[:history_status], scope: 'official', items: data[:historical_data] || [], trend_30d: data[:history_trend_30d] }
        quadrant = data[:quadrant] || {
          status: data[:quadrant_status], preview: data[:mode] == 'preview', points: data[:magic_quadrant_competitors] || [], meta: data[:quadrant_meta] || {}
        }
        {
          status: data[:status],
          mode: data[:mode],
          official_scope: data[:official_scope] || { type: definition[:scope] || 'global', category_id: nil },
          comparison_scope: data[:comparison_scope] || default_comparison_scope,
          ranking: ranking,
          official_ranking: data[:official_ranking] || ranking,
          benchmarks: data[:benchmarks] || default_benchmarks,
          history: history,
          quadrant: quadrant,
          definition: definition,
          quality: data[:quality] || { flags: [] },
          leaders: data[:leaders] || [],
          neighbors: data[:neighbors] || [],
          insights: data[:insights] || default_insights,
          score_drivers: data[:score_drivers] || default_score_drivers,
          gaps: data[:gaps] || [],
          changes: data[:changes] || default_changes,
          error: data[:error],
          request_id: request.request_id,

          # Compatibilidade do contrato anterior durante a transição vNext.
          rank_position: ranking[:position],
          ranking_score: ranking[:score],
          magic_quadrant_points: quadrant[:points],
          quadrant_meta: quadrant[:meta],
          category_rankings: data[:category_rankings] || [],
          historical_data: history[:items],
          transparency: definition,
          scope: data.dig(:official_scope, :type) || definition[:scope] || data[:scope] || 'global',
          breakdown: definition[:breakdown] || {},

          # Ranking v2: Metadados canônicos e transparência de escopo
          manifest: {
            release: '2.0.0',
            name: 'organic-performance-v2',
            parameter_digest: MethodologyManifest.organic_v2.parameter_digest
          },
          requested_scope: data[:requested_scope] || {
            state: params[:state].presence,
            city: params[:city].presence,
            category_id: params[:category_id].presence
          },
          resolved_scope: data[:resolved_scope] || {
            level: params[:city].present? ? 'city' : (params[:state].present? ? 'state' : 'country'),
            state: params[:state].presence,
            city: params[:city].presence
          },
          scope_ladder_fallback: data[:scope_ladder_fallback] || false,
          snapshot_freshness: {
            as_of: data[:as_of] || Time.now.utc.to_date.to_s,
            computed_at: data[:computed_at] || Time.now.utc.iso8601
          }
        }
      end

      def default_ranking_payload(status: 'processing', error: nil, ranking_status: nil, quadrant_status: nil, history_status: nil)
        ranking_status ||= status
        quadrant_status ||= status == 'processing' ? 'empty' : status
        history_status ||= status == 'processing' ? 'empty' : status

        {
          status: status,
          mode: 'canonical',
          error: error,
          request_id: request.request_id,
          official_scope: { type: 'global', category_id: nil },
          comparison_scope: default_comparison_scope,
          ranking: {
            status: ranking_status,
            position: nil,
            population: nil,
            population_label: 'eligible_companies',
            score: nil,
            percentile: nil
          },
          official_ranking: {
            status: ranking_status,
            position: nil,
            population: nil,
            population_label: 'eligible_companies',
            score: nil,
            percentile: nil
          },
          benchmarks: default_benchmarks,
          rank_position: nil,
          ranking_score: nil,
          magic_quadrant_points: [],
          quadrant_meta: {},
          category_rankings: [],
          historical_data: [],
          history: { status: history_status, scope: 'official', items: [], trend_30d: nil },
          quadrant: { status: quadrant_status, preview: false, points: [], meta: {} },
          leaders: [],
          neighbors: [],
          insights: default_insights,
          score_drivers: default_score_drivers,
          gaps: [],
          changes: default_changes,
          quality: { flags: quality_flags_for_status(status), computed_at: nil, data_through: nil },
          scope: 'global',
          definition: default_ranking_transparency(status),
          breakdown: {},
          transparency: default_ranking_transparency(status)
        }
      end

      def default_ranking_transparency(status)
        {
          definition_version: CompanyRankingSnapshot::DEFINITION_VERSION,
          purpose: 'organic_performance',
          sponsored_included: false,
          score_definition: 'Trust score × 10 + engajamento dos últimos 7 dias completos com decaimento exponencial.',
          tie_breaker: 'pontuação desc, confiança desc, avaliações desc, company_id asc',
          quality_flags: quality_flags_for_status(status)
        }
      end

      def legacy_ranking_payload(data)
        {
          status: data[:ranking_status],
          position: data[:current_position],
          population: data[:total_companies],
          population_label: 'eligible_companies',
          score: data[:score],
          percentile: data[:percentile]
        }
      end

      def default_comparison_scope
        { active: false, state: nil, city: nil, sector: nil, category_id: nil, criterion_slug: nil }
      end

      def default_benchmarks
        {
          status: 'empty',
          population: 0,
          minimum_population: ::CompanyDashboard::RankingBenchmarkService.min_comparable_population,
          median_score: nil,
          p75_score: nil,
          p90_score: nil,
          distribution: nil
        }
      end

      def default_insights
        { strengths: [], opportunities: [], next_best_action: nil }
      end

      def default_score_drivers
        { status: 'unavailable', source: nil, score: nil, items: [] }
      end

      def default_changes
        { status: 'insufficient_history', from: nil, to: nil, changes: {} }
      end

      def quality_flags_for_status(status)
        case status
        when 'processing' then ['snapshot_processing']
        when 'empty' then ['population_empty']
        when 'stale' then ['snapshot_stale']
        else []
        end
      end

      def log_ranking_success(payload, observability, request_id)
        duration_ms = observability[:duration_ms].to_i
        population = payload.dig(:ranking, :population).to_i
        Rails.logger.info(
          {
            event: 'company_dashboard.ranking.request',
            request_id: request_id,
            company_id: @company.id,
            mode: payload[:mode],
            state: payload.dig(:comparison_scope, :state),
            category_id: payload.dig(:comparison_scope, :category_id),
            history_days: params.fetch(:history_days, 90).to_i,
            status: payload[:status],
            population: population,
            sql_queries: observability[:sql_queries].to_i,
            duration_ms: duration_ms
          }.to_json
        )
        ::CompanyDashboard::RankingMetrics.request(
          mode: payload[:mode].to_s,
          status: payload[:status].to_s,
          duration_ms: duration_ms,
          population: population
        )
      end

      def log_ranking_error(error, request_id, duration_ms:)
        Rails.logger.error(
          {
            event: 'company_dashboard.ranking.failed',
            request_id: request_id,
            company_id: @company&.id,
            error_class: error.class.name,
            error_message: error.message,
            backtrace: error.backtrace&.first(10),
            status: 500,
            duration_ms: duration_ms
          }.to_json
        )
        ::CompanyDashboard::RankingMetrics.failure(duration_ms: duration_ms)
        Sentry.capture_exception(error, extra: { request_id: request_id, endpoint: 'analytics_ranking' }) if defined?(Sentry)
      end

      def ranking_filter_errors(category_id:, criterion_slug:, state:, city:, sector:, quadrant_mode:)
        errors = {}
        governed_parameters = %w[x_weights y_weights threshold_method minimum_population badge_weight trust_weight]
        if governed_parameters.any? { |key| params.key?(key) }
          errors[:methodology] = 'Pesos, thresholds e população mínima são governados pela plataforma.'
        end
        category = category_id.present? ? @company.categories.find_by(id: category_id) : nil

        errors[:category_id] = 'Categoria inválida.' if category_id.present? && category.nil?
        if criterion_slug.present?
          criteria = category&.effective_rating_criteria || []
          errors[:criterion_slug] = 'Critério inválido para a categoria selecionada.' unless criteria.any? { |criterion| criterion.slug == criterion_slug }
        end
        normalized_state = state.to_s.strip.upcase
        if state.present? && !::CompanyDashboard::RankingEligibilityScope.new(state: normalized_state).relation.exists?
          errors[:state] = 'UF sem empresas ativas elegíveis para comparação.'
        end
        errors[:city] = 'Cidade requer a seleção prévia de um Estado (UF).' if city.present? && state.blank?
        errors[:city] = 'Cidade deve ter no máximo 120 caracteres.' if city.to_s.length > 120
        errors[:sector] = 'Tipo de projeto inválido.' if sector.present? && !::Company::PROJECT_TYPES.include?(sector)
        if quadrant_mode.present? && !%w[default reviews].include?(quadrant_mode)
          errors[:quadrant_mode] = 'Modo de mapa inválido.'
        end

        errors
      end

      # GET /api/v1/company_dashboard/trust_health
      # Returns detailed trust score breakdown with health indicators
      def trust_health
        authorize @company, :view_analytics?
        begin
          # Get stored trust score
          trust_record = CompanyTrustScore.find_by(company_id: @company.id)

          # Calculate current score using unified service with cache
          result = Rails.cache.fetch("company_#{@company.id}_trust_health_score_calc", expires_in: 1.hour) do
            TrustScore::CalculationService.new(@company).calculate!
          end

          # Determine health status based on score
          health_status = case result[:score]
                          when 0..30 then 'critical'
                          when 31..50 then 'poor'
                          when 51..70 then 'fair'
                          when 71..85 then 'good'
                          else 'excellent'
                          end

          # Calculate trend (would need historical data for real trend)
          score_trend = if trust_record&.computed_at
                          days_since = (Time.current - trust_record.computed_at).to_i / 1.day
                          if days_since < 7 then 'up'
                          elsif days_since < 30 then 'stable'
                          else 'stale'
                          end
                        else
                          'new'
                        end

          render json: {
            trust_score: result[:score],
            health_status: health_status,
            score_trend: score_trend,
            components: result[:components],
            computed_at: trust_record&.computed_at&.iso8601,
            verified: @company.verified?,
            last_recalculated_at: trust_record&.computed_at&.iso8601,
            recommendations: generate_trust_recommendations(result[:components], @company)
          }
        rescue StandardError => e
          log_analytics_error('trust_health', e)
          render json: { trust_score: 0, health_status: 'unknown', components: {}, recommendations: [] }
        end
      end

      # GET /api/v1/company_dashboard/intent_summary
      # Returns buyer intent score summary and top leads
      def intent_summary
        authorize @company, :view_analytics?

        begin
          unless defined?(IntentScore) && IntentScore.table_exists?
            return render json: {
              total_signals: 0,
              intent_distribution: {},
              top_leads: [],
              message: 'Intent tracking not enabled'
            }
          end

          selectable_columns = %i[
            id
            company_id
            lead_id
            total_score
            intent_level
            confidence_score
            total_signals_count
            recommended_action
            last_interaction_at
            updated_at
            top_signals
          ].select { |column| IntentScore.column_names.include?(column.to_s) }

          # ✅ EAGER LOAD tudo que será usado - 1 query intent_scores + 1 query leads
          intent_scores = IntentScore
                          .where(company_id: @company.id)
                          .select(*selectable_columns)
                          .includes(:lead_record)
                          .order(total_score: :desc)
                          .limit(10)
                          .to_a

          total_signals = intent_scores.sum { |score| score.total_signals_count.to_i }
          avg_confidence = if intent_scores.any?
                             (intent_scores.sum { |score| score.confidence_score.to_f } / intent_scores.size).round(2)
                           else
                             0.0
                           end

          top_leads = intent_scores.map do |score|
            lead = score.lead_record
            {
              id: score.id,
              lead_id: score.lead_id,
              name: lead&.name || "Prospecto ##{score.lead_id}",
              email: lead&.email,
              phone: lead&.phone,
              city: lead&.city,
              state: lead&.state,
              message: lead&.message,
              product_vertical: lead&.product_vertical,
              total_score: score.total_score,
              intent_level: score.intent_level,
              recommended_action: score.recommended_action,
              sla_window: score.sla_window,
              last_interaction_at: score.last_interaction_at&.iso8601,
              signals_count: score.total_signals_count,
              technical_profile: {
                monthly_kwh: lead&.monthly_kwh,
                bill_value: lead&.bill_value,
                system_size: lead&.system_size_band,
                decision_timeline: lead&.decision_timeline,
                estimated_budget: lead&.estimated_budget,
                project_profile: lead&.project_profile,
                product_vertical: lead&.product_vertical
              },
              marketing_data: {
                utm_source: lead&.utm_source,
                utm_medium: lead&.utm_medium,
                utm_campaign: lead&.utm_campaign,
                landing_path: lead&.landing_path,
                referrer: lead&.referrer_host
              },
              confidence_score: score.confidence_score,
              top_signals: score.has_attribute?(:top_signals) ? (score.top_signals || []) : []
            }
          end

          render json: {
            total_signals: total_signals,
            avg_confidence: avg_confidence,
            intent_distribution: {
              cold: intent_scores.count { |s| s.intent_level == 'cold' },
              warm: intent_scores.count { |s| s.intent_level == 'warm' },
              hot: intent_scores.count { |s| s.intent_level == 'hot' },
              boiling: intent_scores.count { |s| s.intent_level == 'boiling' },
              immediate: intent_scores.count { |s| s.intent_level == 'immediate' },
              declared: intent_scores.count { |s| s.intent_level == 'declared' }
            },
            top_leads: top_leads,
            last_updated: intent_scores.max_by(&:updated_at)&.updated_at&.iso8601
          }
        rescue StandardError => e
          log_analytics_error('intent_summary', e)
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end

      # GET /api/v1/company_dashboard/certification_progress
      # Returns badge/certification progress and pending verifications
      def certification_progress
        authorize @company, :view_analytics?
        badges = @company.badges.active.order(position: :asc, id: :asc)
        all_active_badges = Badge.active.order(position: :asc, id: :asc)
        company_badges_by_id = @company.company_badges.index_by(&:badge_id)

        # Current earned badges
        earned_badges = badges.map do |badge|
          company_badge = company_badges_by_id[badge.id]
          {
            id: badge.id,
            name: badge.name,
            description: badge.description,
            category: badge.category_label,
            year: badge.year,
            edition: badge.edition,
            public_slug: badge.public_slug,
            image_url: badge.image_url,
            verification_url: badge.verification_url,
            earned_at: company_badge&.created_at&.iso8601
          }
        end

        # Available badges not yet earned
        available_badges = all_active_badges.where.not(id: badges.ids).map do |badge|
          {
            id: badge.id,
            name: badge.name,
            description: badge.description,
            category: badge.category_label,
            year: badge.year,
            edition: badge.edition,
            image_url: badge.image_url
          }
        end

        # Company-level verification status
        is_verified = @company.business_verification_status == 'verified' || @company.verified?
        pending_verifications = is_verified ? 0 : 1

        render json: {
          earned_badges: earned_badges,
          available_badges: available_badges,
          total_badges: all_active_badges.count,
          earned_count: earned_badges.count,
          pending_verifications: pending_verifications,
          verification_progress: calculate_verification_progress(earned_badges, all_active_badges)
        }, status: :ok
      rescue StandardError => e
        log_analytics_error('certification_progress', e)
        render json: {
          error: 'certification_progress_error',
          message: 'Não foi possível carregar o progresso de certificação',
          details: Rails.env.development? ? e.message : nil
        }, status: :internal_server_error
      end

      # GET /api/v1/company_dashboard/assets
      def assets
        base_url = ENV['APP_HOST'] || 'https://avaliasolar.com.br'
        profile_url = "#{base_url}/empresas/#{@company.slug}"
        badge_svg_url = "#{base_url}/api/v1/badges/#{@company.slug}.svg"
        utm_params = 'utm_source=badge&utm_medium=referral&utm_campaign=trust_badge'

        render json: {
          public_profile_url: profile_url,
          logo_url: @company.logo&.url,
          banner_url: @company.banner&.url,
          badge_url: badge_svg_url,
          badge_embed_code: "<a href=\"#{profile_url}?#{utm_params}\"><img src=\"#{badge_svg_url}\" alt=\"Selo AvaliaSolar\" /></a>",
          utm_ready_link: "#{profile_url}?#{utm_params}"
        }
      end

      # GET /api/v1/company_dashboard/subscription
      def subscription
        subscription_data = ::EntitlementService.call(company: @company)
        render json: subscription_data, status: :ok
      rescue StandardError => e
        Rails.logger.error("[CompanyDashboard#subscription] #{e.class}: #{e.message}")
        render json: { error: 'Internal server error' }, status: :internal_server_error
      end

      # GET /api/v1/company_dashboard/stats
      def stats
        stats_service = ::CompanyDashboard::StatsService.new(@company)
        health_data = ::CompanyHealthService.call(@company)
        next_best_actions = ::NextBestActionService.call(@company)

        render json: {
          stats: stats_service.call,
          plan_features: @company.effective_plan_features || {},
          feature_access: @company.feature_access || {},
          health: health_data,
          next_best_actions: next_best_actions
        }, status: :ok
      rescue StandardError => e
        Rails.logger.error(
          "[CompanyDashboard#stats] #{e.class}: #{e.message} " \
          "company_id=#{@company&.id} user_id=#{current_user&.id}"
        )
        Rails.logger.error("[CompanyDashboard#stats] backtrace=#{e.backtrace&.first(5)&.join(' | ')}")
        render json: {
          stats: ::CompanyDashboard::StatsService.new(nil).call,
          plan_features: {},
          feature_access: {},
          health: ::CompanyHealthService.call(nil),
          next_best_actions: []
        }, status: :ok
      end

      # GET /api/v1/company_dashboard/banner_subscriptions
      def banner_subscriptions
        subs = @company.banner_subscriptions.includes(:banner_offer).order(created_at: :desc)
        render json: {
          subscriptions: subs.as_json(include: { banner_offer: { only: %i[id name price_cents currency duration_days
                                                                          rules_json active] } })
        }
      end

      # POST /api/v1/company_dashboard/banner_checkout
      def banner_checkout
        offer = BannerOffer.find(params[:offer_id])

        # Generate a unique reference for the payment provider
        checkout_session_id = "PAY-#{SecureRandom.hex(8).upcase}"

        sub = @company.banner_subscriptions.create!(
          banner_offer: offer,
          status: 'pending_payment',
          provider: params[:provider] || 'stripe',
          checkout_session_id: checkout_session_id
        )

        # Generate Real Redirect URL
        checkout_service = Payment::CheckoutService.new(sub)
        redirect_url = checkout_service.create_checkout_session(sub.provider)

        render json: {
          subscription: sub.as_json(only: %i[id status provider checkout_session_id created_at]),
          redirect_url: redirect_url
        }, status: :created
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'offer_not_found' }, status: :not_found
      end

      # POST /api/v1/company_dashboard/banner_addon_checkout
      def banner_addon_checkout
        authorize @company, :update_banner?, policy_class: CompanyDashboardPolicy
        unless @company.feature_enabled?('promo_banner')
          return render json: { error: 'plan_upgrade_required', feature: 'promo_banner' }, status: :forbidden
        end

        idempotency_key = request.headers['Idempotency-Key'].to_s.strip
        if idempotency_key.blank?
          return render json: { error: 'idempotency_key_required' }, status: :unprocessable_entity
        end
        if idempotency_key.bytesize > 255
          return render json: { error: 'idempotency_key_too_long' }, status: :unprocessable_entity
        end

        existing_sub = BannerAddonSubscription.find_by(company: @company, idempotency_key: idempotency_key)
        if existing_sub
          same_request = existing_sub.banner_id == params[:banner_id].to_i &&
                         existing_sub.banner_addon_id == params[:addon_id].to_i
          unless same_request
            return render json: { error: 'idempotency_key_conflict' }, status: :conflict
          end

          return render_addon_checkout(existing_sub, :ok)
        end

        payment_provider = params[:provider].presence || 'stripe'
        unless %w[stripe mercadopago].include?(payment_provider)
          return render json: { error: 'unsupported_payment_provider' }, status: :unprocessable_entity
        end

        addon = BannerAddon.find(params[:addon_id])
        banner = @company.banners.find(params[:banner_id])

        # Validate eligibility
        eligibility = BannerAddons::EligibilityService.new(
          company: @company,
          banner: banner,
          addon: addon
        ).call

        unless eligibility[:eligible]
          return render json: { error: eligibility[:error] }, status: :unprocessable_entity
        end

        checkout_session_id = "PAY-#{SecureRandom.hex(8).upcase}"

        sub = BannerAddonSubscription.transaction do
          subscription = BannerAddonSubscription.create!(
            company: @company,
            banner: banner,
            banner_addon: addon,
            status: 'pending_payment',
            payment_provider: payment_provider,
            checkout_session_id: checkout_session_id,
            idempotency_key: idempotency_key,
            price_paid_cents: eligibility[:effective_price_cents],
            discount_cents: [addon.price_cents - eligibility[:effective_price_cents], 0].max,
            addon_snapshot: {
              'rules' => addon.rules,
              'benefits' => addon.benefits,
              'price_cents' => addon.price_cents,
              'effective_price_cents' => eligibility[:effective_price_cents],
              'currency' => addon.currency
            }
          )

          checkout_url = Payment::CheckoutService.new(subscription)
                                                        .create_checkout_session(subscription.payment_provider)
          subscription.update!(checkout_url: checkout_url)
          subscription
        end

        render_addon_checkout(sub, :created)
      rescue ActiveRecord::RecordNotUnique
        existing_sub = BannerAddonSubscription.find_by!(company: @company, idempotency_key: idempotency_key)
        render_addon_checkout(existing_sub, :ok)
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'resource_not_found' }, status: :not_found
      end


      # POST /api/v1/company_dashboard/update_info
      def update_info
        authorize @company, :edit_company?
        if current_user&.role == 'admin'
          if @company.update(company_params)
            return render json: { message: 'Alterações aplicadas com sucesso' }, status: :ok
          end

          return render json: { errors: @company.errors }, status: :unprocessable_entity
        end

        permitted_company_params = company_params
        service_area_changed = service_area_change_requested?(permitted_company_params)
        service_area_limit = service_area_changed ? CompanyServiceAreaLimitService.new(@company).snapshot(attributes: permitted_company_params.to_h) : nil
        exceeds_service_limit = service_area_limit.present? && service_area_limit[:exceeds_limit]

        policy = CompanyFieldPolicy.new(@company)
        direct_update_params = {}
        pending_params = {}

        permitted_company_params.to_h.each do |key, value|
          current_value = @company.respond_to?(key) ? @company.send(key) : nil
          is_changed = false
          if value.present? || current_value.present?
            is_changed = case value
                         when Array
                           current_value.to_a.map(&:to_s) != value.map(&:to_s)
                         else
                           current_value.to_s != value.to_s
                         end
          end

          if is_changed
            field_decision = policy.decision(key, exceeds_limit: exceeds_service_limit)
            if field_decision[:direct_update]
              direct_update_params[key] = value
            else
              pending_params[key] = value
            end
          end
        end

        if pending_params.present?
          @company.update!(direct_update_params) if direct_update_params.present?

          pending_change = create_idempotent_pending_change(
            change_type: 'company_info',
            data: {
              attributes: pending_params,
              previous_values: @company.attributes.slice(*pending_params.keys),
              service_area_limit: service_area_limit,
              requires_commercial_approval: true,
              limit_exceeded: exceeds_service_limit
            }
          )

          notify_service_area_change_request(pending_change, service_area_limit) if service_area_changed && !pending_change.previously_persisted?

          Analytics::TrackEventService.call(
            company_id: @company.id,
            event_type: 'dashboard_update_requested',
            user: current_user,
            metadata: request_metadata.merge(
              change_type: 'company_info',
              service_area_limit: service_area_limit,
              requires_commercial_approval: true,
              limit_exceeded: exceeds_service_limit,
              pending_change_id: pending_change.id
            )
          )

          render json: {
            message: 'Alterações enviadas para aprovação.',
            pending_change: pending_change,
            service_area_limit: service_area_limit,
            requires_commercial_approval: true,
            limit_exceeded: exceeds_service_limit,
            reason_code: exceeds_service_limit ? 'LIMIT_EXCEEDED' : nil,
            direct_update: false
          }.compact, status: pending_change.previously_persisted? ? :ok : :created
        else
          @company.update!(permitted_company_params)

          Analytics::TrackEventService.call(
            company_id: @company.id,
            event_type: 'dashboard_updated_directly',
            user: current_user,
            metadata: request_metadata.merge(change_type: 'company_info')
          )

          render json: {
            message: 'Alterações aplicadas com sucesso',
            direct_update: true
          }, status: :ok
        end
      end

      # POST /api/v1/company_dashboard/add_categories
      def add_categories
        authorize @company, :edit_categories?

        category_ids = normalized_category_ids(params[:category_ids])
        limit_snapshot = CompanyCategoryLimitService.new(@company).snapshot(requested_category_ids: category_ids)

        policy = CompanyFieldPolicy.new(@company)
        decision = policy.decision(:categories, exceeds_limit: limit_snapshot[:exceeds_limit])

        unless decision[:direct_update]
          pending_change = create_idempotent_pending_change(
            change_type: 'categories',
            data: {
              action: 'add',
              category_ids: category_ids,
              category_limit: limit_snapshot,
              requires_commercial_approval: true,
              limit_exceeded: true
            }
          )

          notify_category_change_request(pending_change, limit_snapshot, action: 'add') unless pending_change.previously_persisted?

          Analytics::TrackEventService.call(
            company_id: @company.id,
            event_type: 'dashboard_update_requested',
            user: current_user,
            metadata: request_metadata.merge(
              change_type: 'categories',
              action: 'add',
              category_ids: category_ids,
              category_limit: limit_snapshot,
              requires_commercial_approval: true,
              limit_exceeded: true,
              pending_change_id: pending_change.id
            )
          )

          render json: {
            message: 'Solicitação enviada para aprovação comercial',
            pending_change: pending_change,
            category_limit: limit_snapshot,
            requires_commercial_approval: true,
            limit_exceeded: true,
            reason_code: 'LIMIT_EXCEEDED',
            direct_update: false
          }, status: pending_change.previously_persisted? ? :ok : :created
        else
          # Direct update within limit
          @company.category_ids = (@company.category_ids + category_ids).uniq

          Analytics::TrackEventService.call(
            company_id: @company.id,
            event_type: 'dashboard_updated_directly',
            user: current_user,
            metadata: request_metadata.merge(change_type: 'categories', action: 'add')
          )

          render json: {
            message: 'Categorias atualizadas com sucesso',
            direct_update: true
          }, status: :ok
        end
      end

      # POST /api/v1/company_dashboard/remove_category
      def remove_category
        authorize @company, :edit_categories?

        category_ids = normalized_category_ids(params[:category_id])

        @company.category_ids = (@company.category_ids - category_ids)

        Analytics::TrackEventService.call(
          company_id: @company.id,
          event_type: 'dashboard_updated_directly',
          user: current_user,
          metadata: request_metadata.merge(change_type: 'categories', action: 'remove')
        )

        render json: {
          message: 'Categoria removida com sucesso',
          direct_update: true
        }, status: :ok
      end

      # POST /api/v1/company_dashboard/update_ctas
      def update_ctas
        authorize @company, :edit_company?

        pending_change = create_idempotent_pending_change(
          change_type: 'cta_config',
          data: cta_params
        )

        render json: {
          message: 'Configurações de CTAs enviadas para aprovação',
          pending_change: pending_change
        }, status: pending_change.previously_persisted? ? :ok : :created
      end

      # POST /api/v1/company_dashboard/update_logo
      def update_logo
        authorize @company, :edit_company?
        file = params[:file]
        return render json: { error: 'Arquivo ausente' }, status: :unprocessable_entity if file.blank?

        unless %w[image/png image/jpeg].include?(file.content_type)
          return render json: { error: 'Formato inválido. Use PNG ou JPG' }, status: :unprocessable_entity
        end
        if file.size.to_i > 2.megabytes
          return render json: { error: 'Logo acima de 2MB' }, status: :unprocessable_entity
        end

        blob = ActiveStorage::Blob.create_and_upload!(io: file, filename: file.original_filename,
                                                      content_type: file.content_type)

        policy = CompanyFieldPolicy.new(@company)
        decision = policy.decision(:logo)

        if decision[:direct_update]
          @company.logo.attach(blob)

          Analytics::TrackEventService.call(
            company_id: @company.id,
            event_type: 'dashboard_updated_directly',
            user: current_user,
            metadata: request_metadata.merge(change_type: 'logo')
          )

          render json: {
            message: 'Logo atualizada com sucesso',
            direct_update: true,
            logo_url: generate_blob_url(@company.logo)
          }, status: :ok
        else
          pending_change = create_idempotent_pending_change(
            change_type: 'logo',
            data: { signed_id: blob.signed_id }
          )

          Analytics::TrackEventService.call(
            company_id: @company.id,
            event_type: 'dashboard_update_requested',
            user: current_user,
            metadata: request_metadata.merge(
              change_type: 'logo',
              pending_change_id: pending_change.id
            )
          )

          render json: {
            message: 'Logo enviada para aprovação',
            pending_change: pending_change,
            direct_update: false
          }, status: pending_change.previously_persisted? ? :ok : :created
        end
      end

      # POST /api/v1/company_dashboard/update_banner
      def update_banner
        authorize @company, :edit_company?
        file = params[:file]
        return render json: { error: 'Arquivo ausente' }, status: :unprocessable_entity if file.blank?

        unless %w[image/png image/jpeg].include?(file.content_type)
          return render json: { error: 'Formato inválido. Use PNG ou JPG' }, status: :unprocessable_entity
        end
        if file.size.to_i > 5.megabytes
          return render json: { error: 'Banner acima de 5MB' }, status: :unprocessable_entity
        end

        blob = ActiveStorage::Blob.create_and_upload!(io: file, filename: file.original_filename,
                                                      content_type: file.content_type)
        begin
          blob.analyze
          meta = blob.metadata || {}
          w = meta['width']
          h = meta['height']
          if w && h && (w < 1920 || h < 600)
            return render json: { error: 'Dimensões mínimas recomendadas: 1920x600px' }, status: :unprocessable_entity
          end
        rescue StandardError => e
          Rails.logger.warn "Falha ao analisar dimensões do banner: #{e.message}"
        end

        policy = CompanyFieldPolicy.new(@company)
        decision = policy.decision(:banner)

        if decision[:direct_update]
          @company.banner.attach(blob)

          Analytics::TrackEventService.call(
            company_id: @company.id,
            event_type: 'dashboard_updated_directly',
            user: current_user,
            metadata: request_metadata.merge(change_type: 'banner')
          )

          render json: {
            message: 'Banner atualizado com sucesso',
            direct_update: true,
            banner_url: generate_blob_url(@company.banner)
          }, status: :ok
        else
          pending_change = create_idempotent_pending_change(
            change_type: 'banner',
            data: { signed_id: blob.signed_id }
          )

          Analytics::TrackEventService.call(
            company_id: @company.id,
            event_type: 'dashboard_update_requested',
            user: current_user,
            metadata: request_metadata.merge(
              change_type: 'banner',
              pending_change_id: pending_change.id
            )
          )

          render json: {
            message: 'Banner enviado para aprovação',
            pending_change: pending_change,
            direct_update: false
          }, status: pending_change.previously_persisted? ? :ok : :created
        end
      end

      # GET /api/v1/company_dashboard/pending_changes
      def pending_changes
        changes = @company.pending_changes.pending.order(created_at: :desc)
        changes_json = changes.map do |change|
          change_hash = change.as_json(include: { user: { only: %i[id name email] } })
          if change.change_type == 'media' && change.data['signed_ids'].present?
            urls = change.data['signed_ids'].map do |sid|
              blob = ActiveStorage::Blob.find_signed(sid)
              generate_blob_url(blob) if blob
            end.compact
            change_hash['data'] = change.data.merge('urls' => urls)
          elsif %w[logo banner].include?(change.change_type) && change.data['signed_id'].present?
            blob = ActiveStorage::Blob.find_signed(change.data['signed_id'])
            url = blob ? generate_blob_url(blob) : nil
            change_hash['data'] = change.data.merge('url' => url)
          end
          change_hash
        end
        render json: { pending_changes: changes_json }
      end

      # GET /api/v1/company_dashboard/notifications
      def notifications
        # Fetch notifications for the company
        notifications = []

        # Approved changes
        if @company&.pending_changes.respond_to?(:approved)
          @company.pending_changes.approved.where('approved_at > ?', 7.days.ago).each do |change|
            notifications << {
              type: 'approval',
              title: 'Alteração Aprovada',
              message: "Sua alteração de #{change.change_type.humanize} foi aprovada",
              timestamp: change.approved_at,
              read: false
            }
          end
        end

        # New reviews
        @company&.reviews&.where('created_at > ?', 7.days.ago)&.each do |review|
          notifications << {
            type: 'review',
            title: 'Nova Avaliação',
            message: "Nova avaliação de #{review.rating} estrelas recebida",
            timestamp: review.created_at,
            read: false
          }
        end

        # New leads
        @company&.leads&.where('created_at > ?', 7.days.ago)&.each do |lead|
          notifications << {
            type: 'lead',
            title: 'Novo Lead',
            message: "Novo contato de #{lead.name}",
            timestamp: lead.created_at,
            read: false
          }
        end

        render json: {
          notifications: notifications.sort_by { |n| n[:timestamp] }.reverse.first(20)
        }
      rescue StandardError => e
        Rails.logger.error(
          "[CompanyDashboard#notifications] #{e.class}: #{e.message} " \
          "company_id=#{@company&.id} user_id=#{current_user&.id}"
        )
        Rails.logger.error("[CompanyDashboard#notifications] backtrace=#{e.backtrace&.first(5)&.join(' | ')}")
        render json: { notifications: [] }, status: :ok
      end

      # GET /api/v1/company_dashboard/media
      def media
        render json: { photos: @company.media_urls }
      end

      # GET /api/v1/company_dashboard/videos
      def videos
        videos = @company.published_videos.map do |v|
          { id: v.id, url: v.url, thumbnail_url: v.thumbnail_url, provider: v.provider, video_id: v.video_id }
        end
        render json: { videos: videos }
      end

      # POST /api/v1/company_dashboard/upload_media
      def upload_media
        authorize @company, :upload_media?
        unless current_user&.admin? || current_user&.role == 'company'
          return render json: { error: 'Unauthorized' }, status: :unauthorized
        end

        unless media_upload_permitted?
          return render json: { error: 'Plano necessário para upload de mídia' }, status: :forbidden
        end

        images = params[:images]
        return render json: { error: 'Nenhum arquivo enviado' }, status: :unprocessable_entity if images.blank?

        # Multipart temporary-file metadata is not stable enough to generate a
        # safe retry key. Check an explicit Idempotency-Key before uploading
        # blobs so a client retry cannot leave duplicate unattached blobs.
        if (existing = existing_idempotent_pending_change)
          return render json: {
            message: 'Mídia já enviada para aprovação',
            pending_change: mark_as_previously_persisted!(existing)
          }, status: :ok
        end

        signed_ids = []
        Array(images).each do |io|
          if io.size > 3.megabytes
            purge_unattached_media_blobs(signed_ids)
            return render json: { error: 'Arquivo muito grande. Limite de 3MB excedido.' }, status: :unprocessable_entity
          end

          blob = ActiveStorage::Blob.create_and_upload!(io: io, filename: io.original_filename,
                                                        content_type: io.content_type)
          signed_ids << blob.signed_id
        rescue StandardError => e
          Rails.logger.error "Erro ao criar blob: #{e.message}"
        end

        if signed_ids.empty?
          purge_unattached_media_blobs(signed_ids)
          return render json: { error: 'Falha ao processar arquivos' }, status: :unprocessable_entity
        end

        pending_change = create_idempotent_pending_change(
          change_type: 'media',
          data: { signed_ids: signed_ids }
        )

        # A concurrent request can pass the first lookup, upload its blobs and
        # then lose the unique-key race. In that case it must return the
        # original pending change without leaving its newly uploaded blobs
        # orphaned in storage.
        purge_unattached_media_blobs(signed_ids) if pending_change.previously_persisted?

        render json: {
          message: pending_change.previously_persisted? ? 'Mídia já enviada para aprovação' : 'Mídia enviada para aprovação',
          pending_change: pending_change
        }, status: pending_change.previously_persisted? ? :ok : :created
      rescue StandardError
        purge_unattached_media_blobs(signed_ids || [])
        raise
      end

      # POST /api/v1/company_dashboard/add_video
      def add_video
        authorize @company, :upload_media?
        unless current_user&.admin? || current_user&.role == 'company'
          return render json: { error: 'Unauthorized' }, status: :unauthorized
        end
        unless media_upload_permitted?
          return render json: { error: 'Plano necessário para adicionar vídeo' }, status: :forbidden
        end

        url = params[:url].to_s
        result = Videos::YoutubeExtractor.extract(url)
        return render json: { error: result[:error] }, status: :unprocessable_entity unless result[:valid]

        pending_change = create_idempotent_pending_change(
          change_type: 'video',
          data: {
            url: url,
            provider: result[:provider],
            video_id: result[:video_id],
            thumbnail_url: result[:thumbnail_url],
            action: 'add'
          }
        )

        render json: {
          message: pending_change.previously_persisted? ? 'Vídeo já enviado para aprovação' : 'Vídeo enviado para aprovação',
          pending_change: pending_change
        }, status: pending_change.previously_persisted? ? :ok : :created
      end

      # DELETE /api/v1/company_dashboard/remove_video
      def remove_video
        authorize @company, :upload_media?
        unless current_user&.admin? || current_user&.role == 'company'
          return render json: { error: 'Unauthorized' }, status: :unauthorized
        end
        unless media_upload_permitted?
          return render json: { error: 'Plano necessário para gerenciar vídeos' }, status: :forbidden
        end

        vid = params[:video_id].to_s.presence || params[:id].to_s
        return render json: { error: 'Parâmetro video_id ausente' }, status: :unprocessable_entity if vid.blank?

        pending_change = create_idempotent_pending_change(
          change_type: 'video',
          data: { video_id: vid, action: 'remove' }
        )

        render json: {
          message: 'Remoção de vídeo enviada para aprovação',
          pending_change: pending_change
        }, status: pending_change.previously_persisted? ? :ok : :created
      end

      # GET /api/v1/company_dashboard/social_proof_reviews
      def social_proof_reviews
        authorize @company, :edit_reviews?

        begin
          # ✅ Eager load user para não ter N+1 + select para limitar colunas
          reviews = @company.reviews
                            .select(
                              :id, :rating, :comment, :headline, :status, :featured, :display_order,
                              :verified, :verification_status, :created_at, :reply, :replied_at,
                              :reply_deleted_at, :helpful_count, :capture_flow_source, :sentiment, :nps_score,
                              :metadata, :user_id, :company_id
                            )
                            .includes(:user)
                            .order(created_at: :desc)

          feature_permission = current_user&.admin? || (@company.respond_to?(:can_use_social_proof?) && @company.can_use_social_proof?)

          render json: {
            reviews: reviews.map do |review|
              {
                id: review.id,
                rating: review.rating.to_f,
                comment: review.comment.to_s,
                headline: review.headline.to_s,
                status: review.status,
                featured: review.featured,
                display_order: review.display_order,
                verified: review.verified,
                verification_status: review.verification_status,
                created_at: review.created_at,
                reply: review.active_reply,
                replied_at: review.active_replied_at,
                reply_status: review.reply_active? ? 'answered' : 'unanswered',
                helpful_count: review.helpful_count.to_i,
                capture_flow_source: review.capture_flow_source,
                sentiment: review.sentiment,
                nps_score: review.nps_score,
                user_name: review.public_reviewer_name
              }
            end,
            permissions: social_proof_permissions(feature_permission),
            data_status: 'complete'
          }, status: :ok
        rescue StandardError => e
          log_analytics_error('social_proof_reviews', e)
          render json: {
            reviews: [],
            permissions: social_proof_permissions(false),
            data_status: 'degraded',
            error: 'review_list_unavailable'
          }, status: :ok
        end
      end

      # GET /api/v1/company_dashboard/social_proof_reviews/:id
      def social_proof_review
        authorize @company, :edit_reviews?
        review = company_review_scope.find(params[:id])

        render json: {
          review: review_detail_payload(review),
          permissions: review_operation_permissions,
          data_status: 'complete'
        }
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Review not found for this company' }, status: :not_found
      end

      # POST /api/v1/company_dashboard/social_proof_reviews/:id/reply
      def create_review_reply
        mutate_review_reply(:create!)
      end

      # PATCH /api/v1/company_dashboard/social_proof_reviews/:id/reply
      def update_review_reply
        mutate_review_reply(:update!)
      end

      # DELETE /api/v1/company_dashboard/social_proof_reviews/:id/reply
      def delete_review_reply
        mutate_review_reply(:discard!)
      end

      # PATCH /api/v1/company_dashboard/social_proof_reviews/:id/moderation
      def update_review_moderation
        return render json: { error: 'Forbidden' }, status: :forbidden unless current_user&.admin?

        authorize @company, :edit_reviews?
        review = company_review_scope.find(params[:id])
        Reviews::WorkflowService.new(review: review, actor: current_user).moderate!(
          status: params[:status],
          notes: params[:notes]
        )
        render json: { review: review_detail_payload(review.reload) }
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Review not found for this company' }, status: :not_found
      rescue Reviews::WorkflowService::WorkflowError, ActiveRecord::RecordInvalid => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # PATCH /api/v1/company_dashboard/social_proof_reviews/:id/verification
      def update_review_verification
        return render json: { error: 'Forbidden' }, status: :forbidden unless current_user&.admin?

        authorize @company, :edit_reviews?
        review = company_review_scope.find(params[:id])
        Reviews::WorkflowService.new(review: review, actor: current_user).verify!(
          status: params[:status],
          notes: params[:notes]
        )
        render json: { review: review_detail_payload(review.reload) }
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Review not found for this company' }, status: :not_found
      rescue Reviews::WorkflowService::WorkflowError, ActiveRecord::RecordInvalid => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      # PATCH /api/v1/company_dashboard/social_proof_reviews/:id
      def update_social_proof_review
        authorize @company, :edit_reviews?
        review = @company.reviews.find(params[:id])
        attrs = social_proof_update_params
        wants_featured = ActiveModel::Type::Boolean.new.cast(attrs[:featured])

        if attrs.key?(:featured) && wants_featured && !(current_user&.admin? || @company.can_use_social_proof?)
          return render json: { error: 'Plano pago elegivel necessario para destacar reviews' }, status: :forbidden
        end

        if review.update(attrs)
          render json: {
            review: {
              id: review.id,
              featured: review.featured,
              display_order: review.display_order,
              status: review.status
            }
          }, status: :ok
        else
          render json: { errors: review.errors.full_messages }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Review not found for this company' }, status: :not_found
      end

      # GET /api/v1/company_dashboard/social_proof_stats
      def social_proof_stats
        authorize @company, :edit_reviews?

        begin
          approved_scope = @company.reviews.approved
          approved_count = approved_scope.count
          response_count = approved_scope.where.not(reply: [nil, '']).where(reply_deleted_at: nil).count
          nps_result = nps_for(approved_scope)

          render json: {
            stats: {
              total_reviews: @company.reviews.count,
              approved_reviews: approved_count,
              pending_reviews: @company.reviews.pending.count,
              rejected_reviews: @company.reviews.rejected.count,
              in_analysis_reviews: @company.reviews.in_analysis.count,
              featured_reviews: @company.reviews.where(featured: true).count,
              verified_reviews: approved_scope.where(verified: true).count,
              average_rating: approved_scope.average(:rating).to_f.round(2),
              response_rate: percentage(response_count, approved_count),
              unanswered_reviews: [approved_count - response_count, 0].max,
              nps_score: nps_result[:score],
              nps_responses: nps_result[:responses],
              rating_distribution: rating_distribution_for(approved_scope),
              monthly_evolution: monthly_evolution_for(approved_scope),
              monthly_rating: monthly_rating_for(approved_scope),
              sentiment_distribution: sentiment_distribution_for(approved_scope),
              source_distribution: source_distribution_for(approved_scope),
              criteria_averages: criteria_averages_for(approved_scope),
              first_review_at: @company.reviews.minimum(:created_at),
              last_review_at: @company.reviews.maximum(:created_at)
            },
            data_status: 'complete'
          }, status: :ok
        rescue StandardError => e
          log_analytics_error('social_proof_stats', e)
          render json: {
            stats: default_social_proof_stats,
            data_status: 'degraded',
            error: 'review_stats_unavailable'
          }, status: :ok
        end
      end

      private

      def sanitize_csv_cell(value)
        str = value.to_s
        return str if str.blank?
        str =~ /\A[=+\-@\t\r]/ ? "'#{str}" : str
      end

      def render_addon_checkout(subscription, status)
        render json: {
          subscription: subscription.as_json(
            only: %i[id status payment_provider checkout_session_id created_at]
          ),
          redirect_url: subscription.checkout_url
        }, status: status
      end

      def generate_blob_url(blob)
        return nil if blob.blank?
        storage_options = Rails.application.config.active_storage.respond_to?(:default_url_options) ?
          Rails.application.config.active_storage.default_url_options : nil
        options = (storage_options.presence || Rails.application.routes.default_url_options).dup
        if options[:host].blank?
          fallback_origin = ENV['ACTIVE_STORAGE_HOST'].presence || ENV['APP_HOST'].presence ||
                            (Rails.env.test? ? 'http://www.example.com' : 'https://api.avaliasolar.com.br')
          fallback_uri = URI.parse(fallback_origin)
          options[:host] = fallback_uri.host || fallback_origin
          options[:protocol] ||= fallback_uri.scheme || 'https'
        end
        options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'
        Rails.application.routes.url_helpers.rails_storage_proxy_url(blob, options)
      rescue StandardError => e
        Rails.logger.error("Error generating blob URL in dashboard: #{e.message}")
        nil
      end

      def enforce_intent_summary_feature_access!
        enforce_feature_access!(:intent_scores, company: @company)
      end

      def authorize_tracking_workspace_access!
        authorize @company, :view_analytics?
      end

      def set_company
        @company =
          if current_user&.admin?
            ::Company.find_by(id: params[:company_id] || params[:id] || params.dig(:company, :id))
          else
            param_company_id = params[:company_id] || params[:id] || params.dig(:company, :id)
            if param_company_id.present? && current_user&.active_membership_for?(param_company_id)
              ::Company.find_by(id: param_company_id)
            else
              selected_company_id = cookies.signed[:active_company_id] || current_user&.company_id
              if selected_company_id.present? && current_user&.active_membership_for?(selected_company_id)
                ::Company.find_by(id: selected_company_id)
              else
                current_user&.active_member_companies&.first
              end
            end
          end

        render json: { error: 'Company not found' }, status: :not_found and return unless @company
      rescue StandardError => e
        Rails.logger.error(
          "[CompanyDashboard#set_company] #{e.class}: #{e.message} " \
          "user_id=#{current_user&.id} admin=#{current_user&.admin?} " \
          "params=#{params.to_unsafe_h.slice('company_id', 'id', 'company')}"
        )
        Rails.logger.error("[CompanyDashboard#set_company] backtrace=#{e.backtrace&.first(5)&.join(' | ')}")
        fallback_company = current_user&.active_member_companies&.first
        if fallback_company
          @company = fallback_company
        else
          render json: { error: 'Company not found' }, status: :not_found
        end
      end

      def authenticate_company_user_or_admin!
        return if current_user&.admin?

        authenticate_company_user!
      end

      def authorize_dashboard_access!
        authorize @company, :view_dashboard?
      end

      def authenticate_company_user!
        memberships = current_user&.active_member_companies
        has_membership = memberships.present? && memberships.any?
        fallback_company = current_user&.company

        unless has_membership || fallback_company.present?
          return render json: { error: 'Unauthorized' }, status: :unauthorized
        end

        return render json: { error: 'Access pending approval' }, status: :forbidden unless current_user&.active?

        return unless !has_membership && company_active?(fallback_company)

        current_user.company_members.find_or_create_by!(
          company: fallback_company
        ) do |member|
          member.status = 'active'
          member.role = 'owner'
        end
      end

      def generate_trust_recommendations(components, company)
        recommendations = []

        # Verification recommendation
        unless company.verified?
          recommendations << {
            type: 'verification',
            message: 'Complete company verification to gain +20 trust points',
            impact: 20,
            action_url: '/dashboard/settings/verification'
          }
        end

        # Reviews recommendation
        if components['reviews'].to_i < 5
          recommendations << {
            type: 'reviews',
            message: 'Encourage more customer reviews to improve trust',
            impact: (10 - components['reviews'].to_i).round(1),
            action_url: '/dashboard/reviews/invite'
          }
        end

        # Rating recommendation
        if company.rating_avg.to_f < 4.0
          recommendations << {
            type: 'rating',
            message: 'Improve average rating to boost trust score',
            impact: ((company.rating_avg.to_f / 5.0) * 20).round(1),
            action_url: '/dashboard/reviews'
          }
        end

        recommendations
      end

      def calculate_verification_progress(earned_badges, all_badges)
        return 0 if all_badges.none?

        (earned_badges.count.to_f / all_badges.count * 100).round(1)
      end

      def media_upload_permitted?
        return true if current_user&.admin?
        return false unless @company

        @company.media_upload_allowed?
      end

      def purge_unattached_media_blobs(signed_ids)
        Array(signed_ids).each do |signed_id|
          blob = ActiveStorage::Blob.find_signed!(signed_id)
          blob.purge if blob.attachments.none?
        rescue ActiveSupport::MessageVerifier::InvalidSignature, ActiveRecord::RecordNotFound
          next
        rescue StandardError => e
          Rails.logger.warn("[CompanyDashboard#upload_media] orphan blob cleanup failed: #{e.class}: #{e.message}")
        end
      end

      def company_params
        company_p = params.require(:company)
        array_args = {
          project_types: [],
          services_offered: [],
          equipment_brands: [],
          post_sales_capacity: [],
          coverage_states: [],
          coverage_cities: [],
          coverage_state_codes: [],
          coverage_city_names: []
        }

        scalar_args = %i[
          name description website phone phone_alt whatsapp email_public
          address state city cnpj instagram facebook linkedin working_hours
          certifications awards founded_year employees_count latitude longitude
          minimum_ticket maximum_ticket financing_options financing_availability financing_enabled
          response_time_sla response_sla_minutes languages
          installation_warranty_years warranty_years warranty_confirmed
          engineering_insurance delivered_projects_score delivered_projects_count
          post_sales_support quote_turnaround technical_visit installation_terms
          maintenance_availability after_sales_support installation_team system_monitoring
          whatsapp_enabled cta_whatsapp_enabled cta_whatsapp_template
          seo_title seo_description meta_description seo_keywords
        ]

        if company_p[:payment_methods].is_a?(Array)
          company_p.permit(*scalar_args, array_args.merge(payment_methods: []))
        else
          company_p.permit(*scalar_args, :payment_methods, array_args)
        end
      end


      def cta_params
        params.permit(
          :cta_primary_label, :cta_primary_url,
          :cta_secondary_label, :cta_secondary_url,
          :cta_whatsapp_template,
          :cta_utm_source, :cta_utm_medium, :cta_utm_campaign
        )
      end

      def social_proof_update_params
        source =
          if params[:review].present?
            params.require(:review).permit(:featured, :display_order)
          else
            params.permit(:featured, :display_order)
          end

        source.to_h.symbolize_keys
      end

      def company_review_scope
        @company.reviews.includes(
          :user,
          :category,
          :review_form,
          review_criterion_scores: :rating_criterion,
          review_audit_events: :actor,
          review_decision_logs: :admin_user
        )
      end

      def mutate_review_reply(action)
        authorize @company, :edit_reviews?
        review = company_review_scope.find(params[:id])
        service = Reviews::ReplyService.new(review: review, actor: current_user)

        action == :discard! ? service.discard! : service.public_send(action, review_reply_body)
        render json: {
          review: review_detail_payload(review.reload),
          permissions: review_operation_permissions
        }
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Review not found for this company' }, status: :not_found
      rescue Reviews::ReplyService::ReplyError, ActiveRecord::RecordInvalid => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      def review_reply_body
        params[:body].presence || params.dig(:reply, :body).presence || params.dig(:review, :reply)
      end

      def review_detail_payload(review)
        metadata = review.metadata || {}
        {
          id: review.id,
          rating: review.rating.to_f,
          headline: review.headline.to_s,
          comment: review.comment.to_s,
          pros: review.pros,
          cons: review.cons,
          buyer_tip: review.buyer_tip,
          status: review.status,
          moderation: {
            status: review.status,
            notes: review.moderation_notes,
            changed_at: review.moderated_at
          },
          verification: {
            status: review.verification_status,
            verified: review.verified,
            notes: review.verification_notes,
            changed_at: review.verified_at
          },
          reply: review.active_reply,
          replied_at: review.active_replied_at,
          reply_status: review.reply_active? ? 'answered' : 'unanswered',
          reply_deleted_at: review.reply_deleted_at,
          reviewer: {
            name: review.public_reviewer_name,
            city: metadata['city'],
            state: metadata['state']
          },
          source: {
            channel: metadata['source_channel'].presence || review.capture_flow_source,
            token: metadata['source_token'],
            review_form_id: review.review_form_id,
            review_form_name: review.review_form&.name,
            landing_path: metadata['landing_path'],
            referrer: metadata['referrer'],
            user_agent: metadata['user_agent'],
            ip_hash_present: metadata['ip_hash'].present?,
            submitted_at: metadata['submitted_at'].presence || review.created_at
          },
          nps_score: review.nps_score,
          classification_by_rating: rating_classification(review.rating),
          criteria: review_criteria_payload(review),
          form_answers: review.form_answers || {},
          helpful_count: review.helpful_count.to_i,
          featured: review.featured,
          created_at: review.created_at,
          updated_at: review.updated_at,
          audit_trail: audit_timeline_for(review)
        }
      end

      def review_criteria_payload(review)
        snapshot = review.granular_scores_snapshot
        return snapshot if snapshot.is_a?(Array) && snapshot.any?

        review.review_criterion_scores.map do |score|
          {
            title: score.title_snapshot || score.rating_criterion&.title,
            score: score.score.to_f,
            weight: score.weight_snapshot || score.rating_criterion&.weight
          }
        end
      end

      def audit_timeline_for(review)
        operational = review.review_audit_events.map do |event|
          {
            id: "audit-#{event.id}",
            event_type: event.event_type,
            actor_name: event.actor_name,
            actor_type: event.actor_type.presence || 'System',
            previous_value: event.previous_value,
            new_value: event.new_value,
            metadata: event.metadata,
            created_at: event.created_at
          }
        end
        legacy = review.review_decision_logs.map do |event|
          {
            id: "decision-#{event.id}",
            event_type: 'moderation_changed',
            actor_name: event.admin_user&.name.presence || 'Administração Avalia Solar',
            actor_type: 'AdminUser',
            previous_value: { status: event.previous_status },
            new_value: { status: event.new_status, notes: event.notes },
            metadata: { legacy: true },
            created_at: event.created_at
          }
        end

        (operational + legacy).sort_by { |event| event[:created_at] }.reverse.first(100)
      end

      def review_operation_permissions
        {
          can_reply: true,
          can_moderate: current_user&.admin? || false,
          can_verify: current_user&.admin? || false
        }
      end

      def rating_classification(rating)
        score = rating.to_f
        return 'positive' if score >= 4
        return 'neutral' if score >= 3

        'negative'
      end

      def company_active?(company)
        return false unless company
        return company.active_status? if company.respond_to?(:active_status?)

        company.status.to_s == 'active'
      end

      def rating_distribution_for(scope)
        distribution = scope.group(:rating).count
        (1..5).map do |rating|
          count = distribution.sum { |score, amount| score.to_i == rating ? amount.to_i : 0 }
          [rating, count]
        end.to_h
      end

      def monthly_evolution_for(scope)
        grouped = scope.group(Arel.sql(month_expression)).count
        grouped.sort.to_h
      end

      def monthly_rating_for(scope)
        grouped = scope.group(Arel.sql(month_expression)).average(:rating)
        grouped.sort.to_h.transform_values { |value| value.to_f.round(2) }
      end

      def sentiment_distribution_for(scope)
        grouped = scope.group(:sentiment).count
        {
          positive: grouped['positive'].to_i,
          neutral: grouped['neutral'].to_i,
          negative: grouped['negative'].to_i,
          unknown: grouped['unknown'].to_i
        }
      end

      def source_distribution_for(scope)
        scope.group(:capture_flow_source).count.each_with_object({}) do |(source, count), result|
          result[source.presence || 'unknown'] = count.to_i
        end
      end

      def nps_for(scope)
        scored = scope.where.not(nps_score: nil)
        total = scored.count
        return { score: nil, responses: 0 } if total.zero?

        promoters = scored.where(nps_score: 9..10).count
        detractors = scored.where(nps_score: 0..6).count
        {
          score: (((promoters - detractors).to_f / total) * 100).round,
          responses: total
        }
      end

      def criteria_averages_for(scope)
        scores = ReviewCriterionScore
                 .joins(:rating_criterion)
                 .where(review_id: scope.select(:id), not_applicable: false)
        title_expression = Arel.sql(
          'COALESCE(review_criterion_scores.title_snapshot, rating_criteria.title)'
        )
        averages = scores.group(title_expression).average(:score)
        counts = scores.group(title_expression).count

        averages.filter_map do |title, average|
          next if title.blank?

          {
            title: title,
            average: average.to_f.round(2),
            responses: counts[title].to_i
          }
        end.sort_by { |criterion| [-criterion[:responses], -criterion[:average]] }.first(5)
      end

      def percentage(part, total)
        return 0 if total.to_i.zero?

        ((part.to_f / total) * 100).round
      end

      def month_expression
        adapter = ActiveRecord::Base.connection.adapter_name.to_s.downcase
        if adapter.include?('sqlite')
          "strftime('%Y-%m', created_at)"
        else
          "to_char(created_at, 'YYYY-MM')"
        end
      end

      def social_proof_permissions(feature_permission)
        {
          can_feature_reviews: feature_permission,
          social_proof_enabled: @company.respond_to?(:social_proof_enabled) ? @company.social_proof_enabled : false,
          featured_limit: Review::MAX_FEATURED_PER_COMPANY,
          can_reply: true,
          can_moderate: current_user&.admin? || false,
          can_verify: current_user&.admin? || false
        }
      end

      def default_social_proof_stats
        {
          total_reviews: 0,
          approved_reviews: 0,
          pending_reviews: 0,
          rejected_reviews: 0,
          in_analysis_reviews: 0,
          featured_reviews: 0,
          verified_reviews: 0,
          average_rating: 0,
          response_rate: 0,
          unanswered_reviews: 0,
          nps_score: nil,
          nps_responses: 0,
          rating_distribution: { 5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0 },
          monthly_evolution: {},
          monthly_rating: {},
          sentiment_distribution: { positive: 0, neutral: 0, negative: 0, unknown: 0 },
          source_distribution: {},
          criteria_averages: [],
          first_review_at: nil,
          last_review_at: nil
        }
      end

      def calculate_conversion_rate
        # Now handled by CompanyDashboard::StatsService
      end

      def log_analytics_error(action, error)
        Rails.logger.error(
          "[CompanyDashboard#analytics_#{action}] #{error.class}: #{error.message} " \
          "company_id=#{@company&.id} user_id=#{current_user&.id}"
        )
        Rails.logger.error("[CompanyDashboard#analytics_#{action}] backtrace=#{error.backtrace&.first(5)&.join(' | ')}")
      end

      def render_tracking_workspace_unavailable(range)
        safe_range = range || analytics_date_range(default_days: 30)
        render json: {
          version: Analytics::TrackingTaxonomy::VERSION,
          attribution_model: attribution_model,
          status: 'unavailable',
          data_source: 'analytics_events_unavailable',
          data_status: 'unavailable',
          range: analytics_range_payload(safe_range),
          summary: nil,
          channels: [],
          campaigns: [],
          cta_matrix: [],
          landing_pages: [],
          health: { status: 'unavailable', healthy: nil, total: nil, items: [] },
          diagnostics: { components: [] },
          capabilities: {
            core: true, advanced: false, saved_links: false, export: false, conversion_tracking: 'unavailable'
          },
          policy: ::CompanyDashboard::TrackingWorkspaceService::POLICY,
          error: { code: 'TRACKING_WORKSPACE_UNAVAILABLE', request_id: request.request_id },
          is_premium_analytics: false
        }, status: :ok
      end

      def format_magic_quadrant(category_rankings)
        # Simplified format for magic quadrant - using first category
        return [] if category_rankings.empty?

        ranking = category_rankings.first
        [{
          id: @company.id,
          name: @company.name,
          completenessOfVision: ranking[:percentile],
          abilityToExecute: ranking[:position],
          isCurrentCompany: true
        }]
      end

      def normalized_category_ids(values)
        Array(values).flatten.compact.map(&:to_s).reject(&:blank?).uniq
      end

      def notify_category_change_request(pending_change, limit_snapshot, action:)
        message = limit_snapshot[:exceeds_limit] ? '*Solicitação comercial de categorias*' : '*Nova alteração de categorias*'
        color = limit_snapshot[:exceeds_limit] ? '#f59e0b' : '#2563eb'

        SlackNotificationService.notify(
          message,
          [{
            color: color,
            fields: [
              { title: 'Empresa', value: @company.name.to_s, short: true },
              { title: 'Ação', value: action.to_s, short: true },
              { title: 'Plano', value: limit_snapshot[:plan_tier].to_s, short: true },
              { title: 'Limite', value: limit_snapshot[:limit].to_s, short: true },
              { title: 'Projetado', value: limit_snapshot[:projected_count].to_s, short: true },
              { title: 'Aprovação comercial', value: limit_snapshot[:exceeds_limit] ? 'Sim' : 'Não', short: true }
            ],
            footer: "PendingChange ID: #{pending_change.id}"
          }],
          channel: :empresas
        )
      rescue StandardError => e
        Rails.logger.warn("[CompanyDashboard#notify_category_change_request] #{e.class}: #{e.message}")
      end

      def service_area_change_requested?(attributes)
        attributes.key?(:coverage_states) ||
          attributes.key?('coverage_states') ||
          attributes.key?(:coverage_cities) ||
          attributes.key?('coverage_cities') ||
          attributes.key?(:coverage_state_codes) ||
          attributes.key?('coverage_state_codes') ||
          attributes.key?(:coverage_city_names) ||
          attributes.key?('coverage_city_names')
      end

      def notify_service_area_change_request(pending_change, service_area_limit)
        return unless service_area_limit

        message = service_area_limit[:exceeds_limit] ? '*Solicitação comercial de abrangência*' : '*Alteração de abrangência*'
        color = service_area_limit[:exceeds_limit] ? '#f59e0b' : '#2563eb'

        SlackNotificationService.notify(
          message,
          [{
            color: color,
            fields: [
              { title: 'Empresa', value: @company.name.to_s, short: true },
              { title: 'Plano', value: service_area_limit[:plan_tier].to_s, short: true },
              { title: 'Estados', value: "#{service_area_limit[:projected_states_count]}/#{service_area_limit[:states_limit]}", short: true },
              { title: 'Cidades', value: "#{service_area_limit[:projected_cities_count]}/#{service_area_limit[:cities_limit]}", short: true },
              { title: 'Cobertura nacional', value: service_area_limit[:national_coverage_requested] ? 'Solicitada' : 'Não', short: true },
              { title: 'Aprovação comercial', value: service_area_limit[:exceeds_limit] ? 'Sim' : 'Não', short: true }
            ],
            footer: "PendingChange ID: #{pending_change.id}"
          }],
          channel: :empresas
        )
      rescue StandardError => e
        Rails.logger.warn("[CompanyDashboard#notify_service_area_change_request] #{e.class}: #{e.message}")
      end

      def default_overview_payload(company:, range:)
        engagement_status, engagement_payload = engagement_snapshot_for(company)
        payload = {
          views_30d: nil,
          views: nil,
          metrics: { views: nil, cta_clicks: nil, leads: nil },
          rates: { ctr: nil, profile_to_lead_conversion: nil, cta_to_lead_rate: nil },
          unique_views_30d: nil,
          unique_views: nil,
          returning_views_30d: nil,
          returning_views: nil,
          data_source: 'company_daily_stats_unavailable',
          data_status: 'unavailable',
          range: analytics_range_payload(range),
          engagement_status: engagement_status,
          engagement: engagement_payload,
          is_premium_analytics: false,
          upsell_message: 'Upgrade to Pro to unlock detailed analytics'
        }

        return payload unless premium_analytics_enabled?(company)

        payload.merge(
          cta_clicks_30d: nil,
          cta_clicks: nil,
          whatsapp_clicks_30d: nil,
          whatsapp_clicks: nil,
          email_clicks_30d: nil,
          email_clicks: nil,
          phone_clicks_30d: nil,
          phone_clicks: nil,
          website_clicks_30d: nil,
          website_clicks: nil,
          quote_clicks_30d: nil,
          quote_clicks: nil,
          leads_30d: nil,
          leads: nil,
          conversion_rate: nil,
          cta_breakdown: nil,
          is_premium_analytics: true
        )
      end

      def analytics_date_range(default_days:)
        today = Time.zone.today
        requested_preset = params[:preset].presence
        days_param = params[:days].presence
        preset = requested_preset || preset_from_days(days_param || default_days)

        if preset != 'custom' && %w[7d 30d 90d].include?(preset)
          days = preset.delete_suffix('d').to_i
          to_day = today
          from_day = to_day - (days - 1)
        else
          from_param = params[:from].presence
          to_param = params[:to].presence
          return nil if from_param.blank? || to_param.blank?

          from_day = Date.iso8601(from_param)
          to_day = Date.iso8601(to_param)
          preset = 'custom'
        end

        return nil if from_day > to_day || to_day > today || (to_day - from_day).to_i > 365

        { from_day: from_day, to_day: to_day, preset: preset }
      rescue Date::Error
        nil
      end

      def preset_from_days(days)
        case days.to_i
        when 7 then '7d'
        when 30 then '30d'
        when 90 then '90d'
        else 'custom'
        end
      end

      def analytics_range_payload(range)
        {
          from: range[:from_day].iso8601,
          to: range[:to_day].iso8601,
          preset: range[:preset] || 'custom',
          timezone: 'America/Sao_Paulo',
          label: analytics_range_label(range)
        }
      end

      def analytics_range_label(range)
        return 'Últimos 7 dias' if range[:preset] == '7d'
        return 'Últimos 30 dias' if range[:preset] == '30d'
        return 'Últimos 90 dias' if range[:preset] == '90d'

        "#{range[:from_day].strftime('%d/%m/%Y')} a #{range[:to_day].strftime('%d/%m/%Y')}"
      end

      def analytics_rate(numerator, denominator)
        return nil unless denominator.to_f.positive?

        (numerator.to_f / denominator * 100).round(2)
      end

      def analytics_rates(views:, cta_clicks:, leads:)
        {
          ctr: analytics_rate(cta_clicks, views),
          profile_to_lead_conversion: analytics_rate(leads, views),
          cta_to_lead_rate: analytics_rate(leads, cta_clicks)
        }
      end

      def attribution_model
        params[:attribution_model].to_s.in?(%w[first_touch last_touch]) ? params[:attribution_model].to_s : 'last_touch'
      end

      def attribution_limit
        [[params.fetch(:limit, 20).to_i, 1].max, 100].min
      end

      def analytics_data_status(data_source, freshness: nil)
        return 'locked' if data_source == 'feature_not_authorized'
        return 'unavailable' if data_source.to_s.end_with?('_unavailable')
        return 'stale' if data_source.to_s.include?('company_daily_stats') && freshness.to_h[:data_freshness_seconds].to_i > 36.hours

        'ready'
      end

      def premium_analytics_enabled?(company)
        company&.has_paid_plan? && FeatureGateService.can_access?(company, 'advanced_analytics')
      end

      def build_cta_breakdown(stats)
        whatsapp = stats[:whatsapp_clicks].to_i
        email = stats[:email_clicks].to_i
        phone = stats[:phone_clicks].to_i
        website = stats[:website_clicks].to_i
        quote = stats[:quote_clicks].to_i
        total = stats[:cta_clicks].to_i
        classified = whatsapp + email + phone + website + quote

        {
          whatsapp: whatsapp,
          email: email,
          phone: phone,
          website: website,
          quote: quote,
          other: [total - classified, 0].max,
          total: total
        }
      end

      def engagement_snapshot_for(company)
        return ['not_configured', nil] if company.blank? || company.ga4_property_id.blank?
        return ['unavailable', nil] if company.ga4_last_sync.blank? || company.engagement_metrics.blank?

        metrics = company.engagement_metrics.is_a?(Hash) ? company.engagement_metrics.deep_stringify_keys : {}
        payload = {
          avg_time_on_page_seconds: metrics['avg_time_on_page_seconds'] || metrics['avg_time_on_page'],
          bounce_rate_percent: metrics['bounce_rate_percent'] || metrics['bounce_rate'],
          pages_per_session: metrics['pages_per_session'],
          engagement_rate_percent: metrics['engagement_rate_percent'] || metrics['engagement_rate'],
          source: 'ga4',
          last_synced_at: company.ga4_last_sync
        }.transform_values { |value| value.is_a?(Numeric) ? value : value.presence }

        status = company.ga4_last_sync < 36.hours.ago ? 'stale' : 'ready'
        return ['unavailable', nil] if payload[:avg_time_on_page_seconds].blank? && payload[:bounce_rate_percent].blank? &&
                                       payload[:pages_per_session].blank? && payload[:engagement_rate_percent].blank?

        [status, payload]
      end

      def render_invalid_analytics_range
        render json: { error: 'Período de analytics inválido. Use datas ISO até 365 dias.', code: 'INVALID_ANALYTICS_RANGE' },
               status: :unprocessable_entity
      end
    end
  end
end
