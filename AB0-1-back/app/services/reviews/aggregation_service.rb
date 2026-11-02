# frozen_string_literal: true

# Service Object: Reviews::AggregationService
# Calculates scores and updates review_aggregates read model.
module Reviews
  class AggregationService
    def self.call(review_id)
      review = Review.find_by(id: review_id)
      return unless review&.company

      recalculate_for_company!(review.company)
    end

    def self.recalculate_for_company!(company)
      return unless company

      # 1. Recalculate each active category aggregate
      active_category_ids = company.reviews.published.where.not(category_id: nil).distinct.pluck(:category_id)
      active_category_ids.each do |cat_id|
        category = Category.find_by(id: cat_id)
        new(company, category).recalculate_single_aggregate!
      end

      # 2. Destroy stale category aggregates that no longer have published reviews
      ReviewAggregate.where(company_id: company.id)
                     .where.not(category_id: nil)
                     .where.not(category_id: active_category_ids)
                     .destroy_all

      # 3. Recalculate global aggregate and sync denormalized company columns
      new(company, nil).recalculate_single_aggregate!
    end

    def initialize(company, category = nil)
      @company = company
      @category = category
    end

    def recalculate!
      self.class.recalculate_for_company!(@company)
    end

    def recalculate_single_aggregate!
      aggregate = fetch_aggregate
      
      reviews = base_scope
      count = reviews.count

      if count.zero?
        aggregate.update!(
          average_rating: 0,
          total_reviews: 0,
          scores_distribution: empty_distribution,
          criteria_breakdown: {},
          recommendation_rate: nil,
          nps_score: nil,
          nps_responses: 0
        )
      else
        rec_rate = calculate_recommendation_rate(reviews, count)
        nps_data = calculate_nps(reviews)

        aggregate.update!(
          average_rating: @category.present? ? calculate_category_average(reviews) : calculate_global_average,
          total_reviews: count,
          scores_distribution: calculate_distribution(reviews),
          criteria_breakdown: calculate_criteria_breakdown(reviews),
          recommendation_rate: rec_rate,
          nps_score: nps_data[:score],
          nps_responses: nps_data[:responses]
        )
      end

      if @category.nil?
        # Sync to Company denormalized cache for high-performance listing access and bust cache
        @company.update_columns(
          rating_avg: aggregate.total_reviews.positive? ? aggregate.average_rating : nil,
          rating_count: aggregate.total_reviews,
          updated_at: Time.current
        )
        Rails.cache.delete_matched("company_detail_payload_v1/#{@company.id}/*") rescue nil
        Rails.cache.delete_matched("company_buttons/#{@company.id}/*") rescue nil
      end
    end

    private

    def fetch_aggregate
      ReviewAggregate.find_or_initialize_by(
        company_id: @company.id,
        category_id: @category&.id
      )
    end

    def base_scope
      scope = @company.reviews.published
      @category.present? ? scope.where(category_id: @category.id) : scope
    end

    # Média aritmética das notas oficiais (rating) das avaliações publicadas na categoria
    def calculate_category_average(reviews)
      return 0.0 if reviews.empty?

      reviews.average(:rating).to_f.round(2)
    end

    # Score Global: Média aritmética das notas oficiais de todas as avaliações publicadas da empresa
    def calculate_global_average
      all_reviews = @company.reviews.published
      return 0.0 if all_reviews.empty?

      all_reviews.average(:rating).to_f.round(2)
    end

    def calculate_distribution(reviews)
      distribution = empty_distribution
      counts = reviews.group("FLOOR(rating)").count
      counts.each { |rating, count| distribution[rating.to_i.to_s] = count if distribution.key?(rating.to_i.to_s) }
      distribution
    end

    def calculate_criteria_breakdown(reviews)
      return {} if @category.nil? # Breakdown só por categoria

      # Usa os dados normalizados de review_criterion_scores ou o snapshot?
      # Para o breakdown agregado, os snapshots em JSONB são mais rápidos se usarmos SQL puro, 
      # mas para MVP usaremos a associação normalizada baseada em snapshots de título.
      breakdown = {}
      scores = ReviewCriterionScore.where(review_id: reviews.select(:id)).where.not(title_snapshot: nil)
      data = scores.group(:title_snapshot).average(:score)
      data.each { |title, avg| breakdown[title] = avg.to_f.round(2) }
      breakdown
    end

    def calculate_recommendation_rate(reviews, count)
      rec_reviews = reviews.where("metadata->>'would_recommend' IS NOT NULL")
      rec_total = rec_reviews.count
      if rec_total.positive?
        positive_recs = rec_reviews.where("metadata->>'would_recommend' IN ('true', 't', '1', 'yes')").count
        ((positive_recs.to_f / rec_total) * 100).round(2)
      else
        pos_stars = reviews.where('rating >= 4').count
        ((pos_stars.to_f / count) * 100).round(2)
      end
    end

    def calculate_nps(reviews)
      nps_reviews = reviews.where.not(nps_score: nil)
      nps_count = nps_reviews.count
      return { score: nil, responses: 0 } if nps_count.zero?

      promoters = nps_reviews.where('nps_score >= 9').count
      detractors = nps_reviews.where('nps_score <= 6').count
      score = (((promoters - detractors).to_f / nps_count) * 100).round(2)
      { score: score, responses: nps_count }
    end

    def empty_distribution
      { "1" => 0, "2" => 0, "3" => 0, "4" => 0, "5" => 0 }
    end
  end
end
