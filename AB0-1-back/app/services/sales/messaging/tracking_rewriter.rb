module Sales
  module Messaging
    class TrackingRewriter
      def self.apply_tracking(html, email_message)
        with_pixel = inject_open_pixel(html, email_message)
        rewrite(with_pixel, email_message)
      end

      def self.inject_open_pixel(html, email_message)
        content = html.to_s
        return content unless email_message.open_tracking_enabled
        return content if email_message.tracking_token.blank?
        return content if content.include?("/t/email/open/#{email_message.tracking_token}")

        pixel_url = "#{tracking_host}/t/email/open/#{email_message.tracking_token}.gif"
        pixel_tag = "<img src=\"#{pixel_url}\" width=\"1\" height=\"1\" alt=\"\" style=\"display:none;width:1px;height:1px;border:0;opacity:0;\" />"

        if content =~ %r{</body>}i
          content.sub(%r{</body>}i, "#{pixel_tag}</body>")
        else
          "#{content}#{pixel_tag}"
        end
      end

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
        ::Sales::Messaging::TrackingHost.origin
      end
      private_class_method :tracking_host
    end
  end
end
