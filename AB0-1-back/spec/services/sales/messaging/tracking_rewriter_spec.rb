require 'rails_helper'

RSpec.describe Sales::Messaging::TrackingRewriter do
  let(:link) { instance_double(Sales::EmailLink, token: 'link-token') }
  let(:links) { instance_double(ActiveRecord::Associations::CollectionProxy) }
  let(:message) do
    instance_double(Sales::EmailMessage, click_tracking_enabled: true, links: links)
  end

  it 'persiste token server-side e preserva markup' do
    html = '<a href="https://example.com/oferta">Oferta</a>'
    allow(link).to receive(:token=)
    allow(links).to receive(:find_or_create_by!).with(original_url: 'https://example.com/oferta').and_yield(link).and_return(link)
    result = described_class.rewrite(html, message)

    expect(result).to include('/t/email/click/link-token')
    expect(result).not_to include('?url=')
    expect(result).not_to include('href="https://example.com/oferta"')
  end

  it 'não reescreve quando click tracking está desabilitado' do
    allow(message).to receive(:click_tracking_enabled).and_return(false)
    html = '<a href="https://example.com/oferta">Oferta</a>'

    expect(described_class.rewrite(html, message)).to eq(html)
  end

  it 'não reescreve esquemas não HTTP' do
    html = '<a href="javascript:alert(1)">Oferta</a>'
    expect(described_class.rewrite(html, message)).to eq(html)
  end

  describe '.inject_open_pixel' do
    let(:email_with_token) do
      instance_double(Sales::EmailMessage, open_tracking_enabled: true, tracking_token: 'pix-tok-123')
    end

    it 'injeta tag img de tracking pixel com .gif' do
      html = '<p>Olá mundo</p>'
      result = described_class.inject_open_pixel(html, email_with_token)
      expect(result).to include('/t/email/open/pix-tok-123.gif')
      expect(result).to include('width="1" height="1"')
    end

    it 'injeta antes de </body> se presente' do
      html = '<html><body><p>Olá</p></body></html>'
      result = described_class.inject_open_pixel(html, email_with_token)
      expect(result).to match(%r{/t/email/open/pix-tok-123\.gif.*</body></html>})
    end

    it 'não duplica o pixel se já estiver presente' do
      html = '<p>Olá</p><img src="https://app.avaliasolar.com.br/t/email/open/pix-tok-123.gif" />'
      result = described_class.inject_open_pixel(html, email_with_token)
      expect(result.scan('/t/email/open/pix-tok-123').count).to eq(1)
    end

    it 'não injeta quando open_tracking_enabled é falso' do
      disabled = instance_double(Sales::EmailMessage, open_tracking_enabled: false, tracking_token: 'pix-tok-123')
      html = '<p>Olá</p>'
      expect(described_class.inject_open_pixel(html, disabled)).to eq(html)
    end
  end

  describe '.apply_tracking' do
    let(:full_message) do
      instance_double(Sales::EmailMessage, open_tracking_enabled: true, click_tracking_enabled: true, tracking_token: 'token-abc', links: links)
    end

    it 'aplica injeção de pixel e reescrita de links em conjunto' do
      html = '<a href="https://example.com/promo">Promo</a>'
      allow(link).to receive(:token=)
      allow(links).to receive(:find_or_create_by!).with(original_url: 'https://example.com/promo').and_yield(link).and_return(link)

      result = described_class.apply_tracking(html, full_message)
      expect(result).to include('/t/email/open/token-abc.gif')
      expect(result).to include('/t/email/click/link-token')
    end
  end
end
