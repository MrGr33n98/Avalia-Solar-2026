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
    QUADRANT_LEADERS_LIMIT = 5
    QUADRANT_NEIGHBORS_LIMIT = 5

    attr_reader :company, :category_id, :criterion_slug, :history_days, :state, :city, :sector, :quadrant_mode

    def initialize(company:, category_id: nil, criterion_slug: nil, state: nil, city: nil, sector: nil,
                   history_days: 90, quadrant_mode: nil)
      @company = company
      @category_id = category_id.presence
      @criterion_slug = criterion_slug.to_s.strip.presence
      @state = state.to_s.strip.upcase.presence
      @city = city.to_s.strip.presence
      @sector = sector.to_s.strip.presence
      @history_days = [[history_days.to_i, 7].max, 365].min
      @quadrant_mode = quadrant_mode == 'reviews' ? 'reviews' : 'default'
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
      quadrant_points = population.any? ? selected_quadrant_points(population) : []
      history = {
        status: history_items.present? ? 'ready' : 'empty',
        scope: 'official',
        items: history_items,
        trend_30d: history_trend_30d(history_items)
      }
      benchmarks = RankingBenchmarkService.new(population: population).call
      quality = quality_payload(snapshot, preview, official_status, ranking[:status])
      leaders = leader_points(population)
      neighbors = neighbor_points(population)

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
          status: population.any? ? 'ready' : 'empty',
          preview: preview,
          points: quadrant_points,
          meta: quadrant_meta
        },
        definition: definition(snapshot, preview, official_status),
        quality: quality,
        leaders: leaders,
        neighbors: neighbors,
        insights: insights_for(ranking: ranking, benchmarks: benchmarks, official_status: official_status),
        error: nil,

        # Compatibilidade temporária do contrato anterior.
        ranking_status: ranking[:status],
        current_position: ranking[:position],
        total_companies: ranking[:population],
        score: ranking[:score],
        percentile: ranking[:percentile],
        category_rankings: category_rankings,
        magic_quadrant_competitors: quadrant_points,
        quadrant_meta: quadrant_meta,
        historical_data: history_items,
        history_status: history[:status],
        history_trend_30d: history[:trend_30d],
        quadrant_status: population.any? ? 'ready' : 'empty',
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

    def ranked_companies
      @ranked_companies ||= eligible_population
                            .joins('LEFT JOIN company_trust_score cts ON cts.company_id = companies.id')
                            .select(<<~SQL.squish)
                              companies.*, crs.score AS ranking_score, crs.breakdown AS ranking_breakdown
                            SQL
                            .includes(:company_badges, :review_aggregates, logo_attachment: :blob)
                            .order(Arel.sql('crs.score DESC, COALESCE(cts.score, 0) DESC, companies.reviews_count DESC, companies.id ASC'))
                            .to_a
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

    def selected_quadrant_points(population)
      selected_companies_for_quadrant(population).map { |record| quadrant_point_for(record) }
    end

    def selected_companies_for_quadrant(population)
      current_index = population.find_index { |record| record.id == company.id }
      top = population.first(QUADRANT_LEADERS_LIMIT)
      adjacent = if current_index
                   from = [current_index - QUADRANT_NEIGHBORS_LIMIT, 0].max
                   to = [current_index + QUADRANT_NEIGHBORS_LIMIT, population.length - 1].min
                   population[from..to]
                 else
                   []
                 end
      (top + adjacent + Array(current_index && population[current_index])).compact.uniq(&:id)
    end

    def leader_points(population)
      population.first(QUADRANT_LEADERS_LIMIT).map { |record| quadrant_point_for(record) }
    end

    def neighbor_points(population)
      current_index = population.find_index { |record| record.id == company.id }
      return [] unless current_index

      from = [current_index - QUADRANT_NEIGHBORS_LIMIT, 0].max
      to = [current_index + QUADRANT_NEIGHBORS_LIMIT, population.length - 1].min
      population[from..to].reject { |record| record.id == company.id }.map { |record| quadrant_point_for(record) }
    end

    def quadrant_point_for(record)
      @quadrant_points ||= {}
      @quadrant_points[record.id] ||= {
        id: record.id,
        name: record.name,
        logo_url: record.logo_url,
        rating: comparison_rating(record).to_f,
        completeness_of_vision: calculate_vision_score(record),
        ability_to_execute: calculate_execution_score(record),
        is_current_company: record.id == company.id,
        criterion_score: criterion_score_for(record),
        criteria_breakdown: criteria_breakdown_for(record)
      }
    end

    def calculate_vision_score(record)
      return review_quadrant_authority(record) if quadrant_mode == 'reviews'

      criterion_component = criterion_slug.present? ? normalize_criterion_score(criterion_score_for(record)) * 15.0 : 0.0
      base_score =
        (stored_trust_score_for(record) * 0.45) +
        (verification_score_for(record) * 0.20) +
        (review_credibility_score_for(record) * 0.15) +
        (badge_depth_score_for(record) * 0.10) +
        (social_proof_score_for(record) * 0.10)
      (base_score * (criterion_slug.present? ? 0.85 : 1.0) + criterion_component).round(1)
    end

    def calculate_execution_score(record)
      return review_quadrant_strength(record) if quadrant_mode == 'reviews'

      leads_signal = normalize(record.leads_count.to_f, MAX_EXECUTION_LEADS) * 35.0
      engagement_signal = blended_engagement_score_for(record) * 25.0
      conversion_signal = conversion_efficiency_score_for(record) * 20.0
      trust_operational_signal = operational_maturity_score_for(record) * 10.0
      category_fit_signal = criterion_slug.present? ? normalize_criterion_score(criterion_score_for(record)) * 10.0 : 0.0
      base_score = leads_signal + engagement_signal + conversion_signal + trust_operational_signal
      (base_score * (criterion_slug.present? ? 1.0 : (100.0 / 90.0)) + category_fit_signal).round(1)
    end

    def review_quadrant_authority(record)
      rating = normalize(record.rating_avg.to_f, 5.0) * 70.0
      volume = normalize_log(record.reviews_count.to_f, 200.0) * 30.0
      (rating + volume).round(1)
    end

    def review_quadrant_strength(record)
      volume = normalize_log(record.reviews_count.to_f, 200.0) * 45.0
      credibility = review_credibility_score_for(record) * 0.55
      (volume + credibility).round(1)
    end

    def comparison_rating(record)
      return record.rating_avg.to_f if criterion_slug.blank?

      criterion_score_for(record).presence || record.rating_avg.to_f
    end

    def stored_trust_score_for(record)
      trust_scores_by_company.fetch(record.id, 0.0)
    end

    def trust_scores_by_company
      @trust_scores_by_company ||= CompanyTrustScore.where(company_id: ranked_companies.map(&:id)).pluck(:company_id, :score)
                                                       .to_h { |id, score| [id, score.to_f] }
    end

    def verification_score_for(record)
      record.verified? ? 100.0 : 0.0
    end

    def review_credibility_score_for(record)
      rating_score = normalize(record.rating_avg.to_f, 5.0)
      volume_score = normalize_log(record.reviews_count.to_f, 200.0)
      ((rating_score * 0.7) + (volume_score * 0.3)) * 100.0
    end

    def badge_depth_score_for(record)
      normalize(record.company_badges.size.to_f, MAX_BADGES_SCORE) * 100.0
    end

    def social_proof_score_for(record)
      record.social_proof_enabled? ? 100.0 : 0.0
    end

    def blended_engagement_score_for(record)
      views = normalize_log(record.profile_views_count.to_f, MAX_EXECUTION_VIEWS)
      clicks = normalize_log(record.cta_clicks_count.to_f, MAX_EXECUTION_CLICKS)
      (views * 0.55) + (clicks * 0.45)
    end

    def conversion_efficiency_score_for(record)
      view_to_click = safe_ratio(record.cta_clicks_count.to_f, record.profile_views_count.to_f)
      click_to_lead = safe_ratio(record.leads_count.to_f, record.cta_clicks_count.to_f)
      ((([view_to_click, 0.35].min / 0.35) * 0.45) + (([click_to_lead, 0.60].min / 0.60) * 0.55))
    end

    def operational_maturity_score_for(record)
      signals = []
      signals << 1.0 if record.verified?
      signals << 1.0 if record.social_proof_enabled?
      signals << 1.0 if record.whatsapp_enabled?
      signals << 1.0 if record.cta_whatsapp_enabled?
      signals << 1.0 if record.company_badges.any?
      signals.sum / 5.0
    end

    def normalize_criterion_score(score)
      normalize(score.to_f, 5.0)
    end

    def normalize(value, max)
      return 0.0 if max.to_f <= 0

      [[value.to_f / max.to_f, 0.0].max, 1.0].min
    end

    def normalize_log(value, max)
      return 0.0 if value.to_f <= 0 || max.to_f <= 0

      [Math.log(1.0 + value.to_f) / Math.log(1.0 + max.to_f), 1.0].min
    end

    def safe_ratio(numerator, denominator)
      return 0.0 if denominator.to_f <= 0

      numerator.to_f / denominator.to_f
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

    def quadrant_meta
      reviews_mode = quadrant_mode == 'reviews'
      x_label = reviews_mode ? 'Autoridade das Reviews' : 'Autoridade de Confiança'
      y_label = reviews_mode ? 'Força das Reviews' : 'Poder de Execução'
      {
        category_id: category_id&.to_i,
        criterion_slug: criterion_slug,
        criterion_title: criterion_title,
        mode: quadrant_mode,
        methodology: 'O mapa de posicionamento usa eixos próprios e não determina a posição do ranking orgânico oficial.',
        x_axis_label: x_label,
        y_axis_label: y_label,
        x_axis_definition: reviews_mode ? 'Nota e volume de avaliações.' : 'Confiança, verificação, credibilidade de reviews, selos e prova social.',
        y_axis_definition: reviews_mode ? 'Volume e credibilidade das avaliações.' : 'Sinais de execução, engajamento e maturidade operacional.'
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

    def insights_for(ranking:, benchmarks:, official_status:)
      return processing_insights if official_status == 'processing'
      return empty_insights if ranking[:status] == 'empty'

      strengths = []
      opportunities = []
      current_score = ranking[:score]
      if benchmarks[:status] == 'ready' && current_score
        target = benchmarks[:median_score]
        collection = current_score >= target ? strengths : opportunities
        collection << insight(
          current_score >= target ? 'ranking_score_above_median' : 'ranking_score_below_median',
          current_score >= target ? 'Pontuação acima da mediana' : 'Pontuação abaixo da mediana',
          current_score >= target ? 'A pontuação orgânica atual está na mediana ou acima da população comparável.' :
            'A pontuação orgânica atual está abaixo da mediana da população comparável.',
          metric: 'ranking_score',
          evidence: { company_value: current_score, benchmark_median: target }
        )
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

      next_action = opportunities.first || strengths.first
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

    def monotonic_time
      Process.clock_gettime(Process::CLOCK_MONOTONIC)
    end
  end
end
