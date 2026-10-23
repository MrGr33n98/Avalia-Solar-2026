# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::Messaging::OpenSignalClassifier do
  describe '.call' do
    it 'classifica GoogleImageProxy como proxy' do
      result = described_class.call('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 GoogleImageProxy')
      expect(result[:signal_class]).to eq('proxy')
      expect(result[:reasons]).to include('google_image_proxy')
    end

    it 'classifica AppleMessageFrame como proxy (Apple Mail Privacy Protection)' do
      result = described_class.call('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) AppleMessageFrame')
      expect(result[:signal_class]).to eq('proxy')
      expect(result[:reasons]).to include('apple_mail_privacy')
    end

    it 'classifica YahooMailProxy como proxy' do
      result = described_class.call('YahooMailProxy; https://help.yahoo.com/kb/yahoo-mail')
      expect(result[:signal_class]).to eq('proxy')
      expect(result[:reasons]).to include('yahoo_image_proxy')
    end

    it 'classifica scanners de segurança conhecidos como scanner' do
      %w[Proofpoint Safelinks Mimecast Barracuda Sophos UrlScan Qualys Defender].each do |scanner|
        result = described_class.call("Mozilla/5.0 (compatible; #{scanner}/1.0)")
        expect(result[:signal_class]).to eq('scanner')
      end
    end

    it 'classifica navegadores automatizados/headless como scanner' do
      result = described_class.call('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 HeadlessChrome/96.0.4664.45 Safari/537.36')
      expect(result[:signal_class]).to eq('scanner')
      expect(result[:reasons]).to include('automated_browser')
    end

    it 'classifica bots e bibliotecas HTTP como bot' do
      %w[curl/7.68.0 Wget/1.20.3 python-requests/2.26.0 Googlebot/2.1 Go-http-client/1.1].each do |ua|
        result = described_class.call(ua)
        expect(result[:signal_class]).to eq('bot')
      end
    end

    it 'classifica clientes de email interativos explícitos como human_likely' do
      result = described_class.call('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Thunderbird/91.4.0')
      expect(result[:signal_class]).to eq('human_likely')
      expect(result[:reasons]).to include('interactive_email_client')
    end

    it 'mantém unknown para clientes não categorizados sem inventar leituras' do
      result = described_class.call('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
      expect(result[:signal_class]).to eq('unknown')
      expect(result[:reasons]).to eq(['unknown_client'])
    end

    it 'trata user_agent nil com segurança retornando unknown' do
      result = described_class.call(nil)
      expect(result[:signal_class]).to eq('unknown')
      expect(result[:reasons]).to eq(['unknown_client'])
    end
  end
end
