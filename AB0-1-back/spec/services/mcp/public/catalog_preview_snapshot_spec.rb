# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mcp::Public::CatalogPreviewSnapshot do
  it 'uses the public showcase and returns only allowlisted, bounded fields' do
    company = create(:company, status: :active)
    product = { id: 'product:1', type: 'product', name: 'Inversor', short_description: '<b>Descrição</b>',
                image_url: 'https://untrusted.example/image.png', category: { name: 'Inversores' },
                cta: { href: '/products/1-inversor' }, email: 'private@example.test' }
    service = { id: 'service:1', type: 'service', name: 'Instalação',
                cta: { href: '/companies/other-company/services/install' } }
    allow(Catalog::ShowcaseQuery).to receive(:new).with(company: company, tab: 'all', limit: 3)
                                                 .and_return(double(call: { data: { items: [product] } }))
    allow(Catalog::ShowcaseQuery).to receive(:new).with(company: company, tab: 'services', limit: 3)
                                                 .and_return(double(call: { data: { items: [service] } }))
    result = described_class.call(company)
    expect(result[:state]).to eq('ready')
    expect(result[:products].first).to include(name: 'Inversor', summary: 'Descrição', image_url: nil,
                                              detail_url: 'https://www.avaliasolar.com.br/products/1-inversor')
    expect(result[:products].first).not_to have_key(:email)
    expect(result[:services].first[:detail_url]).to be_nil
  end
end
