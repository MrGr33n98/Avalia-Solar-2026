# frozen_string_literal: true

module Sales
  class EmailSignature < ApplicationRecord
    self.table_name = 'sales_email_signatures'

    DEFAULT_AVATAR_URL = 'https://www.avaliasolar.com.br/images/foto-felipe-assinatura-avalia-solar.png'
    DEFAULT_LOGO_URL = 'https://www.avaliasolar.com.br/images/avalia-solar-logo-horizontal.png'

    belongs_to :company

    belongs_to :user
    belongs_to :email_account, class_name: 'Sales::EmailAccount', foreign_key: :sales_email_account_id, optional: true

    before_validation :normalize_body_html

    validates :name, :body_html, presence: true

    def self.normalize_html(raw_html)
      return '' if raw_html.blank?

      html = raw_html.to_s.dup

      # 1. Substituir URLs relativas e nome antigo de arquivo pelo endereço público HTTPS oficial
      html.gsub!(%r{src=(["'])/images/([^"']+)\1}i, 'src="https://www.avaliasolar.com.br/images/\2"')
      html.gsub!('felipe-assinatura-avatar.png', 'foto-felipe-assinatura-avalia-solar.png')

      # 2. Normalizar qualquer tag <img> (especialmente avatar 83x83 ou com data: URI ou sem atributo src)
      html.gsub!(/<img\b[^>]*>/im) do |img_tag|
        is_logo = img_tag.match?(/alt=(["'])Avalia Solar\1/i) || img_tag.include?('avalia-solar-logo')
        fallback_url = is_logo ? DEFAULT_LOGO_URL : DEFAULT_AVATAR_URL

        tag = img_tag.dup

        if tag.match?(/\bsrc\s*=\s*(["'])\s*data:.*?\1/im)
          tag.sub!(/\bsrc\s*=\s*(["'])\s*data:.*?\1/im, %(src="#{fallback_url}"))
        elsif tag.match?(/\bsrc\s*=\s*(["'])\s*\1/im)
          tag.sub!(/\bsrc\s*=\s*(["'])\s*\1/im, %(src="#{fallback_url}"))
        elsif !tag.match?(/\bsrc\s*=/i)
          tag.sub!(/\A<img\b/i, %(<img src="#{fallback_url}"))
        end

        tag
      end

      html
    end

    private

    def normalize_body_html
      self.body_html = self.class.normalize_html(body_html) if body_html.present?
    end
  end
end
