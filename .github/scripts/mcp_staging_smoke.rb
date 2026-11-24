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
    @company_a = Integer(ENV.fetch('MCP_SMOKE_PUBLIC_COMPANY_A_ID'), 10)
    @company_b = Integer(ENV.fetch('MCP_SMOKE_PUBLIC_COMPANY_B_ID'), 10)
    raise ArgumentError, 'Two distinct approved companies required' unless
      @company_a.positive? && @company_b.positive? && @company_a != @company_b

    unless @resource.is_a?(URI::HTTPS) && @resource.path == '/mcp' &&
           @resource.query.nil? && @resource.fragment.nil? &&
           @resource.userinfo.nil? &&
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
    tools = list.fetch('result').fetch('tools')
    found = tools.map { |tool| tool.fetch('name') }
    raise 'Public allowlist mismatch' unless found == PUBLIC_NAMES

    verify_ui_resources!(discover, tools)

    categories = public_tool('list_solar_categories', {})
    require_array(categories, 'categories')

    directory = public_tool('list_integrators', { 'state' => 'SC', 'limit' => 5 })
    require_array(directory, 'integrators')

    profile = public_tool('show_integrator_profile', { 'company_id' => @company_a })
    profile_id = profile.fetch('data').fetch('integrator').fetch('id')
    raise 'Wrong profile company' unless profile_id == @company_a

    reputation = public_tool('get_integrator_reputation', { 'company_id' => @company_a })
    aggregate = reputation.fetch('data')
    raise 'Invalid reputation total' unless aggregate.fetch('total_approved').is_a?(Integer) &&
                                           aggregate.fetch('total_approved') >= 0

    comparison = public_tool('compare_integrators', { 'company_ids' => [@company_a, @company_b] })
    companies = comparison.fetch('data').fetch('companies')
    raise 'Invalid comparison output' unless companies.is_a?(Array) && companies.length == 2
    raise 'Comparison references wrong companies' unless
      companies.map { |row| row.fetch('id') }.sort == [@company_a, @company_b].sort

    forbidden = post('tools/call', { 'name' => 'bulk_lead_export', 'arguments' => {} })
    raise 'Private tool unexpectedly callable' unless forbidden.dig('error', 'code') == -32_602

    puts 'PASS: staging public MCP metadata-independent discovery, 5 tools, and forbidden internal tools'
  end

  private

  def public_tool(name, arguments)
    response = post('tools/call', { 'name' => name, 'arguments' => arguments })
    require_success!(response, name)
    result = response.fetch('result')
    raise 'Missing tool response content' unless result.fetch('isError') == false

    structured = result.fetch('structuredContent')
    raise 'Malformed public envelope' unless structured.fetch('schema_version') == '1.0.0' &&
                                              structured.fetch('data').is_a?(Hash) &&
                                              structured.fetch('limitations').is_a?(Array)
    structured
  end

  def require_array(envelope, name)
    raise "Missing #{name}" unless envelope.fetch('data').fetch(name).is_a?(Array)
  end

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

  def verify_ui_resources!(discover, tools)
    resources_cap = discover.dig('result', 'capabilities', 'resources')
    return unless resources_cap || ENV['MCP_SMOKE_VERIFY_UI'] == 'true'

    expected_uris = %w[
      ui://avalia-solar/search/v1.html
      ui://avalia-solar/profile/v1.html
      ui://avalia-solar/reputation/v1.html
      ui://avalia-solar/compare/v1.html
      ui://avalia-solar/categories/v1.html
    ]

    tools.each do |tool|
      uri = tool.dig('_meta', 'ui', 'resourceUri')
      raise "Missing _meta.ui.resourceUri on #{tool['name']}" unless expected_uris.include?(uri)
    end

    res_list = post('resources/list', {})
    require_success!(res_list, 'resources/list')
    listed_uris = res_list.fetch('result').fetch('resources').map { |r| r.fetch('uri') }
    raise 'Incomplete MCP UI resources list' unless expected_uris.all? { |u| listed_uris.include?(u) }

    res_read = post('resources/read', { 'uri' => 'ui://avalia-solar/search/v1.html' })
    require_success!(res_read, 'resources/read')
    content = res_read.fetch('result').fetch('contents').first
    raise 'Invalid MCP App MIME type' unless content['mimeType'] == 'text/html;profile=mcp-app'
    raise 'Missing HTML bundle payload' unless content['text'].to_s.match?(/<!doctype html>/i)
  end
end

begin
  McpStagingSmoke.new.run
rescue StandardError => e
  warn "FAIL: MCP staging smoke (#{e.class})"
  exit 1
end
