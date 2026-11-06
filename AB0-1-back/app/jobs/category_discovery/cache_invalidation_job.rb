# frozen_string_literal: true

require 'net/http'
require 'uri'

module CategoryDiscovery
  class CacheInvalidationJob < ApplicationJob
    queue_as :default

    DEDUPE_WINDOW = 15.seconds

    retry_on StandardError, wait: :exponentially_longer, attempts: 3 if respond_to?(:retry_on)

    def perform(category_id:, slug:, previous_slug: nil, force: false)
      normalized_slug = slug.to_s.strip.downcase
      return :noop if normalized_slug.blank?

      dedupe_key = "category_discovery:revalidate_dedupe:#{category_id}:#{normalized_slug}:#{previous_slug}"
      if !force && Rails.cache.exist?(dedupe_key)
        return :deduplicated
      end

      Rails.cache.write(dedupe_key, true, expires_in: DEDUPE_WINDOW)

      payload = self.class.build_invalidation_payload(
        slug: normalized_slug,
        previous_slug: previous_slug
      )

      self.class.dispatch_http_revalidate(payload)
      :dispatched
    end

    def self.build_invalidation_payload(slug:, previous_slug: nil)
      clean_slug = slug.to_s.strip.downcase
      prev = previous_slug.to_s.strip.downcase

      paths = [
        '/categories',
        "/categories/#{clean_slug}",
        "/categories/#{clean_slug}/solutions",
        '/sitemaps/categories/sitemap.xml'
      ]
      tags = [
        'categories',
        "category-#{clean_slug}",
        'category-solution-types'
      ]

      if prev.present? && prev != clean_slug
        paths << "/categories/#{prev}"
        tags << "category-#{prev}"
      end

      {
        paths: paths.uniq,
        tags: tags.uniq
      }
    end

    def self.dispatch_http_revalidate(payload)
      secret = ENV['NEXT_REVALIDATE_SECRET'].to_s
      base_url = (ENV['FRONTEND_INTERNAL_URL'].presence || ENV['FRONTEND_URL'].presence || 'http://localhost:3000').to_s.sub(%r{/+\z}, '')
      return false if secret.blank?

      uri = URI.parse("#{base_url}/api/revalidate")
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = (uri.scheme == 'https')
      http.open_timeout = 3
      http.read_timeout = 5

      request = Net::HTTP::Post.new(uri.request_uri)
      request['Content-Type'] = 'application/json'
      request['Authorization'] = "Bearer #{secret}"
      request.body = payload.to_json

      response = http.request(request)
      response.code.to_i.between?(200, 299)
    rescue StandardError => e
      Rails.logger.warn("[CategoryDiscovery::CacheInvalidationJob] HTTP revalidate warning: #{e.class}: #{e.message}")
      false
    end
  end
end

