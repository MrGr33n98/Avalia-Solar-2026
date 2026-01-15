module Videos
  class YouTubeExtractor
    YT_REGEX = %r{
      (?:https?:\/\/)?                                      # scheme
      (?:www\.)?                                           # www
      (?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)
      (?<id>[A-Za-z0-9_\-]{6,})                             # video id
    }x.freeze

    def self.extract(url)
      return { valid: false, error: 'URL vazia' } if url.blank?
      match = url.match(YT_REGEX)
      return { valid: false, error: 'URL do YouTube inválida' } unless match
      video_id = match[:id]
      thumb = "https://img.youtube.com/vi/#{video_id}/hqdefault.jpg"
      { valid: true, video_id: video_id, thumbnail_url: thumb, provider: 'youtube' }
    end
  end
end

