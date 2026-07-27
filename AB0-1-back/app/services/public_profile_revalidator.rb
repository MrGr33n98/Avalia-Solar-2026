# frozen_string_literal: true

require 'net/http'
require 'uri'

# Invalidates the Next.js profile cache after a moderated public change is applied.
# The service is deliberately a no-op when the public app has not configured a
# revalidation endpoint, which keeps local and review environments independent.
class PublicProfileRevalidator
  class Error < StandardError; end

  def self.configured?
    ENV['NEXT_REVALIDATE_URL'].present? && ENV['NEXT_REVALIDATE_SECRET'].present?
  end

  def self.call!(company)
    return false unless configured?

    endpoint = ENV.fetch('NEXT_REVALIDATE_URL')
    secret = ENV.fetch('NEXT_REVALIDATE_SECRET')

    uri = URI.parse(endpoint)
    request = Net::HTTP::Post.new(uri)
    request['Content-Type'] = 'application/json'
    request['Authorization'] = "Bearer #{secret}"
    request.body = {
      paths: ["/companies/#{company.slug}"],
      tags: ['company-profile', "company-#{company.slug}"]
    }.to_json

    Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == 'https', read_timeout: 3, open_timeout: 3) do |http|
      response = http.request(request)
      return true if response.is_a?(Net::HTTPSuccess)

      raise Error, "revalidation request failed with HTTP #{response.code} for company_id=#{company.id}"
    end
  rescue StandardError => e
    Rails.logger.error("[PublicProfileRevalidator] #{e.class}: #{e.message} company_id=#{company.id}")
    raise
  end
end
