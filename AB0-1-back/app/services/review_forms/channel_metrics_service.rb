# frozen_string_literal: true

module ReviewForms
  class ChannelMetricsService
    CANONICAL_CHANNELS = %w[link qr whatsapp email widget whatsapp_voice].freeze

    def self.call(review_form:, range: nil)
      event_scope = review_form.review_form_events
      event_scope = event_scope.where(created_at: range) if range

      # Agrupa eventos por source e event_type
      events_by_channel = Hash.new { |h, k| h[k] = { views: 0, starts: 0 } }

      event_scope.where(event_type: %w[form_viewed qr_scanned review_started])
                 .group(:source, :event_type)
                 .count
                 .each do |(source, event_type), count|
        normalized = SourceNormalizer.call(source)
        if %w[form_viewed qr_scanned].include?(event_type)
          events_by_channel[normalized][:views] += count
        elsif event_type == 'review_started'
          events_by_channel[normalized][:starts] += count
        end
      end

      # Agrupa reviews por collection_channel em metadata
      review_scope = review_form.reviews
      review_scope = review_scope.where(created_at: range) if range

      reviews_by_channel = Hash.new { |h, k| h[k] = { submissions: 0, approved: 0 } }

      review_scope.find_each do |review|
        raw_chan = review.metadata&.dig('collection_channel')
        channel = if raw_chan.present?
                    SourceNormalizer.call(raw_chan)
                  elsif review.capture_flow_source == 'whatsapp_voice'
                    'whatsapp_voice'
                  elsif review.capture_flow_source == 'qr_code_form'
                    'qr'
                  else
                    'unassigned'
                  end

        reviews_by_channel[channel][:submissions] += 1
        reviews_by_channel[channel][:approved] += 1 if review.status.to_s == 'approved'
      end

      # Monta payload consolidado por canal
      channels_payload = {}
      (CANONICAL_CHANNELS + ['unassigned']).each do |channel|
        ev = events_by_channel[channel] || { views: 0, starts: 0 }
        rev = reviews_by_channel[channel] || { submissions: 0, approved: 0 }

        views = ev[:views]
        submissions = rev[:submissions]
        conversion = views.positive? ? ((submissions.to_f / views) * 100).round(1) : 0.0

        channels_payload[channel] = {
          views: views,
          starts: ev[:starts],
          submissions: submissions,
          approved: rev[:approved],
          conversion_rate: conversion
        }
      end

      {
        channels: channels_payload,
        total: MetricsService.call(review_form: review_form, range: range)
      }
    end
  end
end

