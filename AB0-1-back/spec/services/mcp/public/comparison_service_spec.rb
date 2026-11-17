# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mcp::Public::ComparisonService do
  let(:service) { described_class.new }
  let(:first) { create(:company, status: :active, name: 'First Solar CI') }
  let(:second) { create(:company, status: :active, name: 'Second Solar CI') }

  it 'compares two public companies by the requested objective criteria' do
    result = service.call(arguments: { 'company_ids' => [first.id, second.id],
                                       'criteria' => %w[reputation headquarters] })
    data = result.fetch(:data)
    expect(data.fetch(:companies).map { |item| item.fetch(:id) }).to eq([first.id, second.id])
    expect(data.fetch(:comparison_matrix).keys).to eq(%w[reputation headquarters])
    expect(data.fetch(:criteria_used)).to eq(%w[reputation headquarters])
    expect(JSON.generate(result)).not_to include('winner', 'sponsored', 'lead_email', 'buyer_intent')
    expect(result.fetch(:limitations).join).to include('Patrocínio')
  end

  it 'never represents no reviews as a positive or negative average' do
    result = service.call(arguments: { 'company_ids' => [first.id, second.id],
                                       'criteria' => ['reputation'] })
    values = result.dig(:data, :comparison_matrix, 'reputation')
    expect(values.fetch(first.id.to_s)).to include(total_approved: 0, average_rating: nil)
    expect(values.fetch(second.id.to_s)).to include(total_approved: 0, average_rating: nil)
  end

  it 'denies inactive or nonexistent public companies' do
    inactive = create(:company, status: :inactive)
    expect do
      service.call(arguments: { 'company_ids' => [first.id, inactive.id] })
    end.to raise_error(Mcp::Public::DirectoryService::NotFound)
  end

  it 'rejects duplicate underlying company IDs even when one reference is a slug' do
    expect do
      service.call(arguments: { 'company_ids' => [first.id, first.slug] })
    end.to raise_error(Mcp::Public::InputValidator::Invalid)
  end

  it 'rejects arbitrary user-provided SQL, sponsored ranking or additional company IDs' do
    bad = [
      { 'company_ids' => [first.id, second.id, 3, 4] },
      { 'company_ids' => [first.id, second.id], 'criteria' => %w[sponsored] },
      { 'company_ids' => [first.id, second.id], 'tenant_id' => 1 }
    ]
    bad.each do |args|
      expect { service.call(arguments: args) }.to raise_error(Mcp::Public::InputValidator::Invalid)
    end
  end
end
