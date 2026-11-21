# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyAi::WorkflowValidator do
  let(:definition) do
    {
      'start_node_id' => 'welcome',
      'nodes' => [
        { 'id' => 'welcome', 'type' => 'message', 'text' => 'Bem-vindo' },
        { 'id' => 'menu', 'type' => 'choice', 'options' => [{ 'key' => 'product', 'label' => 'Produtos' }] },
        { 'id' => 'finish', 'type' => 'end' }
      ],
      'edges' => [
        { 'from' => 'welcome', 'to' => 'menu' },
        { 'from' => 'menu', 'to' => 'finish', 'choice' => 'product' }
      ]
    }
  end

  it 'accepts a finite, connected, allowlisted workflow' do
    expect(described_class.call(definition).valid?).to eq(true)
  end

  it 'rejects executable tool names outside the action allowlist' do
    definition['nodes'][2] = { 'id' => 'finish', 'type' => 'action', 'action_key' => 'execute_sql' }
    expect(described_class.call(definition).errors.join(' ')).to include('ACTION_NOT_ALLOWED')
  end

  it 'rejects references to missing nodes' do
    definition['edges'][1]['to'] = 'not_found'
    expect(described_class.call(definition).errors.join(' ')).to include('UNKNOWN_NODE')
  end

  it 'rejects cycles and endless conversations' do
    definition['edges'] << { 'from' => 'finish', 'to' => 'welcome' }
    expect(described_class.call(definition).errors.join(' ')).to include('CYCLE')
  end

  it 'rejects orphan nodes and duplicate identifiers' do
    definition['nodes'] << { 'id' => 'orphan', 'type' => 'end' }
    expect(described_class.call(definition).errors.join(' ')).to include('UNREACHABLE_NODE')
    definition['nodes'][-1]['id'] = 'welcome'
    expect(described_class.call(definition).errors.join(' ')).to include('DUPLICATE_NODE')
  end

  it 'rejects oversized payloads and malformed inputs' do
    definition['nodes'] = 30.times.map { |i| { 'id' => "n#{i}", 'type' => 'end' } }
    expect(described_class.call(definition).valid?).to eq(false)
    expect(described_class.call(nil).valid?).to eq(false)
  end
end
