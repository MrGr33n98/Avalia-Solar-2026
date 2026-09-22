# frozen_string_literal: true

module CompanyDashboard
  class RankingService
    MAX_BADGES_SCORE = 10.0
    MAX_EXECUTION_LEADS = 100.0
    MAX_EXECUTION_VIEWS = 2_000.0
    MAX_EXECUTION_CLICKS = 300.0
    SNAPSHOT_STALE_AFTER = 36.hours

    attr_reader :company, :category_id, :criterion_slug, :history_days, :state, :city, :sector, :quadrant_mode

    def initialize(company:, category_id: nil, criterion_slug: nil, state: nil, city: nil, sector: nil, history_days: 90, quadrant_mode: nil)
      @company = company
      @category_id = category_id
      @criterion_slug = criterion_slug
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
      snapshot = latest_snapshot
      preview = ad_hoc_preview?
      preview_population = preview ? total_companies : nil
      history_items = historical_data
      position = preview ? current_position : snapshot&.rank_position
      population = preview ? preview_population : snapshot&.population_size
      mode = preview ? 'preview' : 'canonical'
      ranking_status = ranking_status_for(snapshot, preview_population)
      quadrant_status = preview_population_or_snapshot?(preview, preview_population, snapshot) ? 'ready' : 'empty'
      history_status = history_items.present? ? 'ready' : 'empty'
      quality = quality_payload(snapshot, preview, ranking_status)
      quadrant_points = quadrant_status == 'ready' ? competitors_for_quadrant : []

      {
        status: preview ? quadrant_status : ranking_status,
        mode: mode,
        ranking_status: ranking_status,
        quadrant_status: quadrant_status,
        history_status: history_status,
        current_position: position,
        total_companies: population,
        score: preview ? canonical_score_for(company) : snapshot&.score,
        percentile: preview ? percentile : snapshot&.percentile,
        category_rankings: category_rankings,
        magic_quadrant_competitors: quadrant_points,
        quadrant_meta: quadrant_meta,
        historical_data: history_items,
        history_trend_30d: history_trend_30d(history_items),
        transparency: transparency(snapshot, ranking_status),
        error: nil,
        quality: quality,
        leaders: quadrant_points.first(3),
        neighbors: quadrant_points.reject { |item| item[:is_current_company] }.first(5),
        insights: insights_for(snapshot, ranking_status)
      }
    end

    private

    def base_scope
      scope = Company.active.with_attached_logo.select(:id, :name, :rating_avg, :rating_count, :verified, :social_proof_enabled, :whatsapp_enabled, :cta_whatsapp_enabled, :profile_views_count, :cta_clicks_count, :leads_count, :reviews_count)
      if category_id.present?
        scope = scope.joins(:categories).where(categories: { id: category_id }).distinct
      end
      scope = scope.where(state: state) if state.present?
      scope = apply_city_filter(scope) if city.present?
      scope = scope.where('project_types @> ?', [sector].to_json) if sector.present?
      scope
    end

    def snapshot_scope
      category_id.present? ? ['category', category_id.to_i] : ['global', nil]
    end

    def latest_snapshot
      @latest_snapshot ||= begin
        type, id = snapshot_scope
        CompanyRankingSnapshot.where(company_id: company.id, definition_version: CompanyRankingSnapshot::DEFINITION_VERSION)
                              .for_scope(type, id).latest_first.first
      end
    end

    def historical_data
      type, id = snapshot_scope
      CompanyRankingSnapshot.where(company_id: company.id, definition_version: CompanyRankingSnapshot::DEFINITION_VERSION)
                            .for_scope(type, id)
                            .where(snapshot_date: history_days.days.ago.to_date..business_date)
                            .order(:snapshot_date)
                            .map { |row| { week: snapshot_day_for(row).iso8601, position: row.rank_position, score: row.score.to_f, percentile: row.percentile.to_f } }
    end

    def transparency(snapshot, ranking_status = nil)
      {
        definition_version: CompanyRankingSnapshot::DEFINITION_VERSION,
        purpose: criterion_slug.present? ? 'criterion_quadrant_preview' : 'organic_performance', sponsored_included: false,
        score_definition: 'Trust score × 10 + engajamento dos últimos 7 dias completos com decaimento exponencial.',
        tie_breaker: 'pontuação desc, confiança desc, avaliações desc, company_id asc',
        scope: category_id.present? ? 'category' : 'global',
        computed_at: snapshot&.computed_at, data_through: snapshot&.data_through,
        quality_flags: quality_flags_for(snapshot, ad_hoc_preview?, ranking_status),
        breakdown: snapshot&.breakdown || {},
        is_ad_hoc_preview: ad_hoc_preview?, position_semantics: criterion_slug.present? ? 'quadrant_preview_without_official_position' : 'canonical_organic_snapshot'
      }
    end

    def current_position
      return nil if criterion_slug.present?

      index = ranked_companies.find_index { |comp| comp.id == company.id }
      index && index + 1
    end

    def total_companies
      scored_scope.count
    end

    def percentile
      total = total_companies
      return nil if total.zero? || current_position.nil?
      
      ((total - current_position + 1).to_f / total * 100).round(1)
    end

    def competitors_for_quadrant
      ranked_companies.first(15)
        .map do |comp|
          {
            id: comp.id,
            name: comp.name,
            logo_url: comp.logo_url,
            rating: comparison_rating(comp).to_f,
            completeness_of_vision: calculate_vision_score(comp),
            ability_to_execute: calculate_execution_score(comp),
            is_current_company: comp.id == company.id,
            criterion_score: criterion_score_for(comp),
            criteria_breakdown: criteria_breakdown_for(comp)
          }
        end
    end

    def calculate_vision_score(comp)
      return review_quadrant_authority(comp) if quadrant_mode == 'reviews'

      criterion_component = criterion_slug.present? ? normalize_criterion_score(criterion_score_for(comp)) * 15.0 : 0.0

      base_score =
        (stored_trust_score_for(comp) * 0.45) +
        (verification_score_for(comp) * 0.20) +
        (review_credibility_score_for(comp) * 0.15) +
        (badge_depth_score_for(comp) * 0.10) +
        (social_proof_score_for(comp) * 0.10)
      score = base_score * (criterion_slug.present? ? 0.85 : 1.0) + criterion_component

      score.round(1)
    end

    def calculate_execution_score(comp)
      return review_quadrant_strength(comp) if quadrant_mode == 'reviews'

      leads_signal = normalize(comp.leads_count.to_f, MAX_EXECUTION_LEADS) * 35.0
      engagement_signal = blended_engagement_score_for(comp) * 25.0
      conversion_signal = conversion_efficiency_score_for(comp) * 20.0
      trust_operational_signal = operational_maturity_score_for(comp) * 10.0
      category_fit_signal = criterion_slug.present? ? normalize_criterion_score(criterion_score_for(comp)) * 10.0 : 0.0

      base_score = leads_signal + engagement_signal + conversion_signal + trust_operational_signal
      score = base_score * (criterion_slug.present? ? 1.0 : (100.0 / 90.0)) + category_fit_signal

      score.round(1)
    end

    def review_quadrant_authority(comp)
      rating = normalize(comp.rating_avg.to_f, 5.0) * 70.0
      volume = normalize_log(comp.reviews_count.to_f, 200.0) * 30.0
      (rating + volume).round(1)
    end

    def review_quadrant_strength(comp)
      volume = normalize_log(comp.reviews_count.to_f, 200.0) * 45.0
      credibility = review_credibility_score_for(comp) * 0.55
      (volume + credibility).round(1)
    end

    def category_rankings
      company.categories.map do |category|
        if ad_hoc_preview?
          scoped_service = self.class.new(company: company, category_id: category.id, criterion_slug: criterion_slug, state: state, city: city, sector: sector)
          total = scoped_service.send(:total_companies)
          position = scoped_service.send(:current_position)

          {
            category_id: category.id,
            category_name: category.name,
            position: nil,
            total: nil,
            percentile: nil,
            unavailable: true,
            criterion_slug: criterion_slug,
            criterion_title: scoped_service.send(:criterion_title)
          }
        else
          snapshot = CompanyRankingSnapshot.where(company_id: company.id, scope_type: 'category', scope_id: category.id,
                                                   definition_version: CompanyRankingSnapshot::DEFINITION_VERSION)
                                           .latest_first.first
          if snapshot
            next {
              category_id: category.id,
              category_name: category.name,
              position: snapshot.rank_position,
              total: snapshot.population_size,
              percentile: snapshot.percentile.to_f,
              definition_version: snapshot.definition_version,
              computed_at: snapshot.computed_at
            }
          end

          {
            category_id: category.id,
            category_name: category.name,
            position: nil,
            total: nil,
            percentile: nil,
            unavailable: true
          }
        end
      end
    end

    def ranked_companies
      @ranked_companies ||= scored_scope.joins('LEFT JOIN company_trust_score cts ON cts.company_id = companies.id')
                                       .includes(:company_badges, :review_aggregates)
                                       .order(Arel.sql('crs.score DESC, COALESCE(cts.score, 0) DESC, companies.reviews_count DESC, companies.id ASC')).to_a
    end

    def scored_scope
      @scored_scope ||= base_scope.joins('INNER JOIN company_ranking_score crs ON crs.company_id = companies.id')
    end

    def canonical_score_for(comp)
      ActiveRecord::Base.connection.select_value(ActiveRecord::Base.sanitize_sql_array(['SELECT score FROM company_ranking_score WHERE company_id = ?', comp.id]))&.to_f
    end

    def current_position_by_criterion
      index = ranked_companies.find_index { |comp| comp.id == company.id }
      index ? index + 1 : 1
    end

    def comparison_rating(comp)
      return comp.rating_avg.to_f if criterion_slug.blank?

      criterion_score_for(comp).presence || comp.rating_avg.to_f
    end

    def stored_trust_score_for(comp)
      trust_record = CompanyTrustScore.find_by(company_id: comp.id)
      return trust_record.score.to_f if trust_record&.score.present?

      TrustScore::CalculationService.calculate_inline(comp).to_f
    end

    def verification_score_for(comp)
      comp.verified? ? 100.0 : 0.0
    end

    def review_credibility_score_for(comp)
      rating_score = normalize(comp.rating_avg.to_f, 5.0)
      volume_score = normalize_log(comp.reviews_count.to_f, 200.0)
      ((rating_score * 0.7) + (volume_score * 0.3)) * 100.0
    end

    def badge_depth_score_for(comp)
      badges_count = comp.company_badges.count.to_f
      normalize(badges_count, MAX_BADGES_SCORE) * 100.0
    end

    def social_proof_score_for(comp)
      comp.social_proof_enabled? ? 100.0 : 0.0
    end

    def blended_engagement_score_for(comp)
      views = normalize_log(comp.profile_views_count.to_f, MAX_EXECUTION_VIEWS)
      clicks = normalize_log(comp.cta_clicks_count.to_f, MAX_EXECUTION_CLICKS)
      (views * 0.55) + (clicks * 0.45)
    end

    def conversion_efficiency_score_for(comp)
      view_to_click = safe_ratio(comp.cta_clicks_count.to_f, comp.profile_views_count.to_f)
      click_to_lead = safe_ratio(comp.leads_count.to_f, comp.cta_clicks_count.to_f)
      ((([view_to_click, 0.35].min / 0.35) * 0.45) + (([click_to_lead, 0.60].min / 0.60) * 0.55))
    end

    def operational_maturity_score_for(comp)
      signals = []
      signals << 1.0 if comp.verified?
      signals << 1.0 if comp.social_proof_enabled?
      signals << 1.0 if comp.whatsapp_enabled?
      signals << 1.0 if comp.cta_whatsapp_enabled?
      signals << 1.0 if comp.company_badges.exists?
      return 0.0 if signals.empty?

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

      [Math.log1p(value.to_f) / Math.log1p(max.to_f), 1.0].min
    end

    def safe_ratio(numerator, denominator)
      return 0.0 if denominator.to_f <= 0

      numerator.to_f / denominator.to_f
    end

    def criterion_score_for(comp)
      return nil if criterion_slug.blank?

      criteria_breakdown_for(comp)[criterion_title] || criteria_breakdown_for(comp)[criterion_slug]
    end

    def criteria_breakdown_for(comp)
      aggregate = review_aggregate_for(comp)
      return {} unless aggregate&.criteria_breakdown.is_a?(Hash)

      aggregate.criteria_breakdown
    end

    def review_aggregate_for(comp)
      @review_aggregates ||= {}
      @review_aggregates[comp.id] ||= begin
        scope = comp.review_aggregates.select(:id, :company_id, :category_id, :criteria_breakdown)
        scope = scope.find_by(category_id: category_id) if category_id.present?
        scope ||= comp.review_aggregates.select(:id, :company_id, :category_id, :criteria_breakdown).find_by(category_id: nil)
        scope
      end
    end

    def criterion_title
      @criterion_title ||= begin
        if criterion_slug.blank?
          nil
        else
          category = Category.find_by(id: category_id)
          if category.nil?
            nil
          else
            category.effective_rating_criteria.find { |c| c.slug == criterion_slug }&.title
          end
        end
      end
    end

    def quadrant_meta
      {
        category_id: category_id,
        criterion_slug: criterion_slug,
        criterion_title: criterion_title,
        mode: quadrant_mode,
        x_axis_label: quadrant_mode == 'reviews' ? 'Autoridade das Reviews' : (criterion_slug.present? ? "Autoridade de Confiança · #{criterion_title || criterion_slug.to_s.humanize}" : 'Autoridade de Confiança'),
        y_axis_label: quadrant_mode == 'reviews' ? 'Força das Reviews' : 'Poder de Execução'
      }
    end

    def apply_city_filter(scope)
      normalized_city = normalize_location(city)
      matching_cities = scope.where.not(city: [nil, '']).distinct.pluck(:city)
                             .select { |candidate| normalize_location(candidate) == normalized_city }
      return scope.none if matching_cities.empty?

      scope.where(city: matching_cities)
    end

    def normalize_location(value)
      I18n.transliterate(value.to_s).downcase.squish
    end

    def business_date
      Time.current.in_time_zone('America/Sao_Paulo').to_date
    end

    def ranking_status_for(snapshot, preview_population)
      if ad_hoc_preview?
        return 'empty' if preview_population.to_i.zero?
        return 'not_applicable' if criterion_slug.present?

        return 'preview'
      end

      return 'empty' if total_companies.zero?
      return 'processing' if snapshot.nil?
      return 'stale' if snapshot.computed_at < SNAPSHOT_STALE_AFTER.ago

      'ready'
    end

    def preview_population_or_snapshot?(preview, preview_population, snapshot)
      preview ? preview_population.to_i.positive? : snapshot.present?
    end

    def quality_payload(snapshot, preview, ranking_status)
      {
        flags: quality_flags_for(snapshot, preview, ranking_status),
        computed_at: snapshot&.computed_at,
        data_through: snapshot&.data_through
      }
    end

    def quality_flags_for(snapshot, preview, ranking_status = nil)
      flags = Array(snapshot&.quality_flags).dup
      flags << 'local_ranking_preview_not_persisted' if preview
      flags << 'snapshot_processing' if ranking_status == 'processing'
      flags << 'snapshot_stale' if ranking_status == 'stale'
      flags << 'population_empty' if ranking_status == 'empty'
      flags.uniq
    end

    def insights_for(snapshot, ranking_status)
      return {
        strengths: [],
        opportunities: [],
        next_best_action: insight(
          'snapshot_processing',
          'Aguardar o processamento do primeiro snapshot orgânico.',
          key: 'snapshot_status',
          value: 'processing'
        )
      } if ranking_status == 'processing'

      return {
        strengths: [],
        opportunities: [],
        next_best_action: insight(
          'population_empty',
          'Amplie o escopo ou aguarde uma população comparável para visualizar o ranking.',
          key: 'population',
          value: 0
        )
      } if ranking_status == 'empty'

      return {
        strengths: [],
        opportunities: [],
        next_best_action: insight(
          'preview_not_canonical',
          'A comparação atual não altera a posição oficial nem o histórico orgânico.',
          key: 'ranking_mode',
          value: 'preview'
        )
      } if %w[preview not_applicable].include?(ranking_status)

      breakdown = snapshot&.breakdown.to_h
      base_trust = breakdown['base_trust'].to_f
      engagement = breakdown['recent_engagement'].to_f
      benchmarks = insight_benchmarks(snapshot)
      strengths = []
      opportunities = []

      if benchmarks[:base_trust]
        target = benchmarks[:base_trust]
        collection = base_trust >= target ? strengths : opportunities
        collection << insight(
          base_trust >= target ? 'trust_above_median' : 'trust_below_median',
          base_trust >= target ? 'A confiança do perfil está na mediana ou acima do escopo comparado.' :
            'A confiança do perfil está abaixo da mediana do escopo comparado.',
          key: 'base_trust', value: base_trust, benchmark: target
        )
      end

      if benchmarks[:recent_engagement]
        target = benchmarks[:recent_engagement]
        collection = engagement >= target ? strengths : opportunities
        collection << insight(
          engagement >= target ? 'engagement_above_median' : 'engagement_below_median',
          engagement >= target ? 'O engajamento recente está na mediana ou acima do escopo comparado.' :
            'O engajamento recente está abaixo da mediana do escopo comparado.',
          key: 'recent_engagement', value: engagement, benchmark: target
        )
      end

      next_action = next_best_action_for(opportunities, strengths)

      {
        strengths: strengths,
        opportunities: opportunities,
        next_best_action: next_action || insight(
          'insufficient_peer_data',
          'Ainda não há dados comparáveis suficientes para uma recomendação específica.',
          key: 'peer_population',
          value: 0
        )
      }
    end

    def insight_benchmarks(snapshot)
      return {} unless snapshot&.snapshot_date

      values = CompanyRankingSnapshot.where(
        scope_type: snapshot.scope_type,
        scope_id: snapshot.scope_id,
        definition_version: snapshot.definition_version,
        snapshot_date: snapshot.snapshot_date
      ).pluck(:breakdown)
      {
        base_trust: median(values.filter_map { |value| value.to_h['base_trust']&.to_f }),
        recent_engagement: median(values.filter_map { |value| value.to_h['recent_engagement']&.to_f })
      }.compact
    end

    def median(values)
      return nil if values.empty?

      sorted = values.sort
      midpoint = sorted.length / 2
      return sorted[midpoint] if sorted.length.odd?

      ((sorted[midpoint - 1] + sorted[midpoint]) / 2.0).round(2)
    end

    def insight(code, message, key:, value:, benchmark: nil)
      {
        code: code,
        message: message,
        metric: { key: key, value: value, benchmark: benchmark }.compact
      }
    end

    def next_best_action_for(opportunities, strengths)
      trust_gap = opportunities.find { |item| item[:code] == 'trust_below_median' }
      return insight(
        'review_trust_signals',
        'Revise os dados verificáveis do perfil; a confiança está abaixo da mediana do escopo e a mudança será refletida em ciclos futuros.',
        **trust_gap[:metric]
      ) if trust_gap

      engagement_gap = opportunities.find { |item| item[:code] == 'engagement_below_median' }
      return insight(
        'review_engagement_signals',
        'Revise a presença do perfil e acompanhe os sinais orgânicos; o engajamento recente está abaixo da mediana do escopo.',
        **engagement_gap[:metric]
      ) if engagement_gap

      strengths.first
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

    def snapshot_day_for(snapshot)
      return snapshot.snapshot_date if snapshot.respond_to?(:snapshot_date) && snapshot.snapshot_date.present?

      snapshot.computed_at.in_time_zone('America/Sao_Paulo').to_date
    end
  end
end
