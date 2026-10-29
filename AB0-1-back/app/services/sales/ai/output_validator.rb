# frozen_string_literal: true

require 'cgi'

module Sales
  module Ai
    class OutputValidator
      class InvalidOutputError < StandardError; end

      ALLOWED_HTML_TAGS = %w[p br strong b em i u ul ol li h1 h2 h3 h4 blockquote hr a div span].freeze
      ALLOWED_HTML_ATTRIBUTES = %w[href target rel style align].freeze
      ALLOWED_PROTOCOLS = %w[http https mailto tel].freeze
      VALID_BLOCK_TYPES = %w[heading text button image divider spacer html].freeze

      def self.validate_and_normalize!(feature:, raw_content:, context_payload: {}, missing_fields: [])
        new(
          feature: feature,
          raw_content: raw_content,
          context_payload: context_payload,
          missing_fields: missing_fields
        ).validate_and_normalize!
      end

      def initialize(feature:, raw_content:, context_payload: {}, missing_fields: [])
        @feature = feature.to_s
        @raw_content = raw_content.to_s.strip
        @context_payload = context_payload || {}
        @missing_fields = Array(missing_fields)
      end

      def validate_and_normalize!
        raise InvalidOutputError, 'O modelo retornou uma resposta vazia.' if @raw_content.blank?

        parsed = parse_json!(@raw_content)
        raise InvalidOutputError, 'A resposta do modelo não é um objeto JSON válido.' unless parsed.is_a?(Hash)

        case @feature
        when 'template_create', 'template_block_edit'
          normalize_template_output(parsed)
        when 'inbox_summary', 'person_briefing', 'account_briefing', 'opportunity_recap', 'opportunity_next_step', 'campaign_preflight', 'call_script'
          normalize_briefing_output(parsed)
        else
          normalize_email_output(parsed)
        end
      end

      private

      def normalize_email_output(parsed)
        raw_subjects = Array(parsed['subjects']).filter_map do |item|
          if item.is_a?(Hash) && item['subject'].present?
            {
              subject: sanitize_plain(item['subject']),
              preheader: sanitize_plain(item['preheader'])
            }
          elsif item.is_a?(String) && item.present?
            { subject: sanitize_plain(item), preheader: '' }
          end
        end

        subject = sanitize_plain(parsed['subject'].presence || raw_subjects.dig(0, :subject))
        preheader = sanitize_plain(parsed['preheader'].presence || raw_subjects.dig(0, :preheader))
        raw_subjects = [{ subject: subject, preheader: preheader }] if raw_subjects.empty? && subject.present?

        body_text = parsed['body_text'].to_s.strip
        raw_html = parsed['body_html'].to_s.strip

        if body_text.blank? && raw_html.present?
          body_text = ActionView::Base.full_sanitizer.sanitize(raw_html).strip
        end

        if raw_html.blank? && body_text.present?
          raw_html = paragraphs_to_html(body_text)
        end

        if subject.blank? && body_text.blank? && @feature != 'subject_options'
          raise InvalidOutputError, 'A saída estruturada do modelo não contém assunto nem corpo.'
        end

        clean_html = sanitize_html(raw_html)
        combined_text = [subject, preheader, clean_html, body_text].compact.join("\n")
        warnings = ClaimChecker.check(text: combined_text, context_payload: @context_payload)

        {
          result: {
            subject: subject,
            preheader: preheader,
            subjects: raw_subjects.first(5),
            body_html: clean_html,
            body_text: body_text,
            rationale: sanitize_plain(parsed['rationale'])
          },
          warnings: warnings
        }
      end

      def normalize_template_output(parsed)
        subject_tpl = sanitize_plain(parsed['subject_template'].presence || parsed['subject'].presence || 'Proposta Comercial — {{company.name}}')
        preheader = sanitize_plain(parsed['preheader'])
        name = sanitize_plain(parsed['name'].presence || "Template IA — #{subject_tpl.truncate(36)}")
        category = sanitize_plain(parsed['category'].presence || 'Prospecção')

        raw_blocks = parsed.dig('body_json', 'blocks') || parsed['blocks'] || []
        blocks = normalize_template_blocks(raw_blocks, fallback_text: parsed['body_text'].to_s, fallback_subject: subject_tpl)

        blocks_text = blocks.map { |b| b[:props][:text] || b[:props][:label] || '' }.join("\n")
        warnings = ClaimChecker.check(text: [subject_tpl, preheader, blocks_text].join("\n"), context_payload: @context_payload)

        {
          result: {
            name: name,
            category: category,
            subject_template: subject_tpl,
            preheader: preheader,
            body_json: {
              version: 1,
              blocks: blocks
            },
            rationale: sanitize_plain(parsed['rationale'])
          },
          warnings: warnings
        }
      end

      def normalize_briefing_output(parsed)
        summary = sanitize_plain(parsed['summary'].presence || parsed['body_text'])
        key_points = Array(parsed['key_points']).map { |kp| sanitize_plain(kp) }.reject(&:blank?)
        next_actions = Array(parsed['next_actions']).filter_map do |act|
          next unless act.is_a?(Hash) && act['title'].present?

          {
            title: sanitize_plain(act['title']),
            reason: sanitize_plain(act['reason'])
          }
        end

        warnings = ClaimChecker.check(text: [summary, key_points.join(' ')].join("\n"), context_payload: @context_payload)

        {
          result: {
            summary: summary,
            key_points: key_points,
            next_actions: next_actions,
            rationale: sanitize_plain(parsed['rationale'])
          },
          warnings: warnings
        }
      end

      def normalize_template_blocks(raw_blocks, fallback_text:, fallback_subject:)
        normalized = []
        Array(raw_blocks).each_with_index do |b, idx|
          next unless b.is_a?(Hash)

          type = b['type'].to_s
          next unless VALID_BLOCK_TYPES.include?(type)

          props = b['props'].is_a?(Hash) ? b['props'] : b
          block_id = b['id'].to_s.presence || "blk_#{idx + 1}"

          case type
          when 'heading'
            normalized << {
              id: block_id,
              type: 'heading',
              props: {
                text: sanitize_plain(props['text'].presence || fallback_subject),
                level: [[props['level'].to_i, 1].max, 3].min
              }
            }
          when 'text'
            txt = sanitize_plain(props['text'].presence || props['html'])
            html_val = sanitize_html(props['html'].presence || "<p>#{CGI.escapeHTML(txt)}</p>")
            normalized << {
              id: block_id,
              type: 'text',
              props: {
                text: txt,
                html: html_val
              }
            }
          when 'button'
            raw_url = props['url'].to_s.strip
            safe_url = raw_url.start_with?('http://', 'https://') ? raw_url : 'https://www.avaliasolar.com.br'
            normalized << {
              id: block_id,
              type: 'button',
              props: {
                label: sanitize_plain(props['label'].presence || 'Saiba mais'),
                url: safe_url,
                align: %w[left center right].include?(props['align'].to_s) ? props['align'].to_s : 'left'
              }
            }
          when 'divider'
            normalized << { id: block_id, type: 'divider', props: {} }
          when 'spacer'
            normalized << {
              id: block_id,
              type: 'spacer',
              props: { height: [[props['height'].to_i, 8].max, 80].min }
            }
          end
        end

        if normalized.empty? && fallback_text.present?
          fallback_text.split(/\n{2,}/).each_with_index do |para, idx|
            clean_p = para.strip
            next if clean_p.blank?

            normalized << {
              id: "blk_#{idx + 1}",
              type: 'text',
              props: {
                text: clean_p,
                html: "<p>#{CGI.escapeHTML(clean_p).gsub("\n", '<br/>')}</p>"
              }
            }
          end
        end

        normalized
      end

      def parse_json!(text)
        cleaned = text.sub(/\A```(?:json)?\s*/i, '').sub(/\s*```\z/, '').strip
        JSON.parse(cleaned)
      rescue JSON::ParserError
        first_brace = cleaned.index('{')
        last_brace = cleaned.rindex('}')
        if first_brace && last_brace && last_brace > first_brace
          JSON.parse(cleaned[first_brace..last_brace])
        else
          raise InvalidOutputError, 'Não foi possível interpretar o JSON retornado pelo modelo.'
        end
      rescue JSON::ParserError => e
        raise InvalidOutputError, "Erro de sintaxe JSON na resposta do modelo: #{e.message}"
      end

      def sanitize_plain(str)
        ActionView::Base.full_sanitizer.sanitize(str.to_s).squish
      end

      def paragraphs_to_html(text)
        text.to_s.split(/\n{2,}/).map do |para|
          escaped = CGI.escapeHTML(para.strip).gsub("\n", '<br/>')
          "<p>#{escaped}</p>"
        end.join("\n")
      end

      def sanitize_html(html)
        clean = html.to_s
                    .gsub(%r{<script\b[^>]*>.*?</script>}im, '')
                    .gsub(%r{<style\b[^>]*>.*?</style>}im, '')
                    .gsub(%r{<iframe\b[^>]*>.*?</iframe>}im, '')
                    .gsub(%r{<object\b[^>]*>.*?</object>}im, '')
                    .gsub(%r{<embed\b[^>]*>.*?</embed>}im, '')
                    .gsub(/\bon\w+\s*=\s*(["']).*?\1/im, '')

        sanitized = Rails::Html::SafeListSanitizer.new.sanitize(
          clean,
          tags: ALLOWED_HTML_TAGS,
          attributes: ALLOWED_HTML_ATTRIBUTES,
          protocols: ALLOWED_PROTOCOLS
        )

        sanitized.to_s
                 .gsub(/(href|src)\s*=\s*(["'])\s*(javascript|data|vbscript):.*?\2/im, '')
                 .gsub(/(href|src)\s*=\s*(["'])\s*(javascript|data|vbscript):[^"'\s>]*/im, '')
      end
    end
  end
end
