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
end
