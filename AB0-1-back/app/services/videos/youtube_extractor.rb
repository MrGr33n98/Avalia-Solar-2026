# frozen_string_literal: true

require 'uri'

module Videos
  # Parses the public YouTube URL formats accepted by the company dashboard.
  # Keeping this logic at the API boundary prevents arbitrary URLs from being
  # persisted as embedded media.
  class YoutubeExtractor
    VIDEO_ID_PATTERN = /\A[a-zA-Z0-9_-]{11}\z/.freeze
    YOUTUBE_HOSTS = %w[youtube.com www.youtube.com m.youtube.com music.youtube.com].freeze
    SHORT_HOSTS = %w[youtu.be www.youtu.be].freeze

    def self.extract(url)
      new(url).extract
    end

    def initialize(url)
      @url = url.to_s.strip
    end

    def extract
      return invalid('Informe um link do YouTube') if @url.blank?

      uri = URI.parse(@url)
      return invalid('Use um link HTTPS do YouTube') unless uri.is_a?(URI::HTTP) && uri.scheme == 'https'

      video_id = extract_video_id(uri)
      return invalid('Link do YouTube inválido') unless video_id&.match?(VIDEO_ID_PATTERN)

      {
        valid: true,
        provider: 'youtube',
        video_id: video_id,
        thumbnail_url: "https://img.youtube.com/vi/#{video_id}/hqdefault.jpg"
      }
    rescue URI::InvalidURIError
      invalid('Link do YouTube inválido')
    end

    private

    def extract_video_id(uri)
      host = uri.host.to_s.downcase
      return uri.path.to_s.split('/').reject(&:blank?).first if SHORT_HOSTS.include?(host)
      return unless YOUTUBE_HOSTS.include?(host)

      query_video_id = URI.decode_www_form(uri.query.to_s).to_h['v']
      return query_video_id if query_video_id.present?

      path_parts = uri.path.to_s.split('/').reject(&:blank?)
      return unless %w[embed shorts live].include?(path_parts.first)

      path_parts.second
    end

    def invalid(message)
      { valid: false, error: message }
    end
  end
end
