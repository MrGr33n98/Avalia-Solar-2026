# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mcp::Public::ServicesService do
  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with('MCP_PUBLIC_COMPANY_SERVICES_ENABLED').and_return('true')
  end

  let(:company) { create(:company, status: :active) }

  it 'discovers the read-only contract only when explicitly enabled' do
    expect(Mcp::PublicToolRegistry.names).to include('get_company_services')
    expect(Mcp::PublicToolRegistry.find('get_company_services').dig('annotations', 'readOnlyHint')).to be true
    allow(ENV).to receive(:[]).with('MCP_PUBLIC_COMPANY_SERVICES_ENABLED').and_return('false')
    expect(Mcp::PublicToolRegistry.names).not_to include('get_company_services')
    expect(Mcp::PublicToolRegistry.find('get_company_services')).to be_nil
  end

  it 'rejects conflicting IDs, invalid limits and unknown input' do
    [{}, { 'slug' => 'a', 'company_id' => 1 }, { 'slug' => '../admin' },
     { 'slug' => 'a', 'limit' => 6 }, { 'slug' => 'a', 'limit' => '1' },
     { 'slug' => 'a', 'tenant_id' => 2 }].each do |args|
      expect { described_class.new.call(arguments: args) }.to raise_error(Mcp::Public::InputValidator::Invalid)
    end
  end

  it 'uses the active public catalog, sanitizes fields and reports a bounded preview' do
    item = { id: 'service:1', type: 'service', name: 'Instalação', short_description: '<b>Solar</b>',
             category: { name: 'Energia solar' }, image_url: 'https://untrusted.example/a.png',
             cta: { href: "/companies/#{company.slug}/services/instalacao" }, email: 'private@example.test' }
    allow(Catalog::ShowcaseQuery).to receive(:new).with(company: company, tab: 'services', limit: 1)
      .and_return(double(call: { data: { selected_tab: 'services', items: [item], total_count: 2 } }))
    result = Mcp::Public::Executor.call(name: 'get_company_services', arguments: { 'slug' => company.slug, 'limit' => 1 },
                                        principal: 'public-reader')
    expect(result[:source_type]).to eq('company_declared')
    expect(result[:data]).to include(total_count: 2, has_more: true)
    expect(result.dig(:data, :services).first).to eq(
      id: 'service:1', name: 'Instalação', summary: 'Solar', category: 'Energia solar',
      image_url: nil, detail_url: "https://www.avaliasolar.com.br/companies/#{company.slug}/services/instalacao"
    )
  end

  it 'does not mistake products for services when the catalog falls back to all' do
    allow(Catalog::ShowcaseQuery).to receive(:new).and_return(double(call: {
      data: { selected_tab: 'all', items: [{ type: 'product' }], total_count: 4 }
    }))
    result = described_class.new.call(arguments: { 'company_id' => company.id })
    expect(result[:data]).to include(services: [], total_count: 0, has_more: false)
  end

  it 'does not expose inactive companies' do
    inactive = create(:company, status: :inactive)
    expect { described_class.new.call(arguments: { 'company_id' => inactive.id }) }
      .to raise_error(Mcp::Public::DirectoryService::NotFound)
  end
end
