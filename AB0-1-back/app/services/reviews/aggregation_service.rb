# frozen_string_literal: true

# Service Object: Reviews::AggregationService
# Calculates scores and updates review_aggregates read model.
module Reviews
  class AggregationService
    def self.call(review_id)
      review = Review.find(review_id)
      new(review.company, review.category).recalculate!
    end

    def initialize(company, category = nil)
      @company = company
      @category = category
    end

    def recalculate!
      aggregate = fetch_aggregate
      
      reviews = base_scope
      count = reviews.count

      if count.zero?
        aggregate.update!(
          average_rating: 0,
          total_reviews: 0,
          scores_distribution: empty_distribution,
          criteria_breakdown: {}
        )
      else
        aggregate.update!(
          average_rating: @category.present? ? calculate_category_average(reviews) : calculate_global_average,
          total_reviews: count,
          scores_distribution: calculate_distribution(reviews),
          criteria_breakdown: calculate_criteria_breakdown(reviews)
        )
      end

      # Se recalculei uma categoria, dispara a atualização do Bucket Global (category_id: nil)
      if @category.present?
        self.class.new(@company, nil).recalculate!
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

    # Média ponderada dos critérios snapshots para reviews moderna, ou rating para legadas
    def calculate_category_average(reviews)
      total_weighted_sum = 0.0
      total_count = 0.0

      reviews.find_each do |r|
        if r.granular_scores_snapshot.present?
          # Usa o snapshot JSONB persistido (Fonte de verdade V2)
          r_weighted_sum = 0.0
          r_weight_sum = 0.0
          
          r.granular_scores_snapshot.each do |s|
            weight = s['weight'].to_f > 0 ? s['weight'].to_f : 1.0
            r_weighted_sum += (s['score'].to_f * weight)
            r_weight_sum += weight
          end

          if r_weight_sum > 0
            total_weighted_sum += (r_weighted_sum / r_weight_sum)
          else
            total_weighted_sum += r.rating.to_f
          end
        else
          # Fallback para rating direto (Legado ou sem critérios)
          total_weighted_sum += r.rating.to_f
        end
        total_count += 1.0
      end

      return 0.0 if total_count.zero?
      (total_weighted_sum / total_count).round(2)
    end

    # Score Global: Média aritmética simples das médias de cada vertical ativa + bucket global puro (nil)
    # Isso evita que uma categoria com volume massivo "abafe" a nota de outra especialidade da empresa.
    def calculate_global_average
      category_averages = []

      # 1. Obter médias de cada categoria que possui reviews (calculadas na hora para garantir frescor)
      active_category_ids = @company.reviews.published.where.not(category_id: nil).distinct.pluck(:category_id)
      active_category_ids.each do |cat_id|
        cat_reviews = @company.reviews.published.where(category_id: cat_id)
        category_averages << calculate_category_average(cat_reviews)
      end

      # 2. Obter média das reviews que não possuem categoria (Bucket Global puro)
      uncategorized_reviews = @company.reviews.published.where(category_id: nil)
      if uncategorized_reviews.exists?
        category_averages << uncategorized_reviews.average(:rating).to_f
      end

      return 0.0 if category_averages.empty?
      (category_averages.sum.to_f / category_averages.size).round(2)
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

    def empty_distribution
      { "1" => 0, "2" => 0, "3" => 0, "4" => 0, "5" => 0 }
    end
  end
end
