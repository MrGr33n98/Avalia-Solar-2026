# frozen_string_literal: true

require 'net/http'
require 'uri'

module Articles
  class FrontendRevalidator
    class Error < StandardError; end

    SAFE_SLUG = /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/.freeze

    def self.configured?
      ENV['NEXT_REVALIDATE_URL'].present? && ENV['NEXT_REVALIDATE_SECRET'].present?
    end

    def self.call!(slugs)
      return false unless configured?

      safe_slugs = Array(slugs).map(&:to_s).uniq.select { |slug| slug.match?(SAFE_SLUG) }
      return false if safe_slugs.empty?

      endpoint = ENV.fetch('NEXT_REVALIDATE_URL')
      uri = URI.parse(endpoint)
      request = Net::HTTP::Post.new(uri)
      request['Content-Type'] = 'application/json'
      request['Authorization'] = "Bearer #{ENV.fetch('NEXT_REVALIDATE_SECRET')}"
      request.body = {
        paths: safe_slugs.map { |slug| "/blog/#{slug}" },
        tags: ['articles', *safe_slugs.map { |slug| "article-#{slug}" }]
      }.to_json

      Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == 'https', read_timeout: 3, open_timeout: 3) do |http|
        response = http.request(request)
        return true if response.is_a?(Net::HTTPSuccess)

        raise Error, "revalidation request failed with HTTP #{response.code}"
      end
    rescue StandardError => e
      Rails.logger.error("[Articles::FrontendRevalidator] #{e.class}: #{e.message}")
      raise Error, e.message
    end
  end
end
