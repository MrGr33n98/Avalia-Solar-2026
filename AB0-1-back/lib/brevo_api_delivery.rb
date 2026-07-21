# frozen_string_literal: true

require 'json'
require 'net/http'
require 'uri'

class BrevoApiDelivery
  DEFAULT_ENDPOINT = 'https://api.brevo.com/v3/smtp/email'

  def initialize(options = {})
    @api_key = options[:api_key].presence || ENV['BREVO_API_KEY']
    @endpoint = options[:endpoint].presence || ENV.fetch('BREVO_TRANSACTIONAL_EMAIL_URL', DEFAULT_ENDPOINT)
    @open_timeout = options.fetch(:open_timeout, 10)
    @read_timeout = options.fetch(:read_timeout, 10)
  end

  def deliver!(mail)
    raise ArgumentError, 'BREVO_API_KEY is required for Brevo API e-mail delivery' if @api_key.blank?

    uri = URI.parse(@endpoint)
    request = Net::HTTP::Post.new(uri.request_uri)
    request['Accept'] = 'application/json'
    request['Content-Type'] = 'application/json'
    request['api-key'] = @api_key
    request.body = build_payload(mail).to_json

    response = Net::HTTP.start(
      uri.hostname,
      uri.port,
      use_ssl: uri.scheme == 'https',
      open_timeout: @open_timeout,
      read_timeout: @read_timeout
    ) { |http| http.request(request) }

    return response if response.is_a?(Net::HTTPSuccess)

    raise "Brevo API delivery failed (#{response.code}): #{response.body.to_s[0, 500]}"
  end

  private

  def build_payload(mail)
    payload = {
      sender: sender_for(mail),
      to: addresses_for(mail, :to),
      subject: mail.subject.to_s
    }

    payload[:cc] = addresses_for(mail, :cc) if addresses_for(mail, :cc).any?
    payload[:bcc] = addresses_for(mail, :bcc) if addresses_for(mail, :bcc).any?
    payload[:replyTo] = addresses_for(mail, :reply_to).first if addresses_for(mail, :reply_to).any?

    html_content = body_for(mail, 'text/html')
    text_content = body_for(mail, 'text/plain')
    payload[:htmlContent] = html_content if html_content.present?
    payload[:textContent] = text_content if text_content.present?

    raise ArgumentError, 'E-mail must include text or HTML content' unless payload.key?(:htmlContent) || payload.key?(:textContent)

    payload
  end

  def sender_for(mail)
    from = mail.header[:from]&.addrs&.first
    from_name = from&.display_name.presence || ENV.fetch('MAILER_FROM_NAME', 'Avalia Solar')
    from_email = from&.address || Array(mail.from).first || ENV.fetch('MAILER_FROM_EMAIL', 'noreply@avaliasolar.com.br')

    { name: from_name, email: from_email }
  end

  def addresses_for(mail, field)
    Array(mail.header[field]&.addrs).map do |address|
      payload = { email: address.address }
      payload[:name] = address.display_name if address.display_name.present?
      payload
    end
  end

  def body_for(mail, mime_type)
    if mail.multipart?
      mail.all_parts.find { |part| part.mime_type == mime_type }&.decoded
    elsif mail.mime_type == mime_type || (mime_type == 'text/plain' && mail.mime_type.blank?)
      mail.decoded
    end
  end
end
