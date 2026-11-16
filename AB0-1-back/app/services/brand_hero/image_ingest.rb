# frozen_string_literal: true

module BrandHero
  class ImageIngest
    class InvalidImage < StandardError; end

    def self.call(slide:, upload:)
      raise InvalidImage, 'Envie uma imagem' unless upload
      raise InvalidImage, 'Imagem acima de 5 MB' if upload.size > CompanyHeroSlide::MAX_BYTES

      # Never trust only the browser-supplied Content-Type.
      detected_type = Marcel::MimeType.for(upload.tempfile, name: upload.original_filename)
      unless CompanyHeroSlide::ALLOWED_TYPES.include?(detected_type)
        raise InvalidImage, 'Formato inválido: use PNG, JPG ou WebP'
      end

      slide.image.attach(upload)
      blob = slide.image.blob
      blob.analyze

      meta = blob.metadata
      width = meta['width'].to_i
      height = meta['height'].to_i
      if width < 800 || height < 200 || width.to_i * height.to_i > 35_000_000
        raise InvalidImage, 'Imagem precisa ter ao menos 800×200px e até 35 megapixels'
      end

      slide.assign_attributes(image_width: width, image_height: height,
                              image_format: detected_type, image_bytes: blob.byte_size)
      slide
    rescue InvalidImage
      raise
    rescue StandardError => e
      Rails.logger.warn("[BrandHero] rejected unreadable upload: #{e.class}: #{e.message}")
      raise InvalidImage, 'Não foi possível analisar a imagem'
    end
  end
end
