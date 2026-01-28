# frozen_string_literal: true

require "net/http"
require "json"

class BrevoDelivery
  API_URL = "https://api.brevo.com/v3/smtp/email"

  def initialize(values)
    @settings = values || {}
  end

  def deliver!(mail)
    api_key = ENV["BREVO_API_KEY"]
    raise "BREVO_API_KEY is missing" if api_key.to_s.strip.empty?

    from_email = (mail.from && mail.from.first) || ENV["MAILER_FROM_EMAIL"]
    raise "MAILER_FROM_EMAIL is missing" if from_email.to_s.strip.empty?

    payload = {
      sender: { email: from_email, name: (mail.from&.first || from_email) },
      to: Array(mail.to).map { |e| { email: e } },
      subject: mail.subject.to_s,
      htmlContent: mail.html_part ? mail.html_part.body.decoded : mail.body.decoded,
      textContent: mail.text_part ? mail.text_part.body.decoded : nil
    }.compact

    uri = URI(API_URL)
    req = Net::HTTP::Post.new(uri)
    req["api-key"] = api_key
    req["content-type"] = "application/json"
    req.body = JSON.dump(payload)

    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    res = http.request(req)
    unless res.is_a?(Net::HTTPSuccess)
      raise "Brevo API error: #{res.code} #{res.body}"
    end

    res
  end
end
