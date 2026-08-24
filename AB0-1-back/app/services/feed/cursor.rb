# frozen_string_literal: true

module Feed
  class Cursor
    def self.encode(published_at, id, score: nil)
      payload = { published_at: published_at.iso8601(6), id: id }
      payload[:score] = score if score
      Base64.strict_encode64(payload.to_json)
    rescue StandardError
      nil
    end

    def self.decode(cursor_string)
      return nil if cursor_string.blank?

      decoded = JSON.parse(Base64.strict_decode64(cursor_string))
      {
        published_at: Time.zone.parse(decoded['published_at']),
        id: decoded['id'].to_i,
        score: decoded['score']
      }
    rescue StandardError
      nil
    end
  end
end
