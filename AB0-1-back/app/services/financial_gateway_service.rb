require 'net/http'
require 'uri'
require 'json'

module FinancialGatewayService
  def self.submit_proposal(lead, option_id)
    url = ENV['FINANCIAL_GATEWAY_URL']
    token = ENV['FINANCIAL_GATEWAY_TOKEN']
    return true if url.to_s.strip.empty? || token.to_s.strip.empty?

    uri = URI.parse("#{url}/proposals")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == 'https'

    request = Net::HTTP::Post.new(uri.request_uri)
    request['Content-Type'] = 'application/json'
    request['Authorization'] = "Bearer #{token}"

    body = {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company_id: lead.company_id,
      option_id: option_id,
      payload: JSON.parse(lead.message || '{}')
    }
    request.body = body.to_json

    response = http.request(request)
    Rails.logger.info("[Financing] gateway response lead=#{lead.id} code=#{response.code}")
    response.code.to_i.between?(200, 299)
  rescue StandardError => e
    Rails.logger.error("[Financing] gateway error lead=#{lead&.id} #{e.message}")
    false
  end
end
