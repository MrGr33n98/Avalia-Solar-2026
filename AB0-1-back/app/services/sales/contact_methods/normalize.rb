# frozen_string_literal: true

module Sales
  module ContactMethods
    class Normalize
      def self.call(kind:, value:)
        new(kind: kind, value: value).call
      end

      def initialize(kind:, value:)
        @kind = kind.to_s.downcase.strip
        @value = value.to_s.strip
      end

      def call
        return '' if @value.blank?

        case @kind
        when 'email'
          normalize_email
        when 'phone', 'whatsapp'
          normalize_phone
        when 'linkedin', 'instagram', 'website'
          normalize_url
        else
          @value.downcase
        end
      end

      private

      def normalize_email
        @value.downcase.strip
      end

      def normalize_phone
        digits = @value.gsub(/\D/, '')
        if @value.start_with?('+')
          "+#{digits}"
        elsif digits.length == 10 || digits.length == 11
          # Padrão brasileiro DDD + número
          "+55#{digits}"
        elsif digits.start_with?('55') && (digits.length == 12 || digits.length == 13)
          "+#{digits}"
        else
          digits.present? ? "+#{digits}" : @value
        end
      end

      def normalize_url
        raw = @value.strip
        raw = "https://#{raw}" unless raw.match?(%r{\Ahttps?://}i)

        begin
          uri = URI.parse(raw)
          uri.scheme = 'https' if uri.scheme == 'http'
          uri.host = uri.host.downcase if uri.host.present?
          uri.to_s.chomp('/')
        rescue URI::InvalidURIError
          raw
        end
      end
    end
  end
end
