# frozen_string_literal: true

module CompanyDashboard
  module Positioning
    class CalculatorV2 < Calculator
      def y_breakdown_for(record, criterion_signal)
        base = {
          leads: normalize_log(record.leads_count.to_f, Definition::CAPS_V2[:execution_leads_max]) * 35.0,
          engagement: blended_engagement_score_for(record) * 25.0,
          conversion_efficiency: conversion_efficiency_score_for(record) * 20.0,
          operational_maturity: operational_maturity_score_for(record) * 10.0
        }
        multiplier = @criterion_slug.present? ? 1.0 : (100.0 / 90.0)
        breakdown = base.transform_values { |value| value * multiplier }
        breakdown[:criterion_fit] = criterion_signal * 10.0 if @criterion_slug.present?
        breakdown
      end

      def blended_engagement_score_for(record)
        recent_engagement = extract_recent_engagement(record)
        if recent_engagement.positive?
          return normalize_log(recent_engagement, Definition::CAPS_V2[:execution_engagement_max])
        end

        views = normalize_log(record.profile_views_count.to_f, Definition::CAPS_V2[:execution_views_max])
        clicks = normalize_log(record.cta_clicks_count.to_f, Definition::CAPS_V2[:execution_clicks_max])
        (views * 0.55) + (clicks * 0.45)
      end

      def conversion_efficiency_score_for(record)
        views = record.profile_views_count.to_f
        clicks = record.cta_clicks_count.to_f
        leads = record.leads_count.to_f

        view_to_click = (clicks + 1.0) / (views + 25.0)
        click_to_lead = (leads + 0.5) / (clicks + 10.0)

        view_score = [view_to_click / Definition::CAPS_V2[:view_to_click_cap], 1.0].min
        lead_score = [click_to_lead / Definition::CAPS_V2[:click_to_lead_cap], 1.0].min

        (view_score * 0.45) + (lead_score * 0.55)
      end

      private

      def extract_recent_engagement(record)
        breakdown = record.respond_to?(:ranking_breakdown) ? record.ranking_breakdown : nil
        return 0.0 unless breakdown

        data = if breakdown.is_a?(String)
                 begin
                   JSON.parse(breakdown)
                 rescue StandardError
                   {}
                 end
               elsif breakdown.is_a?(Hash)
                 breakdown
               else
                 {}
               end

        data['recent_engagement'].to_f
      end
    end
  end
end
