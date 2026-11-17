# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mcp::Public::DirectoryService do
  let(:service) { described_class.new(principal: 'authorized-public-reader') }

  it 'returns only active integrators, with headquarters separated from coverage' do
    company = create(:company, name: 'Aurora Solar Teste', city: 'Florianópolis', state: 'SC', status: :active)
    create(:company, name: 'Aurora Solar Oculta', city: 'Florianópolis', state: 'SC', status: :inactive)

    result = service.call(name: 'list_integrators', arguments: { 'query' => 'Aurora Solar', 'state' => 'SC' })
    data = result.fetch(:data)
    expect(result.fetch(:source_type)).to eq('company_declared')
    expect(data.fetch(:integrators).map { |item| item.fetch(:id) }).to eq([company.id])
    expect(data.fetch(:integrators).first.fetch(:headquarters)).to include(city: 'Florianópolis', state: 'SC')
    expect(result.fetch(:limitations).join).to include('sede')
  end

  it 'cannot return an inactive company by an otherwise valid ID or slug' do
    private_company = create(:company, status: :inactive)
    expect do
      service.call(name: 'show_integrator_profile', arguments: { 'company_id' => private_company.id })
    end.to raise_error(described_class::NotFound)
  end

  it 'uses only explicitly documented public profile fields' do
    company = create(:company, name: 'Solar Segurança', status: :active)
    profile = service.call(name: 'show_integrator_profile', arguments: { 'company_id' => company.id })
    public_data = profile.fetch(:data).fetch(:integrator)
    expect(public_data.keys).not_to include(:email, :phone, :cpf, :cnpj, :leads, :client_ids, :buyer_intent)
    expect(public_data.fetch(:profile_url)).to eq("https://www.avaliasolar.com.br/companies/#{company.slug}")
    expect(public_data.fetch(:headquarters)).to be_a(Hash)
  end

  it 'returns an empty result for unknown search terms without relaxing filters' do
    result = service.call(name: 'list_integrators', arguments: { 'query' => 'zz_unmatched_nonexistent_2026' })
    expect(result.fetch(:data).fetch(:integrators)).to eq([])
  end

  it 'never passes user-provided input to an internal MCP administrative dispatcher' do
    expect(Api::V1::Mcp::ToolsController).not_to receive(:new)
    service.call(name: 'list_integrators', arguments: { 'query' => 'none-exists' })
  end
end
