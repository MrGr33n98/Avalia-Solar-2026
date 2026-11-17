# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mcp::Public::ReputationService do
  let(:company) { create(:company, status: :active) }
  let(:service) { described_class.new }

  it 'returns null average, not zero, for a company with no approved reviews' do
    result = service.call(arguments: { 'company_id' => company.id })
    data = result.fetch(:data)
    expect(result.fetch(:source_type)).to eq('review_aggregate')
    expect(data.fetch(:total_approved)).to eq(0)
    expect(data.fetch(:sample_size)).to eq(0)
    expect(data.fetch(:average_rating)).to be_nil
    expect(data.fetch(:rating_distribution).values.sum).to eq(0)
  end

  it 'never reveals a company that is inactive' do
    inactive = create(:company, status: :inactive)
    expect do
      service.call(arguments: { 'company_id' => inactive.id })
    end.to raise_error(Mcp::Public::DirectoryService::NotFound)
  end

  it 'does not include raw review content, reviewer PII, moderation status or hidden data' do
    result = service.call(arguments: { 'company_id' => company.id })
    body = JSON.generate(result)
    expect(body).not_to include('reviewer_email', 'user_id', 'comment', 'pending', 'rejected', 'cpf')
    expect(result.fetch(:data).keys).to match_array(
      %i[total_approved average_rating rating_distribution verified_total replied_total sample_size]
    )
  end

  it 'rejects any attempt to select private reviews or supply arbitrary tenant' do
    expect do
      service.call(arguments: { 'company_id' => company.id, 'status' => 'pending' })
    end.to raise_error(Mcp::Public::InputValidator::Invalid)
    expect do
      service.call(arguments: { 'company_id' => company.id, 'tenant_id' => 123 })
    end.to raise_error(Mcp::Public::InputValidator::Invalid)
  end
end
