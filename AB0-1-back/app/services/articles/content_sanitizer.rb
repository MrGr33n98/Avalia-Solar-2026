# frozen_string_literal: true

require 'cgi'
require 'uri'
require 'nokogiri'

module Articles
  class ContentSanitizer
    ALLOWED_TAGS = %w[
      p h2 h3 h4 h5 h6 ul ol li a strong em b i u s blockquote
      img figure figcaption table thead tbody tr th td code pre hr br
      div section span aside
    ].freeze

    ALLOWED_ATTRIBUTES = %w[
      href src alt title class id target rel width height
      role aria-label aria-hidden aria-describedby
      data-as-component data-as-component-id data-as-track data-as-variant data-as-placement
    ].freeze

    ALLOWED_CLASS_REGEX = /\A(as-[a-z0-9_-]+|ql-[a-z0-9_-]+|text-(left|center|right|justify))\z/i.freeze
    SAFE_HREF_SCHEMES = %w[http https mailto tel].freeze
    SAFE_SRC_SCHEMES = %w[http https].freeze

    TERM_REPLACEMENTS = {
      'fotoforos' => 'painéis fotovoltaicos',
      'cérebros celulares' => 'células fotovoltaicas',
      'fotocatalisador' => 'célula fotovoltaica',
      'Fotoforos' => 'Painéis fotovoltaicos',
      'Cérebros celulares' => 'Células fotovoltaicas',
      'Fotocatalisador' => 'Célula fotovoltaica'
    }.freeze

    def self.call(raw_content)
      new(raw_content).call
    end

    def initialize(raw_content)
      @raw_content = raw_content
    end

    def call
      return '' if @raw_content.blank?

      normalized = normalize_incoming(@raw_content.to_s)
      sanitized = sanitize_html(normalized)
      post_process(sanitized)
    end

    private

    def normalize_incoming(content)
      normalized = content.dup

      # Completely prune dangerous tags and their contents before sanitizing
      normalized.gsub!(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i, '')
      normalized.gsub!(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/i, '')
      normalized.gsub!(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/i, '')
      normalized.gsub!(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/i, '')

      # Unescape once if double escaped
      if normalized.include?('&lt;') && normalized.match?(/&lt;(p|div|h[1-6]|section|a|ul|ol|table|span|blockquote)/i)
        normalized = CGI.unescapeHTML(normalized)
      end

      # Term corrections
      TERM_REPLACEMENTS.each do |wrong, correct|
        normalized.gsub!(wrong, correct)
      end

      normalized
    end

    def sanitize_html(html)
      ActionController::Base.helpers.sanitize(
        html,
        tags: ALLOWED_TAGS,
        attributes: ALLOWED_ATTRIBUTES
      )
    end

    def post_process(html)
      return '' if html.blank?

      doc = Nokogiri::HTML::DocumentFragment.parse(html)

      doc.css('*').each do |el|
        # 1. Class allowlist
        if el['class'].present?
          valid_classes = el['class'].split.select { |c| c.match?(ALLOWED_CLASS_REGEX) }
          if valid_classes.any?
            el['class'] = valid_classes.join(' ')
          else
            el.remove_attribute('class')
          end
        end

        # 2. Href validation
        if el['href'].present?
          href_val = el['href'].to_s.strip
          uri = URI.parse(href_val) rescue nil
          if uri.nil? || (uri.scheme && !SAFE_HREF_SCHEMES.include?(uri.scheme.downcase))
            el.remove_attribute('href')
          end
        end

        # 3. Src validation
        if el['src'].present?
          src_val = el['src'].to_s.strip
          uri = URI.parse(src_val) rescue nil
          if uri.nil? || (uri.scheme && !SAFE_SRC_SCHEMES.include?(uri.scheme.downcase))
            el.remove_attribute('src')
          end
        end

        # 4. Target _blank security
        if el['target'] == '_blank'
          existing_rel = el['rel'].to_s.split
          required_rel = %w[noopener noreferrer]
          combined = (existing_rel + required_rel).uniq
          el['rel'] = combined.join(' ')
        end

        # 5. Remove any attribute starting with 'on' (event handlers)
        el.attribute_nodes.each do |attr|
          el.remove_attribute(attr.name) if attr.name.downcase.start_with?('on')
        end
      end

      doc.to_html
    end
  end
end
