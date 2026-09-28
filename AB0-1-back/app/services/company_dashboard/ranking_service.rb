# frozen_string_literal: true

module CompanyDashboard
  # Read side do Ranking Performance. Nunca grava snapshots, nunca recalcula o
  # ranking oficial no request e nunca lê sinal de patrocínio.
  class RankingService
    class SchemaMismatch < StandardError; end

    MAX_BADGES_SCORE = 10.0
    MAX_EXECUTION_LEADS = 100.0
    MAX_EXECUTION_VIEWS = 2_000.0
    MAX_EXECUTION_CLICKS = 300.0
    SNAPSHOT_STALE_AFTER = 36.hours
    HISTORY_FORMING_MIN_SNAPSHOTS = 7
    QUADRANT_LEADERS_LIMIT = 5
    QUADRANT_NEIGHBORS_LIMIT = 5

    attr_reader :company, :category_id, :criterion_slug, :history_days, :state, :city, :sector, :quadrant_mode, :positioning_version

    def initialize(company:, category_id: nil, criterion_slug: nil, state: nil, city: nil, sector: nil,
                   history_days: 90, quadrant_mode: nil, positioning_version: nil)
      @company = company
      @category_id = category_id.presence
      @criterion_slug = criterion_slug.to_s.strip.presence
      @state = state.to_s.strip.upcase.presence
      @city = city.to_s.strip.presence
      @sector = sector.to_s.strip.presence
      @history_days = [[history_days.to_i, 7].max, 365].min
      @quadrant_mode = quadrant_mode == 'reviews' ? 'reviews' : 'default'
      @positioning_version = positioning_version.to_s.strip.presence || Positioning::Definition::DEFAULT_VERSION
    end

    def ad_hoc_preview?
      criterion_slug.present? || state.present? || city.present? || sector.present?
    end

    def ranking_data
      ensure_schema_compatible!
      started_at = monotonic_time
      sql_queries = 0
      callback = lambda do |_name, _start, _finish, _id, payload|
        sql_queries += 1 unless payload[:name].to_s.match?(/SCHEMA|CACHE/)
      end

      result = nil
      ActiveSupport::Notifications.subscribed(callback, 'sql.active_record') do
        result = build_ranking_data
      end
      result[:observability] = {
        duration_ms: ((monotonic_time - started_at) * 1000).round,
        sql_queries: sql_queries,
        population: result.dig(:ranking, :population).to_i
      }
      result
    end

    private

    def build_ranking_data
      snapshot = latest_snapshot
      population = ranked_companies
      preview = ad_hoc_preview?
      canonical_population = preview ? canonical_population_size : population.length
      official_status = official_status_for(snapshot, canonical_population)
      ranking = preview ? preview_ranking(population) : snapshot_ranking(snapshot, official_status, canonical_population)
      history_items = historical_data
      positioning = build_positioning
      quadrant_published = snapshot.present? || preview
      quadrant = quadrant_published ? positioning : empty_positioning(positioning)
      history = history_payload(history_items)
      benchmarks = RankingBenchmarkService.new(population: population).call
      quality = quality_payload(snapshot, preview, official_status, ranking[:status])
      quality[:flags] = (quality[:flags] + positioning[:quality_flags].to_a.map { |flag| "positioning_#{flag}" }).uniq
      leaders = quadrant[:leaders]
      neighbors = quadrant[:neighbors]

      {
        status: preview ? (ranking[:status] == 'empty' ? 'empty' : 'preview') : official_status,
        mode: preview ? 'preview' : 'canonical',
        official_scope: official_scope,
        comparison_scope: comparison_scope(preview),
        ranking: ranking,
        official_ranking: snapshot_ranking(snapshot, official_status, canonical_population),
        benchmarks: benchmarks,
        history: history,
        quadrant: {
          status: quadrant[:status],
          preview: preview,
          points: quadrant[:points],
          meta: quadrant_meta(quadrant),
          methodology: { version: effective_positioning_version, threshold_method: Positioning::Definition::THRESHOLD_METHOD },
          requested_scope: quadrant[:requested_scope],
          resolved_scope: quadrant[:resolved_scope],
          fallback: { active: quadrant[:fallback] == true, reason: quadrant[:fallback_reason] },
          population: quadrant[:population_payload],
          distribution: quadrant[:distribution],
          thresholds: quadrant[:thresholds],
          axes: quadrant_meta(quadrant)[:axes]
        },
        definition: definition(snapshot, preview, official_status),
        quality: quality,
        leaders: leaders,
        neighbors: neighbors,
        insights: insights_for(ranking: ranking, benchmarks: benchmarks, official_status: official_status),
        score_drivers: score_drivers_for(snapshot: snapshot, ranking: ranking, population: population, preview: preview),
        gaps: gaps_for(population),
        changes: changes_for(history_items),
        readiness: readiness_payload,
        error: nil,

        # Compatibilidade temporária do contrato anterior.
        ranking_status: ranking[:status],
        current_position: ranking[:position],
        total_companies: ranking[:population],
        score: ranking[:score],
        percentile: ranking[:percentile],
        category_rankings: category_rankings,
        magic_quadrant_competitors: quadrant[:points],
        quadrant_meta: quadrant_meta(quadrant),
        historical_data: history_items,
        history_status: history[:status],
        history_trend_30d: history[:trend_30d],
        quadrant_status: quadrant[:status],
        transparency: definition(snapshot, preview, official_status),
        scope: official_scope[:type]
      }
    end

    def ensure_schema_compatible!
      required_company_columns = %w[
        id name rating_avg rating_count verified social_proof_enabled whatsapp_enabled
        cta_whatsapp_enabled cta_whatsapp_url whatsapp_button_style_json profile_views_count
        cta_clicks_count leads_count reviews_count
      ]
      missing = required_company_columns - Company.column_names
      missing += %w[snapshot_date] unless CompanyRankingSnapshot.column_names.include?('snapshot_date')
      missing << 'idx_ranking_snapshots_daily' unless ActiveRecord::Base.connection
        .indexes(:company_ranking_snapshots).any? { |index| index.name == 'idx_ranking_snapshots_daily' }
      return if missing.empty?

      raise SchemaMismatch, "Ranking schema incompatível; ausentes: #{missing.join(', ')}"
    rescue ActiveRecord::StatementInvalid => e
      raise SchemaMismatch, "Ranking schema incompatível: #{e.message.lines.first.to_s.strip}"
    end

    def official_scope
      { type: category_id.present? ? 'category' : 'global', category_id: category_id&.to_i }
    end

    def comparison_scope(preview)
      {
        active: preview,
        state: state,
        city: city,
        sector: sector,
        category_id: preview ? category_id&.to_i : nil,
        criterion_slug: preview ? criterion_slug : nil
      }
    end

    def eligible_population
      @eligible_population ||= RankingEligibilityScope.new(
        category_id: category_id,
        state: state,
        city: city,
        sector: sector
      ).relation
    end

    def canonical_population_size
      @canonical_population_size ||= RankingEligibilityScope.new(category_id: category_id).relation
                                                        .unscope(:select, :order)
                                                        .pick(Arel.sql('COUNT(DISTINCT companies.id)')).to_i
    end

    def latest_snapshot
      @latest_snapshot ||= CompanyRankingSnapshot.where(
        company_id: company.id,
        definition_version: CompanyRankingSnapshot::DEFINITION_VERSION
      ).for_scope(official_scope[:type], official_scope[:category_id]).latest_first.first
    end

    def historical_data
      CompanyRankingSnapshot.where(
        company_id: company.id,
        definition_version: CompanyRankingSnapshot::DEFINITION_VERSION
      ).for_scope(official_scope[:type], official_scope[:category_id])
                            .where(snapshot_date: history_days.days.ago.to_date..business_date)
                            .order(:snapshot_date)
                            .map do |row|
        {
          week: row.snapshot_date.iso8601,
          position: row.rank_position,
          score: row.score.to_f,
          percentile: row.percentile.to_f
        }
      end
    end

    def history_payload(items)
      {
        status: history_status_for(items),
        scope: 'official',
        items: items,
        sample_size: items.length,
        minimum_snapshots: HISTORY_FORMING_MIN_SNAPSHOTS,
        first_snapshot_date: items.first&.dig(:week),
        trend_30d: history_trend_30d(items)
      }
    end

    def history_status_for(items)
      return 'empty' if items.empty?
      return 'forming' if items.length < HISTORY_FORMING_MIN_SNAPSHOTS

      'ready'
    end

    def ranked_companies
      @ranked_companies ||= ranked_companies_for(
        category_id: category_id,
        state: state,
        city: city,
        sector: sector
      )
    end

    def ranked_companies_for(scope)
      RankingEligibilityScope.new(
        category_id: scope[:category_id],
        state: scope[:state],
        city: scope[:city],
        sector: scope[:sector]
      ).relation
        .joins('LEFT JOIN company_trust_score cts ON cts.company_id = companies.id')
        .select(<<~SQL.squish)
          companies.*, crs.score AS ranking_score, crs.breakdown AS ranking_breakdown
        SQL
        .includes(:company_badges, :review_aggregates, logo_attachment: :blob)
        .order(Arel.sql('crs.score DESC, COALESCE(cts.score, 0) DESC, companies.reviews_count DESC, companies.id ASC'))
        .to_a
    end

    # Compatibilidade temporária para os consumidores legados do serviço.
    # O contrato novo expõe ranking.population, mas a população continua sendo
    # a mesma relação qualificada e sem duplicidade usada no ranking.
    def total_companies
      ranked_companies.length
    end

    def snapshot_ranking(snapshot, status, eligible_population = nil)
      {
        status: status,
        position: snapshot&.rank_position,
        population: snapshot&.population_size || eligible_population,
        population_label: 'eligible_companies',
        score: snapshot&.score&.to_f,
        percentile: snapshot&.percentile&.to_f
      }
    end

    def preview_ranking(population)
      return empty_ranking if population.empty?

      # Critério altera apenas o mapa de posicionamento. Não existe uma fórmula
      # oficial de ranking por critério; portanto, não publicamos posição falsa.
      return not_applicable_ranking(population) if criterion_slug.present?

      position = current_position(population)
      return not_applicable_ranking(population) if position.nil?

      {
        status: 'preview',
        position: position,
        population: population.length,
        population_label: 'eligible_companies',
        score: score_for_company(population),
        percentile: percentile(position, population.length)
      }
    end

    def empty_ranking
      {
        status: 'empty',
        position: nil,
        population: 0,
        population_label: 'eligible_companies',
        score: nil,
        percentile: nil
      }
    end

    def not_applicable_ranking(population)
      {
        status: 'not_applicable',
        position: nil,
        population: population.length,
        population_label: 'eligible_companies',
        score: score_for_company(population),
        percentile: nil
      }
    end

    def current_position(population = ranked_companies)
      index = population.find_index { |record| record.id == company.id }
      index && index + 1
    end

    def current_position_by_criterion(population = ranked_companies)
      index = population.find_index { |record| record.id == company.id }
      index && index + 1
    end

    def score_for_company(population)
      population.find { |record| record.id == company.id }&.ranking_score&.to_f
    end

    def percentile(position, population)
      return nil if position.nil? || population.to_i.zero?

      ((population - position + 1).to_f / population * 100).round(1)
    end

    def official_status_for(snapshot, population_size)
      return 'empty' if population_size.zero?
      return 'processing' if snapshot.nil?
      return 'stale' if snapshot.computed_at < SNAPSHOT_STALE_AFTER.ago

      'ready'
    end

    def build_positioning
      minimum_population = RankingBenchmarkService.min_comparable_population
      eligibility = Positioning::Eligibility.new(minimum_population: minimum_population)
      population_cache = {}
      calculator_cache = {}
      loader = lambda do |scope|
        key = scope.slice(:category_id, :state, :city, :sector)
        population_cache[key] ||= ranked_companies_for(key)
      end
      points_for = lambda do |records|
        key = records.map(&:id)
        calculator_cache[key] ||= positioning_calculator_class.new(
          trust_scores: trust_scores_for(records),
          category_id: category_id,
          criterion_slug: criterion_slug,
          criterion_title: criterion_title,
          quadrant_mode: quadrant_mode
        )
      end
      resolver = Positioning::ScopeResolver.new(
        category_id: category_id,
        state: state,
        city: city,
        sector: sector,
        minimum_population: minimum_population,
        population_loader: loader,
        eligibility_checker: lambda do |records|
          calculator = points_for.call(records)
          eligibility.call(records.map { |record| calculator.calculate(record) })
        end
      )
      resolved = resolver.resolve
      records = resolved[:population]
      calculator = points_for.call(records)
      raw_points = records.map { |record| positioning_point_for(record, calculator, records) }
      assessment = eligibility.call(raw_points)
      thresholds = assessment[:status] == "ready" ? Positioning::ThresholdCalculator.new(raw_points).call : empty_thresholds(raw_points)
      points = raw_points.map { |point| point.merge(quadrant_payload(point, thresholds)) }
      point_by_id = points.index_by { |point| point[:id] }
      selection = Positioning::PointSelector.new(
        leaders_limit: QUADRANT_LEADERS_LIMIT,
        neighbors_limit: QUADRANT_NEIGHBORS_LIMIT
      ).call(
        population: records,
        company_id: company.id,
        point_builder: ->(record) { point_by_id.fetch(record.id) }
      )
      resolved.merge(
        status: assessment[:status],
        points: assessment[:status] == "ready" ? selection[:points] : [],
        leaders: assessment[:status] == "ready" ? selection[:leaders] : [],
        neighbors: assessment[:status] == "ready" ? selection[:neighbors] : [],
        all_points: raw_points,
        thresholds: thresholds,
        population_payload: {
          eligible: records.length,
          displayed: assessment[:status] == "ready" ? selection[:displayed_count] : 0,
          minimum_required: minimum_population
        },
        distribution: thresholds.slice(:distinct_x, :distinct_y, :p10_x, :p10_y, :p50_x, :p50_y, :p90_x, :p90_y, :iqr_x, :iqr_y, :zero_ratio_y, :floor_ratio_y),
        quality_flags: (resolved[:assessment][:quality_flags].to_a + assessment[:quality_flags]).uniq
      )
    end

    def empty_positioning(positioning)
      positioning.merge(
        status: "empty",
        points: [],
        leaders: [],
        neighbors: [],
        population_payload: positioning[:population_payload].to_h.merge(displayed: 0)
      )
    end

    def empty_thresholds(points)
      {
        method: Positioning::Definition::THRESHOLD_METHOD,
        population_size: points.length,
        x_threshold: nil,
        y_threshold: nil,
        distinct_x: points.map { |point| point[:x_score].to_f }.uniq.length,
        distinct_y: points.map { |point| point[:y_score].to_f }.uniq.length
      }
    end

    def trust_scores_for(records)
      CompanyTrustScore.where(company_id: records.map(&:id)).pluck(:company_id, :score).to_h do |id, score|
        [id, score.to_f]
      end
    end

    def positioning_point_for(record, calculator, population)
      calculated = calculator.calculate(record)
      {
        id: record.id,
        name: record.name,
        logo_url: record.logo_url,
        rating: comparison_rating(record).to_f,
        x_score: calculated[:x_score],
        y_score: calculated[:y_score],
        completeness_of_vision: calculated[:x_score],
        ability_to_execute: calculated[:y_score],
        x_breakdown: calculated[:x_breakdown],
        y_breakdown: calculated[:y_breakdown],
        is_current_company: record.id == company.id,
        ranking_position: population.find_index { |candidate| candidate.id == record.id }&.+(1),
        ranking_score: record.ranking_score&.to_f,
        score_distance: score_distance_from_current(record, population),
        criterion_score: criterion_score_for(record),
        criteria_breakdown: criteria_breakdown_for(record)
      }
    end

    def quadrant_payload(point, thresholds)
      return { quadrant: nil, quadrant_label: nil } unless thresholds[:x_threshold] && thresholds[:y_threshold]

      key = Positioning::Definition.quadrant_for(
        point[:x_score], point[:y_score], thresholds[:x_threshold], thresholds[:y_threshold]
      )
      definition = Positioning::Definition.quadrant_payload(key)
      { quadrant: definition[:key], quadrant_label: definition[:label] }
    end

    def score_distance_from_current(record, population)
      current_score = score_for_company(population)
      return nil if current_score.nil? || record.ranking_score.nil?

      (record.ranking_score.to_f - current_score).round(2)
    end
    def comparison_rating(record)
      return record.rating_avg.to_f if criterion_slug.blank?

      criterion_score_for(record).presence || record.rating_avg.to_f
    end

    def trust_scores_by_company
      @trust_scores_by_company ||= CompanyTrustScore.where(company_id: ranked_companies.map(&:id)).pluck(:company_id, :score)
                                                       .to_h { |id, score| [id, score.to_f] }
    end
    def criterion_score_for(record)
      return nil if criterion_slug.blank?

      criteria_breakdown_for(record)[criterion_title] || criteria_breakdown_for(record)[criterion_slug]
    end

    def criteria_breakdown_for(record)
      aggregate = review_aggregate_for(record)
      return {} unless aggregate&.criteria_breakdown.is_a?(Hash)

      aggregate.criteria_breakdown
    end

    def review_aggregate_for(record)
      aggregates = record.review_aggregates.to_a
      aggregate = aggregates.find { |item| item.category_id == category_id.to_i } if category_id.present?
      aggregate || aggregates.find { |item| item.category_id.nil? }
    end

    def criterion_title
      @criterion_title ||= if criterion_slug.present?
                             Category.find_by(id: category_id)&.effective_rating_criteria&.find { |item| item.slug == criterion_slug }&.title
                           end
    end

    def quadrant_meta(positioning = {})
      reviews_mode = quadrant_mode == 'reviews'
      x_label = reviews_mode ? 'Autoridade das Reviews' : 'Autoridade de Confiança'
      y_label = reviews_mode ? 'Força das Reviews' : 'Poder de Execução'
      {
        category_id: category_id&.to_i,
        criterion_slug: criterion_slug,
        criterion_title: criterion_title,
        mode: quadrant_mode,
        methodology_version: effective_positioning_version,
        threshold_method: Positioning::Definition::THRESHOLD_METHOD,
        methodology: 'O mapa de posicionamento usa eixos próprios e não determina a posição do ranking orgânico oficial.',
        x_axis_label: x_label,
        y_axis_label: y_label,
        x_axis_definition: reviews_mode ? 'Nota e volume de avaliações.' : 'Confiança, verificação, credibilidade de reviews, selos e prova social.',
        y_axis_definition: reviews_mode ? 'Volume e credibilidade das avaliações.' : 'Sinais de execução, engajamento e maturidade operacional.',
        requested_scope: positioning[:requested_scope],
        resolved_scope: positioning[:resolved_scope],
        fallback: { active: positioning[:fallback] == true, reason: positioning[:fallback_reason] },
        population: positioning[:population_payload],
        distribution: positioning[:distribution],
        thresholds: positioning[:thresholds],
        axes: {
          x: { key: 'trust_authority', label: x_label },
          y: { key: 'execution_power', label: y_label }
        },
        quadrant_taxonomy: Positioning::Definition::QUADRANTS.transform_values { |value| value }
      }
    end
    def category_rankings
      company.categories.map do |category|
        if ad_hoc_preview?
          {
            category_id: category.id,
            category_name: category.name,
            position: nil,
            total: nil,
            percentile: nil,
            unavailable: true,
            criterion_slug: criterion_slug,
            criterion_title: criterion_title
          }
        else
          snapshot = CompanyRankingSnapshot.where(
            company_id: company.id,
            scope_type: 'category',
            scope_id: category.id,
            definition_version: CompanyRankingSnapshot::DEFINITION_VERSION
          ).latest_first.first
          {
            category_id: category.id,
            category_name: category.name,
            position: snapshot&.rank_position,
            total: snapshot&.population_size,
            percentile: snapshot&.percentile&.to_f,
            unavailable: snapshot.nil?,
            definition_version: snapshot&.definition_version,
            computed_at: snapshot&.computed_at
          }
        end
      end
    end

    def definition(snapshot, preview, official_status)
      {
        definition_version: CompanyRankingSnapshot::DEFINITION_VERSION,
        trust_score_definition_version: TrustScore::Definition::VERSION,
        purpose: 'organic_performance',
        sponsored_included: false,
        score_definition: 'Trust score × 10 + engajamento dos últimos 7 dias completos com decaimento exponencial.',
        tie_breaker: 'pontuação desc, confiança desc, avaliações desc, company_id asc',
        computed_at: snapshot&.computed_at,
        data_through: snapshot&.data_through,
        eligibility_definition: RankingEligibilityScope::ELIGIBILITY_DEFINITION,
        quality_flags: quality_flags_for(snapshot, preview, official_status, nil),
        is_ad_hoc_preview: preview,
        position_semantics: criterion_slug.present? ? 'quadrant_preview_without_official_position' : (preview ? 'dynamic_comparison' : 'canonical_organic_snapshot')
      }
    end

    def quality_payload(snapshot, preview, official_status, ranking_status)
      {
        flags: quality_flags_for(snapshot, preview, official_status, ranking_status),
        computed_at: snapshot&.computed_at,
        data_through: snapshot&.data_through
      }
    end

    def quality_flags_for(snapshot, preview, official_status, ranking_status)
      flags = Array(snapshot&.quality_flags).dup
      flags << 'local_ranking_preview_not_persisted' if preview
      flags << 'snapshot_processing' if official_status == 'processing'
      flags << 'snapshot_stale' if official_status == 'stale'
      flags << 'population_empty' if ranking_status == 'empty' || (!preview && official_status == 'empty')
      flags.uniq
    end

    def score_drivers_for(snapshot:, ranking:, population:, preview:)
      record = population.find { |candidate| candidate.id == company.id }
      breakdown = normalized_breakdown(record&.ranking_breakdown || snapshot&.breakdown)
      items = [
        score_driver('trust_score', 'Trust Score', breakdown['base_trust'], bounded: true, max: 100.0, unit: 'pts'),
        score_driver('recent_engagement', 'Engajamento recente', breakdown['recent_engagement'], bounded: false, max: nil, unit: 'pts')
      ].compact

      {
        status: items.any? ? 'ready' : 'unavailable',
        source: preview ? 'current_ranking_score' : 'official_snapshot',
        score: ranking[:score],
        items: items
      }
    end

    def normalized_breakdown(value)
      return value.stringify_keys if value.respond_to?(:stringify_keys)
      return JSON.parse(value) if value.is_a?(String)

      {}
    rescue JSON::ParserError
      {}
    end

    def score_driver(code, label, value, bounded: true, max: 100.0, unit: 'pts')
      return if value.nil?

      {
        code: code,
        label: label,
        value: value.to_f.round(2),
        raw_value: value.to_f.round(2),
        bounded: bounded,
        max: max,
        unit: unit
      }
    end

    def gaps_for(population)
      return [] if trust_scores_by_company.key?(company.id)

      [{
        code: 'trust_score_missing',
        title: 'Dados de confiança incompletos',
        description: 'A empresa ainda não possui um Trust Score calculado para o próximo ciclo orgânico.',
        evidence: { company_id: company.id, eligible_population: population.length }
      }]
    end

    def changes_for(items)
      return { status: 'insufficient_history', from: nil, to: nil, changes: {} } if items.length < 2

      previous = items[-2]
      current = items[-1]
      {
        status: 'ready',
        from: previous[:week],
        to: current[:week],
        changes: {
          position: previous[:position].to_i - current[:position].to_i,
          score: (current[:score].to_f - previous[:score].to_f).round(2),
          percentile: (current[:percentile].to_f - previous[:percentile].to_f).round(2)
        }
      }
    end

    def insights_for(ranking:, benchmarks:, official_status:)
      return processing_insights if official_status == 'processing'
      return empty_insights if ranking[:status] == 'empty'

      strengths = []
      opportunities = []
      current_score = ranking[:score]
      p90 = benchmarks[:p90_score]

      if benchmarks[:status] == 'ready' && current_score
        target = benchmarks[:median_score]
        if current_score >= target
          strengths << insight(
            'ranking_score_above_median',
            'Pontuação acima da mediana',
            'A pontuação orgânica atual está na mediana ou acima da população comparável.',
            metric: 'ranking_score',
            evidence: { company_value: current_score, benchmark_median: target }
          )

          if p90 && current_score < p90
            opportunities << insight(
              'ranking_score_below_p90',
              'Alcançar o Top 10% (P90)',
              'A pontuação orgânica atual está acima da mediana, mas abaixo do grupo líder (Top 10%). Aumente avaliações verificadas e engajamento recente para fechar este gap.',
              metric: 'ranking_score',
              evidence: { company_value: current_score, benchmark_p90: p90 }
            )
          end
        else
          opportunities << insight(
            'ranking_score_below_median',
            'Pontuação abaixo da mediana',
            'A pontuação orgânica atual está abaixo da mediana da população comparável.',
            metric: 'ranking_score',
            evidence: { company_value: current_score, benchmark_median: target }
          )
        end
      end

      if !trust_scores_by_company.key?(company.id)
        opportunities << insight(
          'trust_score_missing',
          'Dados de confiança incompletos',
          'A empresa ainda não possui um score de confiança calculado para compor o próximo ciclo orgânico.',
          metric: 'trust_score',
          evidence: { company_value: nil },
          action_url: "/dashboard?company_id=#{company.id}&tab=reviews"
        )
      end

      leadership_action = if current_score && benchmarks[:status] == 'ready' && (p90.nil? || current_score >= p90)
                            insight(
                              'ranking_maintain_leadership',
                              'Sustentar liderança de mercado',
                              'Mantenha avaliações recentes ativas e verificação em dia para sustentar sua posição líder.',
                              metric: 'ranking_score',
                              evidence: { company_value: current_score, benchmark_p90: p90 }
                            )
                          end

      next_action = opportunities.first || leadership_action
      {
        strengths: strengths,
        opportunities: opportunities,
        next_best_action: next_action
      }
    end

    def processing_insights
      {
        strengths: [],
        opportunities: [],
        next_best_action: insight(
          'snapshot_processing',
          'Aguardando o primeiro ranking oficial',
          'O snapshot orgânico está em processamento; nenhum valor de posição foi estimado.',
          metric: 'snapshot_status',
          evidence: { status: 'processing' }
        )
      }
    end

    def empty_insights
      {
        strengths: [],
        opportunities: [],
        next_best_action: insight(
          'population_empty',
          'Sem empresas comparáveis neste escopo',
          'Amplie os filtros para encontrar uma população elegível de comparação.',
          metric: 'eligible_population',
          evidence: { population: 0 }
        )
      }
    end

    def insight(code, title, description, metric:, evidence:, action_url: nil)
      {
        code: code,
        title: title,
        description: description,
        metric: metric,
        evidence: evidence,
        action_url: action_url
      }.compact
    end

    def history_trend_30d(items)
      current = items.last
      return nil unless current

      current_date = Date.iso8601(current[:week])
      comparison = items.select { |item| Date.iso8601(item[:week]) <= current_date - 30.days }.last
      return nil unless comparison

      {
        from: comparison[:week],
        to: current[:week],
        position_change: comparison[:position].to_i - current[:position].to_i,
        percentile_change: (current[:percentile].to_f - comparison[:percentile].to_f).round(1),
        score_change: (current[:score].to_f - comparison[:score].to_f).round(1)
      }
    end

    def business_date
      Time.current.in_time_zone('America/Sao_Paulo').to_date
    end

    def effective_positioning_version
      @positioning_version.to_s.include?('v2') ? Positioning::Definition::VERSION_V2 : Positioning::Definition::VERSION
    end

    def readiness_payload
      RankingReadinessService.new(company: company).call
    end

    def positioning_calculator_class
      @positioning_version.to_s.include?('v2') ? Positioning::CalculatorV2 : Positioning::Calculator
    end

    def monotonic_time
      Process.clock_gettime(Process::CLOCK_MONOTONIC)
    end
  end
end
