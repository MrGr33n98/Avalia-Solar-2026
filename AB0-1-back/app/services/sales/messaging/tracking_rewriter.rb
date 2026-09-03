module Sales
  module Messaging
    class TrackingRewriter
      def self.rewrite(html, email_message)
        return html.to_s unless email_message.click_tracking_enabled

        html.to_s.gsub(/(<a\b[^>]*\bhref=["\'])(https?:\/\/[^"\']+)(["\'])/i) do
          prefix, url, suffix = Regexp.last_match.captures
          next "#{prefix}#{url}#{suffix}" unless safe_url?(url)

          link = email_message.links.find_or_create_by!(original_url: url) do |record|
            record.token = SecureRandom.urlsafe_base64(24)
          end
          "#{prefix}#{tracking_host}/t/email/click/#{link.token}#{suffix}"
        end
      end

      def self.safe_url?(url)
        url.to_s.match?(%r{\Ahttps?://}i)
      end

      def self.tracking_host
        ENV.fetch('APP_HOST', 'https://crm.avaliasolar.com.br').sub(%r{/\z}, '')
      end
      private_class_method :tracking_host
    end
  end
end
