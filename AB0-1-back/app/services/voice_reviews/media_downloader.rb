module VoiceReviews
  module MediaDownloader
    class Fake
      def download!(_asset)
        nil
      end
    end

    class Meta
      def download!(asset)
        token = ENV.fetch('META_ACCESS_TOKEN')
        version = ENV.fetch('META_GRAPH_API_VERSION', 'v23.0')
        media = HTTParty.get("https://graph.facebook.com/#{version}/#{asset.provider_media_id}",
                             headers: { 'Authorization' => "Bearer #{token}" })
        raise 'Falha ao obter metadados de mídia Meta' unless media.success? && media['url'].present?

        response = HTTParty.get(media['url'], headers: { 'Authorization' => "Bearer #{token}" })
        raise 'Falha ao baixar mídia Meta' unless response.success?
        raise 'Mídia de voz excede o limite' if response.body.bytesize > 10.megabytes
        raise 'Formato de áudio não permitido' unless asset.mime_type.to_s.match?(/\Aaudio\/(ogg|mpeg|mp4|webm)/i)
        if asset.sha256.present? && !asset.sha256.start_with?('SYNTHETIC_')
          raise 'Checksum da mídia não confere' unless Digest::SHA256.hexdigest(response.body) == asset.sha256
        end

        asset.file.attach(io: StringIO.new(response.body), filename: "#{asset.id}.audio", content_type: asset.mime_type,
                          key: asset.storage_key)
        asset.update!(byte_size: response.body.bytesize, status: 'stored')
      end
    end

    class Waha
      def download!(asset)
        api_key = VoiceReviews::Config.waha_api_key
        raise 'WAHA não configurado' if api_key.blank?

        url = media_url(asset.provider_media_url)
        response = HTTParty.get(url, headers: { 'X-Api-Key' => api_key }, timeout: 30)
        raise 'Falha ao baixar mídia WAHA' unless response.success?
        raise 'Mídia de voz excede o limite' if response.body.bytesize > 10.megabytes
        raise 'Formato de áudio não permitido' unless asset.mime_type.to_s.match?(/\Aaudio\/(ogg|mpeg|mp4|webm)/i)

        asset.file.attach(io: StringIO.new(response.body), filename: "#{asset.id}.audio", content_type: asset.mime_type,
                          key: asset.storage_key)
        asset.update!(byte_size: response.body.bytesize, status: 'stored')
      rescue URI::InvalidURIError
        raise 'URL de mídia WAHA inválida'
      end

      private

      def media_url(raw_url)
        base = URI.parse(VoiceReviews::Config.waha_base_url)
        candidate = URI.parse(raw_url.to_s)
        path = candidate.path.to_s
        raise 'Caminho de mídia WAHA inválido' unless path.start_with?('/api/files/')

        URI.join("#{base.scheme}://#{base.host}:#{base.port}", path).to_s
      end
    end

    module_function

    def provider(provider_name = nil)
      case (provider_name.presence || VoiceReviews::Config.provider).to_s
      when 'meta' then Meta.new
      when 'waha' then Waha.new
      else Fake.new
      end
    end
  end
end
