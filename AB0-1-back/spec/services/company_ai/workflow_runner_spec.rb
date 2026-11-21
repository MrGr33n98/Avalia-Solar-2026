# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyAi::WorkflowRunner do
  let(:definition) do
    {
      'start_node_id' => 'welcome',
      'nodes' => [
        { 'id' => 'welcome', 'type' => 'message', 'text' => 'Olá' },
        { 'id' => 'menu', 'type' => 'choice',
          'options' => [{ 'key' => 'quote', 'label' => 'Orçamento' }, { 'key' => 'browse', 'label' => 'Produtos' }] },
        { 'id' => 'quote', 'type' => 'action', 'action_key' => 'open_quote_wizard' },
        { 'id' => 'browse', 'type' => 'knowledge', 'source' => 'published_products' },
        { 'id' => 'end', 'type' => 'end' }
      ],
      'edges' => [
        { 'from' => 'welcome', 'to' => 'menu' },
        { 'from' => 'menu', 'to' => 'quote', 'choice' => 'quote' },
        { 'from' => 'menu', 'to' => 'browse', 'choice' => 'browse' },
        { 'from' => 'quote', 'to' => 'end' },
        { 'from' => 'browse', 'to' => 'end' }
      ]
    }
  end

  it 'routes choices deterministically without language-model tool selection' do
    runner = described_class.new(definition)
    expect(runner.next_node_id(current_node_id: 'welcome')).to eq('menu')
    expect(runner.next_node_id(current_node_id: 'menu', choice: 'quote')).to eq('quote')
  end

  it 'rejects an unlisted option and cannot escape the graph' do
    runner = described_class.new(definition)
    expect { runner.next_node_id(current_node_id: 'menu', choice: 'admin') }.to raise_error(ArgumentError)
    expect { runner.next_node_id(current_node_id: 'missing') }.to raise_error(ArgumentError)
  end
end
