# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Mcp::PublicToolRegistry storefront integration', type: :service do
  describe 'show_storefront_profile registration' do
    it 'includes show_storefront_profile in public tool names' do
      expect(Mcp::PublicToolRegistry.names).to include('show_storefront_profile')
    end

    it 'defines read-only idempotent annotations' do
      tool = Mcp::PublicToolRegistry.find('show_storefront_profile')
      expect(tool).not_to be_nil
      annotations = tool['annotations']
      expect(annotations['readOnlyHint']).to be true
      expect(annotations['destructiveHint']).to be false
      expect(annotations['idempotentHint']).to be true
      expect(annotations['openWorldHint']).to be false
    end

    it 'has inputSchema requiring slug or company_id' do
      tool = Mcp::PublicToolRegistry.find('show_storefront_profile')
      input_schema = tool['inputSchema']
      expect(input_schema['type']).to eq('object')
      expect(input_schema['properties']).to have_key('slug')
      expect(input_schema['properties']).to have_key('company_id')
      expect(input_schema['conditions']['oneOf']).to include(
        { 'required' => ['company_id'] },
        { 'required' => ['slug'] }
      )
    end

    it 'has outputSchema declaring envelope and required data properties' do
      tool = Mcp::PublicToolRegistry.find('show_storefront_profile')
      output_schema = tool['outputSchema']
      expect(output_schema['required']).to eq(%w[schema_version data_as_of source_type data limitations])

      data_props = output_schema.dig('properties', 'data', 'properties')
      expect(data_props).to have_key('company')
      expect(data_props).to have_key('settings')
      expect(data_props).to have_key('projects')
      expect(data_props).to have_key('curated_products')
    end
  end

  describe 'Mcp::Ui::ResourceRegistry storefront surface' do
    it 'maps show_storefront_profile to ui://avalia-solar/storefront/v1.html' do
      surface = Mcp::Ui::ResourceRegistry::SURFACES['show_storefront_profile']
      expect(surface).not_to be_nil
      expect(surface[:uri]).to eq('ui://avalia-solar/storefront/v1.html')
      expect(surface[:flag]).to eq('MCP_UI_STOREFRONT_ENABLED')
      expect(surface[:display_modes]).to eq(%w[fullscreen inline])
    end
  end
end

