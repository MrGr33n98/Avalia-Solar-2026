# frozen_string_literal: true

module Sales
  module Ai
    class ClaimChecker
      CANONICAL_PLACEHOLDERS = %w[
        person.first_name
        person.last_name
        person.name
        person.full_name
        person.email
        person.phone
        person.job_title
        contact.first_name
        contact.last_name
        contact.name
        contact.email
        company.name
        company.domain
        company.website
        company.city
        company.state
        account.name
        account.city
        account.state
        lead.title
        lead.name
        lead.value
        opportunity.title
        opportunity.value
        opportunity.stage
        owner.name
        owner.first_name
        owner.full_name
        owner.email
        owner.phone
        owner.signature
        user.name
        user.email
        user.signature
      ].freeze

      PERCENTAGE_REGEX = /\b\d{1,3}(?:[.,]\d+)?\s*%/
      CURRENCY_REGEX = /(?:R\$|\$)\s*\d[\d.,]*|\b\d{4,}(?:[.,]\d{2})?\b/i
      PAYBACK_CLAIM_REGEX = /\b(?:payback|retorno)\s+(?:de\s+|em\s+|estimado\s+em\s+)?\d+[.,]?\d*\s*(?:anos?|meses)\b/i
      GUARANTEE_CLAIM_REGEX = /\b(?:garantimos\s+economia|garantia\s+de\s+economia|economia\s+garantida|retorno\s+garantido)\b/i

      def self.check(text:, context_payload: {})
        new(text: text, context_payload: context_payload).check
      end

      def initialize(text:, context_payload: {})
        @raw_text = text.to_s
        @plain_text = ActionView::Base.full_sanitizer.sanitize(@raw_text)
        @context_payload = context_payload || {}
      end

      def check
        warnings = []
        verified_numbers = extract_verified_numbers(@context_payload)

        # 1. Unverified percentages
        @plain_text.scan(PERCENTAGE_REGEX).uniq.each do |match|
          num = match.gsub(/[^\d.,]/, '').tr(',', '.')
          next if verified_numbers.include?(num)

          warnings << {
            code: 'UNVERIFIED_PERCENTAGE_CLAIM',
            severity: 'warning',
            message: "Percentual '#{match}' citado sem fonte verificada no cadastro CRM. Revise antes de enviar."
          }
        end

        # 2. Unverified currency claims
        @plain_text.scan(/R\$\s*\d[\d.,]*/i).uniq.each do |match|
          digits = match.gsub(/[^\d]/, '')
          next if verified_numbers.any? { |vn| vn.include?(digits) || digits.include?(vn) }

          warnings << {
            code: 'UNVERIFIED_CURRENCY_CLAIM',
            severity: 'warning',
            message: "Valor monetário '#{match.squish}' não consta nos dados verificados da oportunidade/conta."
          }
        end

        # 3. Unverified payback claims
        @plain_text.scan(PAYBACK_CLAIM_REGEX).uniq.each do |match|
          warnings << {
            code: 'UNVERIFIED_PAYBACK_CLAIM',
            severity: 'warning',
            message: "Prazo de retorno/payback ('#{match}') exige estudo técnico comprovado."
          }
        end

        # 4. Absolute commercial guarantees
        @plain_text.scan(GUARANTEE_CLAIM_REGEX).uniq.each do |match|
          warnings << {
            code: 'ABSOLUTE_GUARANTEE_CLAIM',
            severity: 'warning',
            message: "Promessa comercial absoluta ('#{match}') detectada; prefira linguagem consultiva."
          }
        end

        # 5. Unknown mustache placeholders
        found_tokens = @raw_text.scan(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/).flatten.uniq
        unknown_tokens = found_tokens - CANONICAL_PLACEHOLDERS
        unknown_tokens.each do |token|
          warnings << {
            code: 'UNKNOWN_PLACEHOLDER',
            severity: 'warning',
            message: "Variável '{{#{token}}}' não faz parte do catálogo canônico do CRM."
          }
        end

        # 6. Invalid or insecure links
        @raw_text.scan(/href\s*=\s*["']([^"']*)["']/i).flatten.uniq.each do |href|
          trimmed = href.strip
          if trimmed.empty? || trimmed == '#' || trimmed.downcase.start_with?('javascript:', 'data:', 'vbscript:')
            warnings << {
              code: 'INVALID_OR_INSECURE_LINK',
              severity: 'warning',
              message: "Link vazio ou inseguro detectado ('#{trimmed}')."
            }
          end
        end

        warnings
      end

      private

      def extract_verified_numbers(obj)
        case obj
        when Numeric
          [obj.to_i.to_s, obj.to_f.to_s]
        when String
          obj.scan(/\d+/)
        when Hash
          obj.values.flat_map { |v| extract_verified_numbers(v) }
        when Array
          obj.flat_map { |v| extract_verified_numbers(v) }
        else
          []
        end.uniq
      end
    end
  end
end
