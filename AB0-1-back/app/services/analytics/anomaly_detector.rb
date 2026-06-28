# frozen_string_literal: true

module Analytics
  # Service for detecting anomalies in analytics data
  # Implements statistical detection for spikes, drops, and outliers
  class AnomalyDetector
    # Thresholds for anomaly detection
    SPIKE_THRESHOLD = 2.0    # 2x standard deviations above mean
    DROP_THRESHOLD = -2.0    # 2x standard deviations below mean
    MIN_BASELINE_DAYS = 7    # Minimum days for baseline calculation
    PERCENTAGE_THRESHOLD = 50 # 50% change threshold

    def initialize(event_type: nil, lookback_days: 7)
      @event_type = event_type
      @lookback_days = lookback_days
    end

    # Detect anomalies in the last 24 hours
    def detect_recent_anomalies
      recent_stats = calculate_recent_stats
      baseline_stats = calculate_baseline_stats

      return [] if baseline_stats.nil?

      anomalies = []

      # Check for volume spikes
      if recent_stats[:count] > baseline_stats[:mean] + (SPIKE_THRESHOLD * baseline_stats[:stddev])
        percentage_change = ((recent_stats[:count] - baseline_stats[:mean]) / baseline_stats[:mean] * 100).round(1)

        anomalies << {
          type: 'spike',
          event_type: @event_type || 'all_events',
          current_value: recent_stats[:count],
          baseline_mean: baseline_stats[:mean].round(1),
          baseline_stddev: baseline_stats[:stddev].round(1),
          percentage_change: percentage_change,
          severity: severity_level(percentage_change),
          detected_at: Time.current
        }
      end

      # Check for volume drops
      if recent_stats[:count] < baseline_stats[:mean] + (DROP_THRESHOLD * baseline_stats[:stddev])
        percentage_change = ((baseline_stats[:mean] - recent_stats[:count]) / baseline_stats[:mean] * 100).round(1)

        anomalies << {
          type: 'drop',
          event_type: @event_type || 'all_events',
          current_value: recent_stats[:count],
          baseline_mean: baseline_stats[:mean].round(1),
          baseline_stddev: baseline_stats[:stddev].round(1),
          percentage_change: percentage_change,
          severity: severity_level(percentage_change),
          detected_at: Time.current
        }
      end

      anomalies
    end

    # Detect all types of anomalies with detailed metrics
    def comprehensive_detection
      {
        spikes_and_drops: detect_recent_anomalies,
        missing_session_ids: detect_missing_session_ids,
        missing_company_ids: detect_missing_company_ids,
        duplicates: detect_duplicates,
        summary: {
          total_anomalies: 0,
          critical_count: 0,
          warning_count: 0,
          info_count: 0
        }
      }.tap do |result|
        all_anomalies = result.values.flatten.compact
        result[:summary][:total_anomalies] = all_anomalies.count
        result[:summary][:critical_count] = all_anomalies.count { |a| a[:severity] == 'critical' }
        result[:summary][:warning_count] = all_anomalies.count { |a| a[:severity] == 'warning' }
        result[:summary][:info_count] = all_anomalies.count { |a| a[:severity] == 'info' }
      end
    end

    private

    def calculate_recent_stats
      scope = AnalyticsEvent.where('created_at >= ?', 24.hours.ago)
      scope = scope.where(event_type: @event_type) if @event_type

      {
        count: scope.count,
        period: '24h'
      }
    end

    def calculate_baseline_stats
      return nil if @lookback_days < MIN_BASELINE_DAYS

      # Get daily counts for the lookback period (excluding today)
      daily_counts = (@lookback_days.days.ago.to_date...Date.current).map do |date|
        scope = AnalyticsEvent.where(created_at: date.beginning_of_day..date.end_of_day)
        scope = scope.where(event_type: @event_type) if @event_type
        scope.count
      end

      return nil if daily_counts.empty?

      mean = daily_counts.sum.to_f / daily_counts.size
      variance = daily_counts.map { |x| (x - mean)**2 }.sum / daily_counts.size
      stddev = Math.sqrt(variance)

      {
        mean: mean,
        stddev: stddev,
        sample_size: daily_counts.size
      }
    end

    def detect_missing_session_ids
      scope = AnalyticsEvent.where('created_at >= ?', 24.hours.ago)
      scope = scope.where(event_type: @event_type) if @event_type

      total = scope.count
      return [] if total.zero?

      missing = scope.where('session_id IS NULL OR session_id = ?', '').count
      percentage = (missing.to_f / total * 100).round(1)

      return [] if percentage < 5 # Threshold: 5%

      [{
        type: 'missing_session_id',
        event_type: @event_type || 'all_events',
        missing_count: missing,
        total_count: total,
        percentage: percentage,
        severity: percentage > 20 ? 'critical' : 'warning',
        detected_at: Time.current
      }]
    end

    def detect_missing_company_ids
      # Only check events that should have company_id
      relevant_events = %w[company_profile_view company_click lead_submitted]

      scope = AnalyticsEvent.where('created_at >= ?', 24.hours.ago)
      scope = scope.where(event_type: relevant_events)
      scope = scope.where(event_type: @event_type) if @event_type && relevant_events.include?(@event_type)

      total = scope.count
      return [] if total.zero?

      missing = scope.where('company_id IS NULL').count
      percentage = (missing.to_f / total * 100).round(1)

      return [] if percentage < 10 # Threshold: 10%

      [{
        type: 'missing_company_id',
        event_type: @event_type || 'company_events',
        missing_count: missing,
        total_count: total,
        percentage: percentage,
        severity: percentage > 30 ? 'critical' : 'warning',
        detected_at: Time.current
      }]
    end

    def detect_duplicates
      # Check for duplicate events in the last hour (using dedupe table)
      recent_dupes = DedupedEvent.where('created_at >= ?', 1.hour.ago).count

      return [] if recent_dupes.zero?

      # Calculate duplicate rate
      total_events = AnalyticsEvent.where('created_at >= ?', 1.hour.ago).count
      duplicate_rate = (recent_dupes.to_f / (total_events + recent_dupes) * 100).round(2)

      return [] if duplicate_rate < 0.1 # Threshold: 0.1%

      [{
        type: 'duplicates_detected',
        event_type: @event_type || 'all_events',
        duplicate_count: recent_dupes,
        total_events: total_events,
        duplicate_rate: duplicate_rate,
        severity: duplicate_rate > 1.0 ? 'critical' : 'warning',
        detected_at: Time.current
      }]
    end

    def severity_level(percentage_change)
      case percentage_change.abs
      when 0...30
        'info'
      when 30...60
        'warning'
      else
        'critical'
      end
    end
  end
end
