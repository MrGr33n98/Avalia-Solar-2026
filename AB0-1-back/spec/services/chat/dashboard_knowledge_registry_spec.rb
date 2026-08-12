# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::DashboardKnowledgeRegistry do
  it 'resolve categorias para rota e entitlement canônicos' do
    entry = described_class.find('categories')
    expect(entry).to have_attributes(route_key: 'product-categories', required_entitlement: 'company_categories_limit')
  end

  it 'não inventa URL livre na entrada de conhecimento' do
    expect(described_class.all.map(&:route_key)).not_to include(a_string_matching(%r{^/}))
  end
end
