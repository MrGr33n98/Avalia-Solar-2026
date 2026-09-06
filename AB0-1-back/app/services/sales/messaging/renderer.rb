# frozen_string_literal: true

require 'cgi'

module Sales
  module Messaging
    class Renderer
      class EmailRenderError < StandardError; end

      def self.render(body_json: nil, raw_html: nil, raw_text: nil, subject: nil, preheader: nil, to_email: nil, context: {})
        new(body_json:, raw_html:, raw_text:, subject:, preheader:, to_email:, context:).render
      end

      def initialize(body_json: nil, raw_html: nil, raw_text: nil, subject: nil, preheader: nil, to_email: nil, context: {})
        @body_json = body_json
        @raw_html = raw_html
        @raw_text = raw_text
        @subject = subject
        @preheader = preheader
        @to_email = to_email
        @context = context
      end

      def render
        validate_inputs!

        resolved_subject = VariableResolver.resolve(@subject, @context)
        resolved_preheader = @preheader.present? ? VariableResolver.resolve(@preheader, @context) : nil

        html = if @body_json.present? && @body_json.is_a?(Hash) && @body_json['blocks'].is_a?(Array)
                 render_blocks_json(@body_json['blocks'])
               elsif @body_json.present? && @body_json.is_a?(Hash) && @body_json['content'].is_a?(Array)
                 render_tip_tap_json(@body_json)
               elsif @raw_html.present?
                 @raw_html
               else
                 "<p>#{CGI.escapeHTML(@raw_text.to_s)}</p>"
               end

        html = VariableResolver.resolve(html, @context)
        html = sanitize_html(html)

        if resolved_preheader.present?
          preheader_html = "<span style=\"display:none !important;visibility:hidden;mso-hide:all;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;\">#{CGI.escapeHTML(resolved_preheader)}</span>"
          html = "#{preheader_html}\n#{html}"
        end

        text = @raw_text.presence || ActionView::Base.full_sanitizer.sanitize(html)

        validate_output!(html, text, resolved_subject)

        {
          subject: resolved_subject,
          preheader: resolved_preheader,
          body_html: html,
          body_text: text
        }
      end

      private

      def validate_inputs!
        if @to_email.blank? || !@to_email.match?(URI::MailTo::EMAIL_REGEXP)
          raise EmailRenderError, "Destinatário inválido ou ausente: '#{@to_email}'"
        end

        if @subject.blank?
          raise EmailRenderError, "Assunto do e-mail não pode ficar em branco."
        end
      end

      def validate_output!(html, text, subject)
        if html.blank? || html.strip == '<p></p>'
          raise EmailRenderError, "Corpo HTML gerado está vazio. Envio cancelado pela política Fail-Closed."
        end

        if text.blank?
          raise EmailRenderError, "Corpo texto plano gerado está vazio. Envio cancelado pela política Fail-Closed."
        end

        if subject.blank?
          raise EmailRenderError, "Assunto resolvido está vazio."
        end
      end

      def render_blocks_json(blocks)
        return '' unless blocks.is_a?(Array)

        blocks.map do |block|
          next '' unless block.is_a?(Hash)

          type = block['type']
          props = block['props'] || {}

          case type
          when 'heading'
            level = [[props['level'].to_i, 1].max, 3].min
            text = props['text'].to_s
            "<h#{level}>#{text}</h#{level}>"
          when 'text'
            props['html'].to_s.presence || "<p>#{CGI.escapeHTML(props['text'].to_s)}</p>"
          when 'image'
            raw_src = props['url'].to_s.presence || props['src'].to_s
            next '' if raw_src.blank? || unsafe_protocol?(raw_src)

            src = CGI.escapeHTML(raw_src)
            alt = CGI.escapeHTML(props['alt'].to_s)
            "<img src=\"#{src}\" alt=\"#{alt}\" style=\"max-width:100%;height:auto;\" />"
          when 'button'
            label = CGI.escapeHTML(props['label'].to_s.presence || 'Clique aqui')
            raw_url = props['url'].to_s.presence || '#'
            next label if unsafe_protocol?(raw_url)

            url = CGI.escapeHTML(raw_url)
            align = props['align'].to_s.presence || 'left'
            "<div style=\"text-align:#{align};margin:16px 0;\"><a href=\"#{url}\" style=\"background-color:#2563eb;color:#ffffff;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;\">#{label}</a></div>"
          when 'divider'
            '<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />'
          when 'spacer'
            height = [props['height'].to_i, 8].max
            "<div style=\"height:#{height}px;\"></div>"
          when 'html'
            props['code'].to_s.presence || props['html'].to_s
          else
            ''
          end
        end.join("\n")
      end

      def render_tip_tap_json(node)
        return '' unless node.is_a?(Hash)

        type = node['type']
        content = node['content'] || []

        case type
        when 'doc'
          content.map { |child| render_tip_tap_json(child) }.join
        when 'paragraph'
          "<p>#{content.map { |child| render_tip_tap_json(child) }.join}</p>"
        when 'heading'
          level = [[node['level'].to_i, 1].max, 3].min
          "<h#{level}>#{content.map { |child| render_tip_tap_json(child) }.join}</h#{level}>"
        when 'bulletList', 'bullet_list'
          "<ul>#{content.map { |child| render_tip_tap_json(child) }.join}</ul>"
        when 'orderedList', 'ordered_list'
          "<ol>#{content.map { |child| render_tip_tap_json(child) }.join}</ol>"
        when 'listItem', 'list_item'
          "<li>#{content.map { |child| render_tip_tap_json(child) }.join}</li>"
        when 'text'
          text = CGI.escapeHTML(node['text'].to_s)
          marks = node['marks'] || []
          marks.each do |mark|
            case mark['type']
            when 'bold' then text = "<strong>#{text}</strong>"
            when 'italic' then text = "<em>#{text}</em>"
            when 'underline' then text = "<u>#{text}</u>"
            when 'strike' then text = "<s>#{text}</s>"
            when 'link'
              raw_href = mark.dig('attrs', 'href').to_s
              unless unsafe_protocol?(raw_href)
                href = CGI.escapeHTML(raw_href)
                text = "<a href=\"#{href}\" target=\"_blank\" rel=\"noopener noreferrer\">#{text}</a>"
              end
            end
          end
          text
        when 'image'
          raw_src = node.dig('attrs', 'src').to_s
          return '' if raw_src.blank? || unsafe_protocol?(raw_src)

          src = CGI.escapeHTML(raw_src)
          alt = CGI.escapeHTML(node.dig('attrs', 'alt').to_s)
          "<img src=\"#{src}\" alt=\"#{alt}\" />"
        when 'button'
          raw_href = node.dig('attrs', 'href').to_s
          label = CGI.escapeHTML(node.dig('attrs', 'label').presence || node['text'].to_s)
          if raw_href.present? && label.present? && !unsafe_protocol?(raw_href)
            href = CGI.escapeHTML(raw_href)
            "<a href=\"#{href}\">#{label}</a>"
          else
            label
          end
        when 'variableTag'
          node.dig('attrs', 'value').to_s.presence || node.dig('attrs', 'name').to_s
        when 'section', 'columns', 'column'
          content.map { |child| render_tip_tap_json(child) }.join
        when 'divider', 'horizontalRule'
          '<hr />'
        else
          content.map { |child| render_tip_tap_json(child) }.join
        end
      end

      ALLOWED_HTML_TAGS = %w[p br strong em u s a ul ol li h1 h2 h3 blockquote hr img].freeze
      ALLOWED_HTML_ATTRIBUTES = %w[href target rel src alt width height style].freeze
      ALLOWED_HTML_PROTOCOLS = %w[http https mailto tel].freeze

      def sanitize_html(html)
        # Strip script, style, iframe, object, embed tags along with their text contents
        clean = html.to_s
                    .gsub(%r{<script\b[^>]*>.*?</script>}im, '')
                    .gsub(%r{<style\b[^>]*>.*?</style>}im, '')
                    .gsub(%r{<iframe\b[^>]*>.*?</iframe>}im, '')
                    .gsub(%r{<object\b[^>]*>.*?</object>}im, '')
                    .gsub(%r{<embed\b[^>]*>.*?</embed>}im, '')

        sanitized = Rails::Html::SafeListSanitizer.new.sanitize(
          clean,
          tags: ALLOWED_HTML_TAGS,
          attributes: ALLOWED_HTML_ATTRIBUTES,
          protocols: ALLOWED_HTML_PROTOCOLS
        )

        # Remove attributes with unsafe protocols like javascript: or data:
        sanitized.to_s
                 .gsub(/(href|src)\s*=\s*(["'])\s*(javascript|data|vbscript):.*?\2/im, '')
                 .gsub(/(href|src)\s*=\s*(["'])\s*(javascript|data|vbscript):[^"'\s>]*/im, '')
      end

      def unsafe_protocol?(url)
        return false if url.blank?

        url.to_s.strip.downcase.start_with?('javascript:', 'data:', 'vbscript:')
      end
    end
  end
end
