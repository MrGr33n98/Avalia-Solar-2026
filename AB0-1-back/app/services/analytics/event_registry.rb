# frozen_string_literal: true

module Analytics
  class EventRegistry
    CACHE_KEY_PREFIX = 'analytics:event_registry:'
    CACHE_TTL = 15.minutes

    def self.fetch(event_type)
      return nil unless ActiveRecord::Base.connection.adapter_name =~ /postgre/i

      Rails.cache.fetch("#{CACHE_KEY_PREFIX}#{event_type}", expires_in: CACHE_TTL) do
        sql = 'SELECT * FROM event_definitions WHERE event_type = $1 LIMIT 1'
        res = ActiveRecord::Base.connection.exec_query(sql, 'RegistryFetch', [[nil, event_type]])
        res.first
      end
    end
  end
end
