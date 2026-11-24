# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mcp::Ui::ResourceRegistry do
  before do
    allow(ENV).to receive(:[]).and_call_original
  end

  it 'stays disabled by default when MCP_UI_ENABLED is not true' do
    allow(ENV).to receive(:[]).with('MCP_UI_ENABLED').and_return('false')

    expect(described_class.enabled?).to be(false)
    expect(described_class.list).to eq([])
    expect(described_class.read('ui://avalia-solar/search/v1.html')).to be_nil
    expect(described_class.tool_meta('list_integrators')).to be_nil
  end

  it 'lists all five versioned MCP Apps resources with strict CSP when enabled' do
    allow(ENV).to receive(:[]).with('MCP_UI_ENABLED').and_return('true')
    allow(ENV).to receive(:[]).with('MCP_UI_RESOURCE_DOMAINS').and_return(
      'https://www.avaliasolar.com.br,https://avalia-solar-assets.nyc3.cdn.digitaloceanspaces.com,http://insecure.local,*'
    )

    resources = described_class.list
    expect(resources.length).to eq(5)
    expect(resources.map { |r| r.fetch('uri') }).to contain_exactly(
      'ui://avalia-solar/search/v1.html',
      'ui://avalia-solar/profile/v1.html',
      'ui://avalia-solar/reputation/v1.html',
      'ui://avalia-solar/compare/v1.html',
      'ui://avalia-solar/categories/v1.html'
    )

    search = resources.find { |r| r['uri'] == 'ui://avalia-solar/search/v1.html' }
    expect(search['mimeType']).to eq('text/html;profile=mcp-app')
    expect(search.dig('_meta', 'ui', 'csp', 'connectDomains')).to eq([])
    expect(search.dig('_meta', 'ui', 'csp', 'resourceDomains')).to eq([
      'https://www.avaliasolar.com.br',
      'https://avalia-solar-assets.nyc3.cdn.digitaloceanspaces.com'
    ])
    expect(search.dig('_meta', 'openai/ui', 'availableDisplayModes')).to eq(%w[inline fullscreen])
  end

  it 'reads compiled HTML strictly from allowlisted URIs and rejects path traversal' do
    allow(ENV).to receive(:[]).with('MCP_UI_ENABLED').and_return('true')

    content = described_class.read('ui://avalia-solar/search/v1.html')
    expect(content).not_to be_nil
    expect(content['mimeType']).to eq('text/html;profile=mcp-app')
    expect(content['text']).to include('<!doctype html>').or include('<!DOCTYPE html>')

    expect(described_class.read('ui://avalia-solar/../../config/master.key')).to be_nil
    expect(described_class.read('file:///etc/passwd')).to be_nil
  end

  it 'respects granular surface flags when disabling a specific widget' do
    allow(ENV).to receive(:[]).with('MCP_UI_ENABLED').and_return('true')
    allow(ENV).to receive(:[]).with('MCP_UI_COMPARE_ENABLED').and_return('false')

    search_meta = described_class.tool_meta('list_integrators')
    expect(search_meta).to include('ui' => { 'resourceUri' => 'ui://avalia-solar/search/v1.html' })
    expect(described_class.tool_meta('compare_integrators')).to be_nil
    expect(described_class.read('ui://avalia-solar/compare/v1.html')).to be_nil
  end
end
