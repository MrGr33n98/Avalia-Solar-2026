# frozen_string_literal: true

module Reviews
  class ScoreCalculator
    attr_reader :review

    def initialize(review)
      @review = review
    end

    def calculate
      return review.rating if use_manual_rating_only?

      [(weighted_manual_rating + weighted_granular_scores + completeness_bonus).round(2), 5.0].min
    end

    private

    def use_manual_rating_only?
      review.is_legacy || review.review_criterion_scores.empty?
    end

    # 40% Rating Geral
    def weighted_manual_rating
      (review.rating || 0) * 0.4
    end

    # 50% Média Ponderada dos Critérios Granulares
    def weighted_granular_scores
      scores = review.review_criterion_scores.includes(:rating_criterion)
      return 0 if scores.empty?

      total_weight = 0
      weighted_sum = 0

      scores.each do |s|
        next if s.not_applicable? || s.score.nil?

        weight = s.rating_criterion&.weight || 1.0
        weighted_sum += (s.score * weight)
        total_weight += weight
      end

      return 0 if total_weight.zero?

      (weighted_sum / total_weight) * 0.5
    end

    # 10% Completude Editorial (Headline + Pros + Cons + Buyer Tip)
    def completeness_bonus
      score = 0
      score += 2.5 if review.headline.present?
      score += 2.5 if review.pros.present? && review.pros.any?
      score += 2.5 if review.cons.present? && review.cons.any?
      score += 2.5 if review.buyer_tip.present?

      # Escala de 0 a 5, então dividimos por 100 * 0.1 (ou seja, score * 0.1 / 10 * 5)
      # Se o máximo é 10 pontos de completude, 10 pontos -> 0.5 no rating final (10% de 5)
      (score / 10.0) * 0.5
    end
  end
end
