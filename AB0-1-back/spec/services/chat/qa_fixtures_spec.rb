# frozen_string_literal: true

require 'rails_helper'
require 'yaml'

RSpec.describe 'Chat QA fixtures' do
  it 'mantém conversas douradas e red team estruturadas' do
    golden = YAML.load_file(Rails.root.join('spec/fixtures/chat/golden_conversations.yml'))
    red_team = YAML.load_file(Rails.root.join('spec/fixtures/chat/red_team.yml'))
    expect(golden.size).to eq(8)
    expect(red_team.size).to eq(4)
    expect(golden).to all(include('id', 'input', 'expected_intent'))
    expect(red_team).to all(include('id', 'input', 'expected_allowed'))
  end
end
