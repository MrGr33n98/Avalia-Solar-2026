# frozen_string_literal: true

module MailerHelper
  OFFICIAL_LOGO_PATH = '/images/avalia-solar-logo-horizontal.svg'
  FALLBACK_LOGO_PATH = '/images/avalia-solar-logo-horizontal.png'

  def mailer_public_origin
    raw_origin = ENV['MAILER_ASSET_HOST'].presence ||
                 ENV['FRONTEND_URL'].presence ||
                 ENV['FRONTEND_ORIGIN'].presence ||
                 'https://www.avaliasolar.com.br'
    normalized = raw_origin.to_s.strip.sub(%r{/+\z}, '')
    normalized = "https://#{normalized}" unless normalized.match?(%r{\Ahttps?://}i)
    normalized.sub(%r{\Ahttps?://https?://}i, 'https://')
  end

  def mailer_absolute_url(path = '/')
    return path if path.to_s.match?(%r{\Ahttps?://}i)

    "#{mailer_public_origin}/#{path.to_s.sub(%r{\A/+}, '')}"
  end

  def mailer_logo_url
    mailer_absolute_url(OFFICIAL_LOGO_PATH)
  end

  def mailer_logo_fallback_url
    mailer_absolute_url(FALLBACK_LOGO_PATH)
  end

  def mailer_site_url
    mailer_absolute_url('/')
  end

  def mailer_privacy_url
    mailer_absolute_url('/privacy')
  end

  def mailer_support_email
    ENV.fetch('MAILER_SUPPORT_EMAIL', 'contato@avaliasolar.com.br')
  end
end
