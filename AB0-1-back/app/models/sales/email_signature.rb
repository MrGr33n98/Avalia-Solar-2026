# frozen_string_literal: true

require 'base64'
require 'cgi'
require 'stringio'
require 'uri'

module Sales
  class EmailSignature < ApplicationRecord
    self.table_name = 'sales_email_signatures'

    DEFAULT_AVATAR_URL = 'https://www.avaliasolar.com.br/images/foto-felipe-assinatura-avalia-solar.png'
    DEFAULT_LOGO_URL = 'https://www.avaliasolar.com.br/images/avalia-solar-logo-horizontal.png'
    DEFAULT_WHATSAPP_ICON_URL = 'https://www.avaliasolar.com.br/images/email/whatsapp.png'
    DEFAULT_MAIL_ICON_URL = 'https://www.avaliasolar.com.br/images/email/mail.png'
    DEFAULT_GLOBE_ICON_URL = 'https://www.avaliasolar.com.br/images/email/globe.png'
    DEFAULT_LINKEDIN_ICON_URL = 'https://www.avaliasolar.com.br/images/email/linkedin.png'
    DEFAULT_WATERMARK_URL = 'https://www.avaliasolar.com.br/images/email/avalia-solar-watermark.png'
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

    def self.parse_whatsapp_phone(raw_phone)
      raw = raw_phone.to_s.strip
      digits = raw.gsub(/\D/, '')
      return { valid: false, digits: '', formatted: '', url: '' } if digits.length < 8 || digits.length > 15

      has_intl_prefix = raw.start_with?('+') && !raw.start_with?('+55')

      if !has_intl_prefix && (digits.length == 10 || digits.length == 11)
        wa_digits = "55#{digits}"
        ddd = digits[0, 2]
        local = digits[2..]
        formatted = local.length == 9 ? "(#{ddd}) #{local[0, 5]}-#{local[5, 4]}" : "(#{ddd}) #{local[0, 4]}-#{local[4, 4]}"
        return { valid: true, digits: wa_digits, formatted: formatted, url: "https://wa.me/#{wa_digits}" }
      end

      if digits.start_with?('55') && (digits.length == 12 || digits.length == 13)
        national = digits[2..]
        ddd = national[0, 2]
        local = national[2..]
        formatted = local.length == 9 ? "(#{ddd}) #{local[0, 5]}-#{local[5, 4]}" : "(#{ddd}) #{local[0, 4]}-#{local[4, 4]}"
        return { valid: true, digits: digits, formatted: formatted, url: "https://wa.me/#{digits}" }
      end

      display = raw.start_with?('+') ? raw.gsub(/\s+/, ' ') : "+#{digits}"
      { valid: true, digits: digits, formatted: display, url: "https://wa.me/#{digits}" }
    end

    def self.normalize_whatsapp_number(raw_phone)
      parsed = parse_whatsapp_phone(raw_phone)
      parsed[:valid] ? parsed[:digits] : ''
    end

    def self.format_whatsapp_display(raw_phone)
      parsed = parse_whatsapp_phone(raw_phone)
      parsed[:valid] ? parsed[:formatted] : ''
    end

    def self.build_whatsapp_link_html(raw_phone)
      parsed = parse_whatsapp_phone(raw_phone)
      return '' unless parsed[:valid]

      escaped_display = CGI.escapeHTML(parsed[:formatted])
      %(<a href="#{parsed[:url]}" target="_blank" rel="noopener noreferrer" title="Conversar pelo WhatsApp" style="color:#0b2944;text-decoration:none;vertical-align:middle;white-space:nowrap;"><img src="#{DEFAULT_WHATSAPP_ICON_URL}" width="14" height="14" alt="WhatsApp" style="display:inline-block;vertical-align:middle;width:14px;height:14px;border:0;margin-right:4px;" /><span style="vertical-align:middle;color:#0b2944;font-weight:600;">#{escaped_display}</span></a>)
    end

    def self.safe_http_url(raw_url, fallback)
      candidate = raw_url.to_s.strip
      return fallback if candidate.blank?
      return fallback unless candidate.match?(%r{\Ahttps?://[^\s"'<>]+\z}i)

      CGI.escapeHTML(candidate)
    end

    def self.safe_email_address(raw_email, fallback = 'contato@avaliasolar.com.br')
      candidate = raw_email.to_s.strip
      return fallback if candidate.blank? || candidate.match?(/[<>"'\s]/)

      CGI.escapeHTML(candidate)
    end

    def self.build_v2_html(fields = {})
      f = fields.to_h.symbolize_keys
      full_name = CGI.escapeHTML((f[:full_name].presence || 'Felipe Henrique').to_s.strip)
      role_title = CGI.escapeHTML((f[:role_title].presence || 'Fundador do Avalia Solar').to_s.strip)
      email_addr = safe_email_address(f[:email], 'felipe@avaliasolar.com.br')
      avatar_src = safe_http_url(f[:avatar_url], DEFAULT_AVATAR_URL)
      logo_src = safe_http_url(f[:logo_url], DEFAULT_LOGO_URL)
      website_href = safe_http_url(f[:website_url], 'https://www.avaliasolar.com.br/')
      linkedin_href = safe_http_url(f[:linkedin_url], 'https://www.linkedin.com/in/felipe-morais-8bb61a7b/')
      calendly_href = safe_http_url(f[:calendly_url], 'https://calendly.com/felipe-avaliasolar/30min')
      cta_label = CGI.escapeHTML((f[:cta_text].presence || 'Agendar 30 min ↗').to_s.strip)
      footer_label = CGI.escapeHTML((f[:footer_tagline].presence || 'ENERGIA SOLAR ● MOBILIDADE ELÉTRICA ● CONFIANÇA DIGITAL').to_s.strip)

      wa_link_html = build_whatsapp_link_html(f[:phone])
      wa_segment = if wa_link_html.present?
                     %( <span style="color:#a2b2c2;vertical-align:middle;">&nbsp;·&nbsp;</span> #{wa_link_html})
                   else
                     ''
                   end

      <<~HTML.strip
        <!-- Assinatura Corporativa Avalia Solar V2 -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="550" bgcolor="#f6f9fd" style="width:550px;max-width:100%;border-collapse:separate;border-spacing:0;background-color:#f6f9fd;border:1px solid #dae5ef;font-family:Arial,Helvetica,sans-serif;color:#0b2944;">
          <tr>
            <td bgcolor="#eef4fa" width="120" valign="top" align="center" style="width:120px;background-color:#eef4fa;vertical-align:top;padding:17px 12px 12px 13px;border-right:3px solid #ffcd2d;">
              <img src="#{avatar_src}" width="83" height="83" alt="#{full_name}" style="width:83px;height:83px;display:block;object-fit:cover;border-radius:50%;border:2px solid #ffcd2d;" />
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:10px;"><tr><td bgcolor="#ffffff" style="background-color:#ffffff;padding:5px 7px;border-radius:4px;">
                <a href="#{website_href}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;"><img src="#{logo_src}" alt="Avalia Solar" width="92" style="display:block;width:92px;height:auto;border:0;" /></a>
              </td></tr></table>
            </td>
            <td valign="top" style="padding:14px 14px 12px 18px;vertical-align:top;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;">
                <tr>
                  <td valign="top" style="vertical-align:top;padding-right:8px;">
                    <p style="margin:0 0 2px;font-size:17px;line-height:1.23;letter-spacing:-0.3px;font-weight:700;color:#0b2944;"><strong>#{full_name}</strong></p>
                    <p style="margin:0 0 9px;font-size:11px;line-height:1.3;color:#63768a;">#{role_title}</p>
                    <p style="margin:0 0 4px;font-size:11px;line-height:1.45;color:#0b2944;">
                      <a href="mailto:#{email_addr}" style="color:#0b2944;text-decoration:none;vertical-align:middle;white-space:nowrap;"><img src="#{DEFAULT_MAIL_ICON_URL}" width="13" height="13" alt="" style="display:inline-block;vertical-align:middle;width:13px;height:13px;border:0;margin-right:4px;" /><span style="vertical-align:middle;">#{email_addr}</span></a>#{wa_segment}
                    </p>
                    <p style="margin:0 0 12px;font-size:11px;line-height:1.45;">
                      <a href="#{website_href}" target="_blank" rel="noopener noreferrer" style="color:#0e5ac9;text-decoration:none;vertical-align:middle;white-space:nowrap;"><img src="#{DEFAULT_GLOBE_ICON_URL}" width="13" height="13" alt="" style="display:inline-block;vertical-align:middle;width:13px;height:13px;border:0;margin-right:4px;" /><span style="vertical-align:middle;">Website</span></a><span style="color:#a2b2c2;vertical-align:middle;">&nbsp;&nbsp;|&nbsp;&nbsp;</span><a href="#{linkedin_href}" target="_blank" rel="noopener noreferrer" style="color:#0e5ac9;text-decoration:none;vertical-align:middle;white-space:nowrap;"><img src="#{DEFAULT_LINKEDIN_ICON_URL}" width="13" height="13" alt="" style="display:inline-block;vertical-align:middle;width:13px;height:13px;border:0;margin-right:4px;" /><span style="vertical-align:middle;">LinkedIn</span></a>
                    </p>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>
                      <td bgcolor="#0b2944" style="background-color:#0b2944;border-radius:4px;">
                        <a href="#{calendly_href}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:7px 13px;font-size:11px;line-height:1.2;font-weight:bold;text-decoration:none;color:#ffffff;">#{cta_label}</a>
                      </td>
                      <td width="10" style="width:10px;font-size:1px;line-height:1px;">&nbsp;</td>
                      <td style="font-size:11px;line-height:1.25;"><a href="#{website_href}" target="_blank" rel="noopener noreferrer" style="font-weight:bold;color:#0e5ac9;text-decoration:none;">Conhecer a plataforma</a></td>
                    </tr></table>
                  </td>
                  <td width="68" valign="middle" align="right" style="width:68px;vertical-align:middle;text-align:right;padding-left:4px;">
                    <img src="#{DEFAULT_WATERMARK_URL}" width="64" height="64" alt="" style="display:block;width:64px;height:64px;border:0;margin-left:auto;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td colspan="2" bgcolor="#e8f0f7" style="background-color:#e8f0f7;padding:6px 12px;font-family:Arial,Helvetica,sans-serif;font-size:9px;color:#5d7287;letter-spacing:0.4px;line-height:1.4;">#{footer_label}</td></tr>
        </table>
      HTML
    end

    def self.build_for_sender(user:, company: nil, email_account: nil)
      sender_name = user&.respond_to?(:name) ? user.name.presence : nil
      sender_email = email_account&.respond_to?(:email) ? email_account.email.presence : nil
      sender_email ||= user&.respond_to?(:email) ? user.email.presence : nil

      is_felipe_default = sender_email.nil? || sender_email.to_s.casecmp('felipe@avaliasolar.com.br').zero?

      sender_phone = if user&.respond_to?(:phone) && user.phone.present?
                       user.phone
                     elsif company&.respond_to?(:whatsapp) && company.whatsapp.present?
                       company.whatsapp
                     elsif company&.respond_to?(:phone) && company.phone.present?
                       company.phone
                     elsif is_felipe_default
                       '(65) 99346-5055'
                     else
                       nil
                     end

      role_title = if is_felipe_default
                     'Fundador do Avalia Solar'
                   else
                     "Consultor Comercial — #{company&.respond_to?(:name) && company.name.present? ? company.name : 'Avalia Solar'}"
                   end

      website_url = if company&.respond_to?(:website) && company.website.present?
                      company.website
                    else
                      'https://www.avaliasolar.com.br/'
                    end

      build_v2_html(
        full_name: sender_name || 'Felipe Henrique',
        role_title: role_title,
        email: sender_email || 'felipe@avaliasolar.com.br',
        phone: sender_phone,
        avatar_url: DEFAULT_AVATAR_URL,
        logo_url: DEFAULT_LOGO_URL,
        website_url: website_url
      )
    end

    def self.normalize_html(raw_html)
      return '' if raw_html.blank?

      html = raw_html.to_s.dup

      # 1. Substituir URLs relativas e nome legado pelo endereço público HTTPS
      html.gsub!(%r{src=(["'])/images/([^"']+)\1}i, 'src="https://www.avaliasolar.com.br/images/\2"')
      html.gsub!('felipe-assinatura-avatar.png', 'foto-felipe-assinatura-avalia-solar.png')

      # 2. Converter qualquer link tel: legado na assinatura para link V2 do WhatsApp (ícone + número visível no mesmo <a>)
      html.gsub!(%r{<a\b[^>]*href=(["'])tel:([^"']*)\1[^>]*>(.*?)</a>}im) do
        raw_tel = Regexp.last_match(2).to_s
        inner_text = ActionView::Base.full_sanitizer.sanitize(Regexp.last_match(3).to_s).strip
        candidate = raw_tel.presence || inner_text
        wa_html = build_whatsapp_link_html(candidate)
        wa_html.presence || inner_text
      end

      # 3. Atualizar links https://wa.me/... que contenham apenas <img> (assinatura V1) para incluir o número formatado de forma idempotente
      html.gsub!(%r{<a\b([^>]*href=(["'])https://wa\.me/(\d+)\2[^>]*)>(.*?)</a>}im) do |full_match|
        wa_digits = Regexp.last_match(3)
        inner_content = Regexp.last_match(4).to_s
        visible_text = ActionView::Base.full_sanitizer.sanitize(inner_content).gsub(/[\s\u00a0]+/, '').strip
        if visible_text.blank?
          build_whatsapp_link_html(wa_digits).presence || full_match
        else
          full_match
        end
      end

      # 4. Normalizar tags <img>: preservar ícones de contato, marca d'água, logo e WhatsApp;
      #    converter data:image/... em ActiveStorage Blob HTTPS; aplicar fallback apenas quando src estiver vazio/ausente.
      html.gsub!(/<img\b[^>]*>/im) do |img_tag|
        is_logo = img_tag.match?(/alt=(["'])Avalia Solar\1/i) || img_tag.include?('avalia-solar-logo')
        is_whatsapp = img_tag.match?(/alt=(["'])WhatsApp\1/i) || img_tag.include?('whatsapp.png')
        is_watermark = img_tag.include?('avalia-solar-watermark.png') || img_tag.include?('width="64"')
        is_mail_icon = img_tag.include?('mail.png')
        is_globe_icon = img_tag.include?('globe.png')
        is_linkedin_icon = img_tag.include?('linkedin.png')

        fallback_url = if is_whatsapp
                         DEFAULT_WHATSAPP_ICON_URL
                       elsif is_watermark
                         DEFAULT_WATERMARK_URL
                       elsif is_mail_icon
                         DEFAULT_MAIL_ICON_URL
                       elsif is_globe_icon
                         DEFAULT_GLOBE_ICON_URL
                       elsif is_linkedin_icon
                         DEFAULT_LINKEDIN_ICON_URL
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
      raw_phone = if s.key?('phone')
                    s['phone'].to_s
                  else
                    extract_field_from_html(:phone) || '(65) 99346-5055'
                  end
      formatted_phone = raw_phone.present? ? (self.class.format_whatsapp_display(raw_phone).presence || raw_phone) : ''

      {
        full_name: s['full_name'].presence || extract_field_from_html(:full_name) || 'Felipe Henrique',
        role_title: s['role_title'].presence || extract_field_from_html(:role_title) || 'Fundador do Avalia Solar',
        email: s['email'].presence || extract_field_from_html(:email) || 'felipe@avaliasolar.com.br',
        phone: formatted_phone,
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
      when :role_title
        html.match(/color:#63768a;[^>]*>([^<]+)<\/p>/i)&.captures&.first
      when :email
        html.match(/href=["']mailto:([^"']+)["']/i)&.captures&.first
      when :phone
        wa = html.match(%r{href=["']https://wa\.me/(\d+)["']}i)&.captures&.first
        return self.class.format_whatsapp_display(wa).presence || wa if wa.present?

        tel = html.match(/href=["']tel:([^"']+)["']/i)&.captures&.first
        self.class.format_whatsapp_display(tel).presence || tel
      when :website_url
        html.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>\s*<img\b[^>]*alt=["']Avalia Solar["']/im)&.captures&.first
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
