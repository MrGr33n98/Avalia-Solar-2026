# frozen_string_literal: true

require 'rails_helper'
require 'yaml'

RSpec.describe 'Chat factuality suite' do
  let(:cases) { YAML.load_file(Rails.root.join('spec/fixtures/chat/factuality.yml')) }

  it 'mantém dataset factual versionado e completo' do
    ids = cases.map { |entry| entry.fetch('id') }
    expect(ids).to include('organic_ranking', 'crm_boundary', 'webhook_entitlement', 'live_inbox_entitlement', 'category_limit')
    cases.each do |entry|
      expect(entry['question']).to be_present
      expect(entry['must_include']).to be_an(Array)
      expect(entry['must_not_include']).to be_an(Array) if entry.key?('must_not_include')
    end
  end
end
