#!/usr/bin/env ruby
# frozen_string_literal: true

# Explicit, staging-only OAuth bearer/tenant-isolation smoke.
# Does not mutate company data. Never prints tokens, response bodies or PII.
require 'json'
require 'net/http'
require 'openssl'
require 'uri'

class McpPrivateStagingSmoke
  VERSION = '2026-07-28'
  MAX_RESPONSE_BYTES = 100_000
  TOOL = 'get_my_company_overview'

  def initialize(env: ENV)
    @url = URI.parse(env.fetch('MCP_SMOKE_PRIVATE_RESOURCE_URL'))
    @token = env.fetch('MCP_SMOKE_PRIVATE_ACCESS_TOKEN').to_s
    @company = env.fetch('MCP_SMOKE_PRIVATE_COMPANY_ID').to_s
    @foreign_company = env.fetch('MCP_SMOKE_PRIVATE_FORBIDDEN_COMPANY_ID').to_s
    @bad_token = 'deliberately-invalid-staging-token'

    unless @url.is_a?(URI::HTTPS) &&
           @url.path == '/mcp/private' &&
           @url.query.nil? && @url.fragment.nil? &&
           @url.userinfo.nil? &&
           @url.host.match?(/\A[a-z0-9-]*staging[a-z0-9-]*\.avaliasolar\.com\.br\z/)
      raise ArgumentError, 'Approved HTTPS staging /mcp/private URL required'
    end
    raise ArgumentError, 'Invalid private staging token' if @token.empty? || @token.bytesize > 8192
    raise ArgumentError, 'One authorized company and one forbidden company fixture are required' if
      @company.empty? || @foreign_company.empty? || @company == @foreign_company
  end

  def run
    discovery = get_metadata
    assert(discovery.fetch('resource') == @url.to_s, 'Resource mismatch')
    assert(discovery.fetch('scopes_supported').include?('mcp:company:read'), 'Scope missing')

    catalog = post('tools/list', {}, @token)
    assert(catalog.fetch('result').fetch('tools').map { |t| t.fetch('name') } == [TOOL],
           'Private tool allowlist mismatch')
    assert(catalog.dig('result', 'resultType') == 'complete', 'Modern protocol result required')

    overview = post('tools/call', {
      'name' => TOOL, 'arguments' => { 'company_id' => @company }
    }, @token)
    result = overview.fetch('result').fetch('structuredContent').fetch('company')
    assert(result.fetch('id').to_s == @company, 'Authorized company mismatch')

    forbidden = post('tools/call', {
      'name' => TOOL, 'arguments' => { 'company_id' => @foreign_company }
    }, @token)
    assert(forbidden.dig('error', 'code') == -32_003, 'Cross-tenant access was not denied')

    missing_bearer = post('tools/list', {}, nil, expected_http: 401)
    assert(missing_bearer == 401, 'Missing bearer was not rejected')
    wrong_bearer = post('tools/list', {}, @bad_token, expected_http: 401)
    assert(wrong_bearer == 401, 'Invalid bearer was not rejected')

    puts 'PASS: private staging metadata, scope, authorized overview, tenant denial and bearer denial'
  end

  private

  def assert(condition, message)
    raise message unless condition
  end

  def request(req, expected_http: 200)
    response = Net::HTTP.start(
      @url.host, @url.port, use_ssl: true, verify_mode: OpenSSL::SSL::VERIFY_PEER,
      open_timeout: 5, read_timeout: 10
    ) { |http| http.request(req) }

    raise 'Oversized MCP response' if response.body.to_s.bytesize > MAX_RESPONSE_BYTES
    raise "Unexpected HTTP status #{response.code}" unless response.code.to_i == expected_http
    return expected_http unless expected_http == 200

    JSON.parse(response.body.to_s)
  end

  def get_metadata
    path = '/.well-known/oauth-protected-resource/mcp/private'
    req = Net::HTTP::Get.new(path)
    request(req)
  end

  def post(method, params, token, expected_http: 200)
    payload = {
      jsonrpc: '2.0', id: "c4-#{method.tr('/', '-')}",
      method: method,
      params: params.merge(
        '_meta' => {
          'io.modelcontextprotocol/protocolVersion' => VERSION,
          'io.modelcontextprotocol/clientInfo' => { 'name' => 'avalia-solar-private-smoke', 'version' => '1' },
          'io.modelcontextprotocol/clientCapabilities' => {}
        }
      )
    }
    req = Net::HTTP::Post.new(@url.request_uri)
    req['Content-Type'] = 'application/json'
    req['Accept'] = 'application/json, text/event-stream'
    req['MCP-Protocol-Version'] = VERSION
    req['Mcp-Method'] = method
    req['Mcp-Name'] = params.fetch('name') if method == 'tools/call'
    req['Authorization'] = "Bearer #{token}" if token
    req.body = JSON.generate(payload)
    request(req, expected_http: expected_http)
  end
end

begin
  raise ArgumentError, 'STAGING_ONLY acknowledgement required' unless ENV['MCP_SMOKE_CONFIRMATION'] == 'STAGING_ONLY'
  McpPrivateStagingSmoke.new.run
rescue StandardError => e
  warn "FAIL: MCP private staging smoke (#{e.class})"
  exit 1
end
