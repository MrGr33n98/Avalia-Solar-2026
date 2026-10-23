# frozen_string_literal: true

module Sales
  module Messaging
    class OpenSignalClassifier
      RULES = [
        # Proxies de privacidade e cache de imagens de webmail
        [/GoogleImageProxy/i, 'proxy', 'google_image_proxy'],
        [/AppleMessageFrame/i, 'proxy', 'apple_mail_privacy'],
        [/YahooMailProxy/i, 'proxy', 'yahoo_image_proxy'],
        [/(Office365|ExchangeWebServices)/i, 'proxy', 'office365_image_proxy'],

        # Scanners de segurança e inspeção de links/conteúdo
        [/(security|safelinks|urlscan|proofpoint|mimecast|barracuda|sophos|fireeye|trendmicro|qualys|kaspersky|defender|virustotal|zscaler|mcafee)/i, 'scanner', 'security_scanner'],
        [/(HeadlessChrome|PhantomJS|Playwright|Puppeteer|Selenium)/i, 'scanner', 'automated_browser'],

        # Robôs, crawlers e bibliotecas de requisição HTTP automatizada
        [/(bot|crawler|spider|slurp|archiver)/i, 'bot', 'known_bot'],
        [/(curl|wget|python-requests|aiohttp|httpx|libwww-perl|go-http-client|apache-httpclient|axios|node-fetch)/i, 'bot', 'http_library'],

        # Clientes de e-mail interativos explicitamente identificados (não-proxy)
        [/(Thunderbird|K-9 Mail|Outlook-Desktop)/i, 'human_likely', 'interactive_email_client']
      ].freeze

      def self.call(user_agent)
        ua = user_agent.to_s
        rule = RULES.find { |pattern, _classification, _reason| ua.match?(pattern) }
        return { signal_class: 'unknown', reasons: ['unknown_client'] } unless rule

        { signal_class: rule[1], reasons: [rule[2]] }
      end
    end
  end
end
