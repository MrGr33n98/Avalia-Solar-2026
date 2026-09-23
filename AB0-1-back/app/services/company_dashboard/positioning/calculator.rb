# frozen_string_literal: true

module CompanyDashboard
  module Positioning
    class Calculator
      def initialize(trust_scores:, category_id: nil, criterion_slug: nil, criterion_title: nil,
                     quadrant_mode: 'default')
        @trust_scores = trust_scores
        @category_id = category_id
        @criterion_slug = criterion_slug.to_s.strip.presence
        @criterion_title = criterion_title.to_s.strip.presence
        @quadrant_mode = quadrant_mode == 'reviews' ? 'reviews' : 'default'
      end

      def calculate(record)
        return reviews_calculation(record) if @quadrant_mode == 'reviews'

        criterion_signal = normalize_criterion_score(criterion_score_for(record))
        result(x_breakdown_for(record, criterion_signal), y_breakdown_for(record, criterion_signal))
      end

      def x_breakdown_for(record, criterion_signal)
        multiplier = @criterion_slug.present? ? 0.85 : 1.0
        base = {
          trust_score: stored_trust_score_for(record) * Definition::X_AXIS[:trust_score],
          verification: verification_score_for(record) * Definition::X_AXIS[:verification],
          review_credibility: review_credibility_score_for(record) * Definition::X_AXIS[:review_credibility],
          badge_depth: badge_depth_score_for(record) * Definition::X_AXIS[:badge_depth],
          social_proof: social_proof_score_for(record) * Definition::X_AXIS[:social_proof]
        }
        breakdown = base.transform_values { |value| value * multiplier }
        breakdown[:criterion_fit] = criterion_signal * 15.0 if @criterion_slug.present?
        breakdown
      end

      def y_breakdown_for(record, criterion_signal)
        base = {
          leads: normalize(record.leads_count.to_f, Definition::CAPS[:execution_leads_max]) * 35.0,
          engagement: blended_engagement_score_for(record) * 25.0,
          conversion_efficiency: conversion_efficiency_score_for(record) * 20.0,
          operational_maturity: operational_maturity_score_for(record) * 10.0
        }
        multiplier = @criterion_slug.present? ? 1.0 : (100.0 / 90.0)
        breakdown = base.transform_values { |value| value * multiplier }
        breakdown[:criterion_fit] = criterion_signal * 10.0 if @criterion_slug.present?
        breakdown
      end

      def reviews_calculation(record)
        volume = normalize_log(record.reviews_count.to_f, Definition::CAPS[:review_volume_max])
        credibility = review_credibility_score_for(record)
        x_breakdown = { rating: normalize(record.rating_avg.to_f, 5.0) * 70.0, review_volume: volume * 30.0 }
        y_breakdown = { review_volume: volume * 45.0, review_credibility: credibility * 0.55 }
        result(x_breakdown, y_breakdown)
      end

      def result(x_breakdown, y_breakdown)
        {
          x_score: x_breakdown.values.sum.round(1),
          y_score: y_breakdown.values.sum.round(1),
          x_breakdown: x_breakdown.transform_values { |value| value.round(2) },
          y_breakdown: y_breakdown.transform_values { |value| value.round(2) }
        }
      end

      def stored_trust_score_for(record)
        @trust_scores.fetch(record.id, 0.0).to_f
      end

      def verification_score_for(record)
        record.verified? ? 100.0 : 0.0
      end

      def review_credibility_score_for(record)
        rating_score = normalize(record.rating_avg.to_f, 5.0)
        volume_score = normalize_log(record.reviews_count.to_f, Definition::CAPS[:review_volume_max])
        ((rating_score * 0.7) + (volume_score * 0.3)) * 100.0
      end

      def badge_depth_score_for(record)
        normalize(record.company_badges.size.to_f, Definition::CAPS[:badges_max]) * 100.0
      end

      def social_proof_score_for(record)
        record.social_proof_enabled? ? 100.0 : 0.0
      end

      def blended_engagement_score_for(record)
        views = normalize_log(record.profile_views_count.to_f, Definition::CAPS[:execution_views_max])
        clicks = normalize_log(record.cta_clicks_count.to_f, Definition::CAPS[:execution_clicks_max])
        (views * 0.55) + (clicks * 0.45)
      end

      def conversion_efficiency_score_for(record)
        view_to_click = safe_ratio(record.cta_clicks_count, record.profile_views_count)
        click_to_lead = safe_ratio(record.leads_count, record.cta_clicks_count)
        view_score = [view_to_click, Definition::CAPS[:view_to_click_cap]].min / Definition::CAPS[:view_to_click_cap]
        lead_score = [click_to_lead, Definition::CAPS[:click_to_lead_cap]].min / Definition::CAPS[:click_to_lead_cap]
        (view_score * 0.45) + (lead_score * 0.55)
      end

      def operational_maturity_score_for(record)
        signals = [
          record.verified?, record.social_proof_enabled?, record.whatsapp_enabled?,
          record.cta_whatsapp_enabled?, record.company_badges.any?
        ]
        signals.count(true).to_f / 5.0
      end

      def criterion_score_for(record)
        return nil if @criterion_slug.blank?

        breakdown = criteria_breakdown_for(record)
        breakdown[@criterion_title] || breakdown[@criterion_slug]
      end

      def criteria_breakdown_for(record)
        aggregate = if @category_id.present?
                      record.review_aggregates.to_a.find { |item| item.category_id == @category_id.to_i }
                    end
        aggregate ||= record.review_aggregates.to_a.find { |item| item.category_id.nil? }
        value = aggregate&.criteria_breakdown
        value.is_a?(Hash) ? value : {}
      end

      def normalize_criterion_score(score)
        normalize(score.to_f, 5.0)
      end

      def normalize(value, max)
        return 0.0 if max.to_f <= 0

        (value.to_f / max).clamp(0.0, 1.0)
      end

      def normalize_log(value, max)
        return 0.0 if value.to_f <= 0 || max.to_f <= 0

        [Math.log(1.0 + value.to_f) / Math.log(1.0 + max.to_f), 1.0].min
      end

      def safe_ratio(numerator, denominator)
        return 0.0 if denominator.to_f <= 0

        numerator.to_f / denominator
      end
    end
  end
end
