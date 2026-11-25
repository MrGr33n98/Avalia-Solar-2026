# frozen_string_literal: true

module Mcp
  module Public
    # Fotos do acervo público da empresa e vídeos publicados; sem dados de moderação.
    class CompanyGallerySnapshot
      IMAGE_LIMIT = 6
      VIDEO_LIMIT = 3

      def self.call(company)
        new(company).call
      end

      def initialize(company)
        @company = company
      end

      def call
        { state: 'ready', images: images, videos: videos }
      rescue StandardError => e
        Rails.logger.warn("[MCP gallery] company_id=#{@company.id} error=#{e.class}")
        { state: 'error', images: [], videos: [] }
      end

      private

      def images
        # A Brand Page pública utiliza media_urls; não consultar filas de aprovação.
        Array(@company.media_urls).first(IMAGE_LIMIT).filter_map { |url| MediaUrl.allowed(url) }.uniq
      end

      def videos
        @company.published_videos.limit(VIDEO_LIMIT).filter_map do |video|
          next unless video.provider == 'youtube' && video.video_id.to_s.match?(/\A[A-Za-z0-9_-]{11}\z/)

          { id: video.id, url: "https://www.youtube.com/watch?v=#{video.video_id}",
            thumbnail_url: MediaUrl.allowed(video.thumbnail_url) }
        end
      end
    end
  end
end
