# frozen_string_literal: true

module Mcp
  module Public
    # Reutiliza o mesmo snapshot autorizado da Brand Page pública, sem expor rascunhos.
    class BrandHeroSnapshot
      def self.call(company)
        ::BrandHero::PublicSnapshot.call(company: company, url_for_attachment: method(:public_image_url))
      end

      def self.public_image_url(attachment)
        return unless attachment.attached?

        Rails.application.routes.url_helpers.rails_storage_proxy_url(
          attachment, host: 'api.avaliasolar.com.br', protocol: 'https'
        )
      end

      private_class_method :public_image_url
    end
  end
end
