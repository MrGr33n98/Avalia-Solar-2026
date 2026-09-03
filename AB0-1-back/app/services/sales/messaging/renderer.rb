# frozen_string_literal: true

module Sales
  module Messaging
    class Renderer
      class EmailRenderError < StandardError; end

      def self.render(body_json: nil, raw_html: nil, raw_text: nil, subject: nil, to_email: nil, context: {})
        new(body_json:, raw_html:, raw_text:, subject:, to_email:, context:).render
      end

      def initialize(body_json: nil, raw_html: nil, raw_text: nil, subject: nil, to_email: nil, context: {})
        @body_json = body_json
        @raw_html = raw_html
        @raw_text = raw_text
        @subject = subject
        @to_email = to_email
        @context = context
      end

      def render
        validate_inputs!

        resolved_subject = VariableResolver.resolve(@subject, @context)

        html = if @body_json.present? && @body_json.is_a?(Hash) && @body_json['content'].is_a?(Array)
                 render_tip_tap_json(@body_json)
               elsif @raw_html.present?
                 @raw_html
               else
                 "<p>#{@raw_text}</p>"
               end

        html = VariableResolver.resolve(html, @context)
        html = sanitize_urls(html)
        text = @raw_text.presence || ActionView::Base.full_sanitizer.sanitize(html)

        validate_output!(html, text, resolved_subject)

        {
          subject: resolved_subject,
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
          level = node['level'] || 2
          "<h#{level}>#{content.map { |child| render_tip_tap_json(child) }.join}</h#{level}>"
        when 'bulletList', 'bullet_list'
          "<ul>#{content.map { |child| render_tip_tap_json(child) }.join}</ul>"
        when 'orderedList', 'ordered_list'
          "<ol>#{content.map { |child| render_tip_tap_json(child) }.join}</ol>"
        when 'listItem', 'list_item'
          "<li>#{content.map { |child| render_tip_tap_json(child) }.join}</li>"
        when 'text'
          text = node['text'] || ''
          marks = node['marks'] || []
          marks.each do |mark|
            case mark['type']
            when 'bold' then text = "<strong>#{text}</strong>"
            when 'italic' then text = "<em>#{text}</em>"
            when 'underline' then text = "<u>#{text}</u>"
            when 'strike' then text = "<s>#{text}</s>"
            when 'link'
              href = mark.dig('attrs', 'href') || '#'
              text = "<a href=\"#{href}\" target=\"_blank\" rel=\"noopener noreferrer\">#{text}</a>"
            end
          end
          text
        when 'divider', 'horizontalRule'
          '<hr />'
        else
          content.map { |child| render_tip_tap_json(child) }.join
        end
      end

      def sanitize_urls(html)
        # Allows only http, https, mailto, tel protocols
        html.gsub(/href=["'](?!(?:https?|mailto|tel):)([^"']+)["']/i, 'href="#"')
      end
    end
  end
end
