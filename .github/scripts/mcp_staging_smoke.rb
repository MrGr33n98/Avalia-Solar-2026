#!/usr/bin/env ruby
# frozen_string_literal: true

# Optional manual staging-only MCP over HTTPS smoke probe.
# Requires an externally issued bearer token. NEVER prints credentials.
require 'json'
require 'net/http'
require 'openssl'
require 'uri'

class McpStagingSmoke
  VERSION = '2026-07-28'
  PUBLIC_NAMES = %w[list_integrators show_integrator_profile list_solar_categories get_integrator_reputation compare_integrators].freeze
  MAX_RESPONSE = 100_000

  def initialize
    @resource = URI.parse(ENV.fetch('MCP_SMOKE_RESOURCE_URL'))
    @token = ENV.fetch('MCP_SMOKE_ACCESS_TOKEN')
    unless @resource.is_a?(URI::HTTPS) && @resource.path == '/mcp' &&
           @resource.query.nil? && @resource.fragment.nil? &&
           @resource.host.match?(/\A[a-z0-9-]*staging[a-z0-9-]*\.avaliasolar\.com\.br\z/)
      raise ArgumentError, 'Smoke requires an approved HTTPS MCP staging host only.'
    end
    raise ArgumentError, 'Missing staging token.' if @token.empty? || @token.bytesize > 8192
  end

  def run
    discover = post('server/discover', {})
    require_success!(discover, 'discovery')

    list = post('tools/list', {})
    require_success!(list, 'catalog')
    found = list.fetch('result').fetch('tools').map { |tool| tool.fetch('name') }
    raise 'Public allowlist mismatch' unless found == PUBLIC_NAMES

    categories = post('tools/call', { 'name' => 'list_solar_categories', 'arguments' => {} })
    require_success!(categories, 'category query')
    structured = categories.fetch('result').fetch('structuredContent')
    raise 'Invalid category output' unless structured.fetch('data').fetch('categories').is_a?(Array)

    forbidden = post('tools/call', { 'name' => 'bulk_lead_export', 'arguments' => {} })
    raise 'Private tool unexpectedly callable' unless forbidden.dig('error', 'code') == -32_602

    puts 'PASS: private staging MCP discovery/catalog/category query/private-tool denial'
  end

  private

  def post(method, params)
    body = {
      'jsonrpc' => '2.0', 'id' => "probe-#{method.gsub('/', '-')}",
      'method' => method,
      'params' => params.merge(
        '_meta' => {
          'io.modelcontextprotocol/protocolVersion' => VERSION,
          'io.modelcontextprotocol/clientInfo' => { name: 'avalia-solar-ci', version: '1.0' },
          'io.modelcontextprotocol/clientCapabilities' => {}
        }
      )
    }
    request = Net::HTTP::Post.new(@resource.request_uri)
    request['Content-Type'] = 'application/json'
    request['Accept'] = 'application/json, text/event-stream'
    request['MCP-Protocol-Version'] = VERSION
    request['Mcp-Method'] = method
    request['Mcp-Name'] = params.fetch('name') if method == 'tools/call'
    request['Authorization'] = "Bearer #{@token}"
    request.body = JSON.generate(body)

    response = Net::HTTP.start(@resource.host, @resource.port, use_ssl: true,
                               verify_mode: OpenSSL::SSL::VERIFY_PEER,
                               open_timeout: 5, read_timeout: 10) { |http| http.request(request) }
    raise 'Oversized MCP response' if response.body.to_s.bytesize > MAX_RESPONSE
    # No redirection, token forwarding or response-body logging.
    raise "Unexpected HTTP #{response.code}" unless response.is_a?(Net::HTTPSuccess) ||
                                                 response.is_a?(Net::HTTPBadRequest)

    JSON.parse(response.body.to_s)
  end

  def require_success!(response, label)
    raise "#{label} protocol failure" unless response.fetch('result', nil).is_a?(Hash) &&
                                             response.dig('result', 'resultType') == 'complete'
  end
end

begin
  McpStagingSmoke.new.run
rescue StandardError => e
  warn "FAIL: MCP staging smoke (#{e.class})"
  exit 1
end
