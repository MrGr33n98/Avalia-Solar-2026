# frozen_string_literal: true

require 'base64'
require 'stringio'

module Sales
  class EmailSignature < ApplicationRecord
    self.table_name = 'sales_email_signatures'

    DEFAULT_AVATAR_URL = 'https://www.avaliasolar.com.br/images/foto-felipe-assinatura-avalia-solar.png'
    DEFAULT_LOGO_URL = 'https://www.avaliasolar.com.br/images/avalia-solar-logo-horizontal.png'
    DEFAULT_WHATSAPP_ICON_URL = 'https://www.avaliasolar.com.br/images/email/whatsapp.png'
    ALLOWED_IMAGE_CONTENT_TYPES = %w[image/png image/jpeg image/jpg image/webp].freeze
    MAX_IMAGE_SIZE_BYTES = 5.megabytes

    belongs_to :company
    belongs_to :user
    belongs_to :email_account, class_name: 'Sales::EmailAccount', foreign_key: :sales_email_account_id, optional: true

    has_one_attached :avatar
    has_one_attached :logo

    before_validation :normalize_body_html

    validates :name, :body_html, presence: true

    def self.storage_url_options
      options = Rails.application.routes.default_url_options.dup
      if Rails.env.development? && (options[:host].blank? || options[:host] == 'localhost')
        options[:host] = 'localhost'
        options[:port] ||= 3001
        options[:protocol] ||= 'http'
      else
        base = ENV['API_BASE_URL'].presence || 'https://api.avaliasolar.com.br'
        uri = URI.parse(base) rescue nil
        if uri&.host
          options[:host] = uri.host
          options[:protocol] = uri.scheme || 'https'
          options[:port] = uri.port if uri.port && ![80, 443].include?(uri.port)
        else
          options[:host] ||= 'api.avaliasolar.com.br'
          options[:protocol] ||= 'https'
        end
      end
      options
    end

    def self.blob_public_url(blob_or_attachment)
      return nil unless blob_or_attachment

      Rails.application.routes.url_helpers.rails_storage_proxy_url(blob_or_attachment, storage_url_options)
    rescue StandardError => e
      Rails.logger.warn("[Sales::EmailSignature] Falha ao gerar URL publica do blob: #{e.message}")
      nil
    end

    def self.upload_data_uri_to_blob(data_uri, kind: 'avatar')
      match = data_uri.to_s.match(/\Adata:(image\/[a-zA-Z0-9.+-]+);base64,(.+)\z/m)
      return nil unless match

      content_type = match[1].downcase
      return nil unless ALLOWED_IMAGE_CONTENT_TYPES.include?(content_type)

      decoded = Base64.decode64(match[2])
      return nil if decoded.bytesize > MAX_IMAGE_SIZE_BYTES || decoded.bytesize.zero?

      ext = content_type.split('/').last.sub('jpeg', 'jpg')
      blob = ActiveStorage::Blob.create_and_upload!(
        io: StringIO.new(decoded),
        filename: "signature-#{kind}-#{Time.current.to_i}.#{ext}",
        content_type: content_type
      )
      blob_public_url(blob)
    rescue StandardError => e
      Rails.logger.warn("[Sales::EmailSignature] Falha ao converter data URI em ActiveStorage Blob: #{e.message}")
      nil
    end

    def self.normalize_whatsapp_number(raw_phone)
      digits = raw_phone.to_s.gsub(/\D/, '')
      return '5565993465055' if digits.blank?

      digits = "55#{digits}" if digits.length <= 11 && !digits.start_with?('55')
      digits
    end

    def self.normalize_html(raw_html)
      return '' if raw_html.blank?

      html = raw_html.to_s.dup

      # 1. Substituir URLs relativas e nome legado pelo endereço público HTTPS
      html.gsub!(%r{src=(["'])/images/([^"']+)\1}i, 'src="https://www.avaliasolar.com.br/images/\2"')
      html.gsub!('felipe-assinatura-avatar.png', 'foto-felipe-assinatura-avalia-solar.png')

      # 2. Converter qualquer link tel: legado na assinatura para ícone clicável do WhatsApp (wa.me)
      html.gsub!(%r{<a\b[^>]*href=(["'])tel:([^"']*)\1[^>]*>.*?</a>}im) do
        phone_digits = normalize_whatsapp_number(Regexp.last_match(2))
        %(<a href="https://wa.me/#{phone_digits}" target="_blank" rel="noopener noreferrer" title="Conversar pelo WhatsApp" style="display:inline-block;vertical-align:middle;text-decoration:none;"><img src="#{DEFAULT_WHATSAPP_ICON_URL}" width="18" height="18" alt="WhatsApp" style="display:inline-block;vertical-align:middle;width:18px;height:18px;border:0;" /></a>)
      end

      # 3. Normalizar tags <img>: se tiver data:image/..., persiste no ActiveStorage e usa a URL HTTPS gerada;
      #    se já tiver URL HTTP(S) válida (inclusive foto enviada pelo usuário), preserva integralmente;
      #    apenas usa fallback se src estiver vazio ou ausente.
      html.gsub!(/<img\b[^>]*>/im) do |img_tag|
        is_logo = img_tag.match?(/alt=(["'])Avalia Solar\1/i) || img_tag.include?('avalia-solar-logo')
        is_whatsapp = img_tag.match?(/alt=(["'])WhatsApp\1/i) || img_tag.include?('whatsapp.png')
        fallback_url = if is_whatsapp
                         DEFAULT_WHATSAPP_ICON_URL
                       elsif is_logo
                         DEFAULT_LOGO_URL
                       else
                         DEFAULT_AVATAR_URL
                       end

        tag = img_tag.dup

        if (data_match = tag.match(/\bsrc\s*=\s*(["'])\s*(data:image\/[^"']+)\1/im))
          uploaded_url = upload_data_uri_to_blob(data_match[2], kind: is_logo ? 'logo' : 'avatar')
          replacement_url = uploaded_url.presence || fallback_url
          tag.sub!(/\bsrc\s*=\s*(["'])\s*data:.*?\1/im, %(src="#{replacement_url}"))
        elsif tag.match?(/\bsrc\s*=\s*(["'])\s*\1/im)
          tag.sub!(/\bsrc\s*=\s*(["'])\s*\1/im, %(src="#{fallback_url}"))
        elsif !tag.match?(/\bsrc\s*=/i)
          tag.sub!(/\A<img\b/i, %(<img src="#{fallback_url}"))
        end

        tag
      end

      html
    end

    def avatar_public_url
      return self.class.blob_public_url(avatar) if avatar.attached?

      stored = safe_settings['avatar_url'].presence
      return stored if stored.present? && !stored.start_with?('data:')

      extract_field_from_html(:avatar_url) || DEFAULT_AVATAR_URL
    end

    def logo_public_url
      return self.class.blob_public_url(logo) if logo.attached?

      stored = safe_settings['logo_url'].presence
      return stored if stored.present? && !stored.start_with?('data:')

      extract_field_from_html(:logo_url) || DEFAULT_LOGO_URL
    end

    def safe_settings
      return {} unless has_attribute?(:settings) && self[:settings].is_a?(Hash)

      self[:settings]
    rescue StandardError
      {}
    end

    def structured_fields
      s = safe_settings
      {
        full_name: s['full_name'].presence || extract_field_from_html(:full_name) || 'Felipe Henrique',
        role_title: s['role_title'].presence || extract_field_from_html(:role_title) || 'Fundador do Avalia Solar',
        email: s['email'].presence || extract_field_from_html(:email) || 'felipe@avaliasolar.com.br',
        phone: s['phone'].presence || extract_field_from_html(:phone) || '(65) 99346-5055',
        avatar_url: avatar_public_url,
        logo_url: logo_public_url,
        website_url: s['website_url'].presence || extract_field_from_html(:website_url) || 'https://www.avaliasolar.com.br/',
        linkedin_url: s['linkedin_url'].presence || extract_field_from_html(:linkedin_url) || 'https://www.linkedin.com/in/felipe-morais-8bb61a7b/',
        calendly_url: s['calendly_url'].presence || extract_field_from_html(:calendly_url) || 'https://calendly.com/felipe-avaliasolar/30min',
        cta_text: s['cta_text'].presence || extract_field_from_html(:cta_text) || 'Agendar 30 min ↗',
        footer_tagline: s['footer_tagline'].presence || extract_field_from_html(:footer_tagline) || 'ENERGIA SOLAR ● MOBILIDADE ELÉTRICA ● CONFIANÇA DIGITAL'
      }
    end

    private

    def extract_field_from_html(field)
      html = body_html.to_s
      return nil if html.blank?

      case field
      when :avatar_url
        html.match(/<img\b[^>]*src=["']([^"']+)["'][^>]*width=["']83["']/i)&.captures&.first ||
          html.match(/<img\b[^>]*width=["']83["'][^>]*src=["']([^"']+)["']/i)&.captures&.first
      when :logo_url
        html.match(/<img\b[^>]*src=["']([^"']+)["'][^>]*alt=["']Avalia Solar["']/i)&.captures&.first ||
          html.match(/<img\b[^>]*alt=["']Avalia Solar["'][^>]*src=["']([^"']+)["']/i)&.captures&.first
      when :full_name
        html.match(/<strong>([^<]+)<\/strong>/i)&.captures&.first
      when :email
        html.match(/href=["']mailto:([^"']+)["']/i)&.captures&.first
      when :phone
        wa = html.match(%r{href=["']https://wa\.me/(\d+)["']}i)&.captures&.first
        return wa if wa.present?

        html.match(/href=["']tel:([^"']+)["']/i)&.captures&.first
      when :linkedin_url
        html.match(/href=["']([^"']*linkedin\.com[^"']*)["']/i)&.captures&.first
      when :calendly_url
        html.match(/href=["']([^"']*calendly\.com[^"']*)["']/i)&.captures&.first
      else
        nil
      end
    end

    def normalize_body_html
      self.body_html = self.class.normalize_html(body_html) if body_html.present?
    end
  end
end
