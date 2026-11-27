# frozen_string_literal: true

require 'rails_helper'

# Spec 027 — T018: a ferramenta `show_storefront_profile` precisa EXECUTAR,
# não só estar registrada (antes quebrava com ArgumentError).
RSpec.describe Mcp::Public::Executor, 'show_storefront_profile' do
  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with('MCP_PUBLIC_STOREFRONT_ENABLED').and_return('true')
  end

  let(:company) { create(:company, slug: "loja-#{SecureRandom.hex(3)}") }

  def run(arguments)
    described_class.call(name: 'show_storefront_profile', arguments: arguments, principal: nil)
  end

  it 'devolve o envelope da vitrine buscando por slug' do
    result = run('slug' => company.slug)

    expect(result[:schema_version]).to eq('v1')
    expect(result.dig(:data, :company, :id)).to eq(company.id)
    expect(result[:data]).to include(:settings, :projects, :curated_products)
  end

  it 'devolve o envelope da vitrine buscando por company_id' do
    expect(run('company_id' => company.id).dig(:data, :company, :slug)).to eq(company.slug)
  end

  it 'recusa empresa inexistente' do
    expect { run('slug' => 'nao-existe') }.to raise_error(Mcp::Public::InputValidator::Invalid, /not found/)
  end

  it 'recusa empresa inativa' do
    company.update_columns(status: Company.statuses.fetch('inactive', 'inactive'))

    expect { run('slug' => company.slug) }.to raise_error(Mcp::Public::InputValidator::Invalid, /inactive/)
  end
end
