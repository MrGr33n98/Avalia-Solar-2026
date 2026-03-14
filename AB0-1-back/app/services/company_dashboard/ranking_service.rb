# frozen_string_literal: true

module CompanyDashboard
  class RankingService
    MAX_BADGES_SCORE = 10.0
    MAX_EXECUTION_LEADS = 100.0
    MAX_EXECUTION_VIEWS = 2_000.0
    MAX_EXECUTION_CLICKS = 300.0

    attr_reader :company, :category_id, :criterion_slug

    def initialize(company:, category_id: nil, criterion_slug: nil)
      @company = company
      @category_id = category_id
      @criterion_slug = criterion_slug
    end

    def ranking_data
      {
        current_position: current_position,
        total_companies: total_companies,
        percentile: percentile,
        category_rankings: category_rankings,
        magic_quadrant_competitors: competitors_for_quadrant,
        quadrant_meta: quadrant_meta
      }
    end

    private

    def base_scope
      scope = Company.active
      if category_id.present?
        scope = scope.joins(:categories).where(categories: { id: category_id })
      end
      scope
    end

    def current_position
      return current_position_by_criterion if criterion_slug.present?

      base_scope
        .where('rating_avg > ? OR (rating_avg = ? AND rating_count > ?)',
               company.rating_avg, company.rating_avg, company.rating_count)
        .count + 1
    end

    def total_companies
      base_scope.count
    end

    def percentile
      return 0 if total_companies.zero?
      
      ((total_companies - current_position + 1).to_f / total_companies * 100).round(1)
    end

    def competitors_for_quadrant
      ranked_companies.first(15)
        .map do |comp|
          {
            id: comp.id,
            name: comp.name,
            logo_url: comp.logo&.url,
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
      criterion_component = criterion_slug.present? ? normalize_criterion_score(criterion_score_for(comp)) * 15.0 : 0.0

      score =
        (stored_trust_score_for(comp) * 0.45) +
        (verification_score_for(comp) * 0.20) +
        (review_credibility_score_for(comp) * 0.15) +
        (badge_depth_score_for(comp) * 0.10) +
        (social_proof_score_for(comp) * 0.10) +
        criterion_component

      [score, 100.0].min.round(1)
    end

    def calculate_execution_score(comp)
      leads_signal = normalize(comp.leads_count.to_f, MAX_EXECUTION_LEADS) * 35.0
      engagement_signal = blended_engagement_score_for(comp) * 25.0
      conversion_signal = conversion_efficiency_score_for(comp) * 20.0
      trust_operational_signal = operational_maturity_score_for(comp) * 10.0
      category_fit_signal = criterion_slug.present? ? normalize_criterion_score(criterion_score_for(comp)) * 10.0 : 0.0

      score = leads_signal + engagement_signal + conversion_signal + trust_operational_signal + category_fit_signal
      [score, 100.0].min.round(1)
    end

    def category_rankings
      company.categories.map do |category|
        if criterion_slug.present?
          scoped_service = self.class.new(company: company, category_id: category.id, criterion_slug: criterion_slug)
          total = Company.active.joins(:categories).where(categories: { id: category.id }).distinct.count

          {
            category_id: category.id,
            category_name: category.name,
            position: scoped_service.send(:current_position_by_criterion),
            total: total,
            percentile: total.zero? ? 0 : ((total - scoped_service.send(:current_position_by_criterion) + 1).to_f / total * 100).round(1),
            criterion_slug: criterion_slug,
            criterion_title: scoped_service.send(:criterion_title)
          }
        else
        position = Company.active
                          .joins(:categories)
                          .where(categories: { id: category.id })
                          .where('rating_avg > ? OR (rating_avg = ? AND rating_count > ?)',
                                 comparison_rating(company), comparison_rating(company), company.rating_count)
                          .count + 1

        total = Company.active
                       .joins(:categories)
                       .where(categories: { id: category.id })
                       .count

        {
          category_id: category.id,
          category_name: category.name,
          position: position,
          total: total,
          percentile: total.zero? ? 0 : ((total - position + 1).to_f / total * 100).round(1)
        }
        end
      end
    end

    def ranked_companies
      @ranked_companies ||= if criterion_slug.present?
                              base_scope.to_a.sort_by { |comp| [-comparison_rating(comp).to_f, -comp.rating_count.to_i] }
                            else
                              base_scope.order(rating_avg: :desc, rating_count: :desc).to_a
                            end
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
        scope = comp.review_aggregates
        scope = scope.find_by(category_id: category_id) if category_id.present?
        scope ||= comp.review_aggregates.find_by(category_id: nil)
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
        x_axis_label: criterion_slug.present? ? "Trust Authority · #{criterion_title || criterion_slug.to_s.humanize}" : 'Trust Authority',
        y_axis_label: 'Execution Power'
      }
    end
  end
end
