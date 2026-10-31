# frozen_string_literal: true

require 'digest'
require 'marcel'

module Sales
  module EmailAssets
    class UploadService
      class UploadError < StandardError; end
      class InvalidFileTypeError < UploadError; end
      class FileTooLargeError < UploadError; end

      ALLOWED_MIME_TYPES = %w[image/jpeg image/png image/webp].freeze
      MAX_BYTE_SIZE = 5.megabytes
      MAX_DIMENSION = 2400

      def self.call(file:, company:, user:, kind: 'other', alt_text: nil, name: nil)
        new(file:, company:, user:, kind:, alt_text:, name:).call
      end

      def initialize(file:, company:, user:, kind: 'other', alt_text: nil, name: nil)
        @file = file
        @company = company
        @user = user
        @kind = kind.presence || 'other'
        @alt_text = alt_text
        @name = name
      end

      def call
        validate_presence!
        validate_size!
        detected_mime = detect_and_validate_mime!

        file_path = @file.tempfile.path
        checksum = Digest::SHA256.file(file_path).hexdigest
        width, height = extract_dimensions(file_path, detected_mime)

        asset_name = @name.presence || @file.original_filename.presence || "imagem-#{Time.current.to_i}"
        sanitized_name = File.basename(asset_name).gsub(/[^a-zA-Z0-9.\-_]/, '_')

        asset = ::Sales::EmailAsset.new(
          company: @company,
          uploaded_by: @user,
          name: sanitized_name,
          kind: ::Sales::EmailAsset::KINDS.include?(@kind) ? @kind : 'other',
          alt_text: @alt_text,
          mime_type: detected_mime,
          byte_size: @file.size,
          width_px: width,
          height_px: height,
          checksum_sha256: checksum,
          status: 'ready',
          metadata: {
            original_filename: @file.original_filename,
            detected_mime_type: detected_mime,
            uploaded_at: Time.current.iso8601
          }
        )

        asset.file.attach(
          io: File.open(file_path),
          filename: sanitized_name,
          content_type: detected_mime
        )

        asset.save!
        asset.update_column(:public_url, asset.resolve_public_url)
        asset
      end

      private

      def validate_presence!
        raise UploadError, 'Arquivo de imagem obrigatório.' if @file.nil?
        raise UploadError, 'Empresa ou usuário remetente inválido.' unless @company && @user
      end

      def validate_size!
        if @file.size > MAX_BYTE_SIZE
          raise FileTooLargeError, "Arquivo excede o limite máximo de #{MAX_BYTE_SIZE / 1.megabyte} MB."
        end
        if @file.size <= 0
          raise UploadError, 'Arquivo de imagem vazio.'
        end
      end

      def detect_and_validate_mime!
        @file.tempfile.rewind if @file.tempfile.respond_to?(:rewind)
        detected = Marcel::MimeType.for(@file.tempfile, name: @file.original_filename)

        unless ALLOWED_MIME_TYPES.include?(detected)
          raise InvalidFileTypeError, "Tipo de arquivo não permitido: '#{detected}'. Apenas JPEG, PNG e WebP são aceitos."
        end

        detected
      end

      def extract_dimensions(path, mime)
        # Tenta extrair dimensões via ActiveStorage Analyzer ou ImageProcessing/MiniMagick/Vips
        begin
          if defined?(ActiveStorage::Analyzer::ImageAnalyzer::ImageMagick)
            analyzer = ActiveStorage::Analyzer::ImageAnalyzer::ImageMagick.new(OpenStruct.new(service: OpenStruct.new(download: File.binread(path))))
            meta = analyzer.metadata rescue {}
            return [meta[:width], meta[:height]] if meta[:width] && meta[:height]
          end
        rescue StandardError
          # Fallback
        end

        # Leitor simples de dimensões JPEG/PNG binário rápido sem dependência externa
        fast_image_dimensions(path, mime)
      end

      def fast_image_dimensions(path, mime)
        case mime
        when 'image/png'
          # PNG IHDR chunk: bytes 16-23 (4 bytes width, 4 bytes height big-endian)
          header = File.binread(path, 24)
          if header && header[0..7] == "\x89PNG\r\n\x1a\n".b
            w, h = header[16..23].unpack('N2')
            return [w, h]
          end
        when 'image/jpeg'
          # Varredura básica de markers JPEG SOF0/SOF2
          File.open(path, 'rb') do |f|
            return nil unless f.read(2) == "\xFF\xD8".b
            while (marker = f.read(2))
              break if marker.nil? || marker.size < 2
              break if marker[0] != "\xFF".b
              m_type = marker[1].ord
              break if m_type == 0xDA || m_type == 0xD9 # SOS ou EOI

              len = f.read(2).unpack1('n') rescue nil
              break unless len && len >= 2

              if [0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7].include?(m_type)
                data = f.read(5)
                if data && data.size == 5
                  _precision, h, w = data.unpack('Cnn')
                  return [w, h]
                end
              else
                f.seek(len - 2, IO::SEEK_CUR)
              end
            end
          end
        end
        [nil, nil]
      rescue StandardError
        [nil, nil]
      end
    end
  end
end
