# frozen_string_literal: true

require 'date'

module CompanyAi
  # V1 calendar: interval starts inclusive, ends exclusive; overnight windows are forbidden.
  class BusinessCalendar
    DAYS = %w[sunday monday tuesday wednesday thursday friday saturday].freeze

    def initialize(config)
      raise ArgumentError, 'INVALID_CALENDAR' unless config.is_a?(Hash)
      @zone = ActiveSupport::TimeZone[config['timezone'].to_s]
      raise ArgumentError, 'INVALID_TIMEZONE' unless @zone
      @weekly = config.fetch('weekly', {})
      @exceptions = config.fetch('exceptions', {})
      raise ArgumentError, 'INVALID_WEEKLY' unless @weekly.is_a?(Hash) && @exceptions.is_a?(Hash)
      raise ArgumentError, 'UNKNOWN_DAY' unless (@weekly.keys - DAYS).empty?

      @weekly.each_value { |windows| validate_windows!(windows) }
      @exceptions.each do |date, windows|
        raise ArgumentError, 'INVALID_DATE' unless date.match?(/\A\d{4}-\d{2}-\d{2}\z/) && Date.iso8601(date)
        validate_windows!(windows)
      end
    rescue Date::Error
      raise ArgumentError, 'INVALID_DATE'
    end

    def open_at?(time)
      local = time.in_time_zone(@zone)
      date = local.to_date.iso8601
      windows = @exceptions.key?(date) ? @exceptions.fetch(date) : @weekly.fetch(DAYS[local.wday], [])
      minute = local.hour * 60 + local.min
      windows.any? { |window| minutes(window.fetch('start')) <= minute && minute < minutes(window.fetch('end')) }
    end

    private

    def validate_windows!(windows)
      raise ArgumentError, 'INVALID_WINDOWS' unless windows.is_a?(Array) && windows.size <= 5
      intervals = windows.map do |window|
        raise ArgumentError, 'INVALID_WINDOW' unless window.is_a?(Hash)
        from = minutes(window.fetch('start'))
        to = minutes(window.fetch('end'))
        raise ArgumentError, 'INVALID_INTERVAL' unless from < to

        [from, to]
      end
      intervals.sort.each_cons(2) { |one, two| raise ArgumentError, 'OVERLAP' if one[1] > two[0] }
    end

    def minutes(raw)
      raise ArgumentError, 'INVALID_TIME' unless raw.is_a?(String) && raw.match?(/\A(?:[01]\d|2[0-3]):[0-5]\d\z/)
      hour, minute = raw.split(':').map(&:to_i)
      hour * 60 + minute
    end
  end
end
