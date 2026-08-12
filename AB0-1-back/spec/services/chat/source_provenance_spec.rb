# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::SourceProvenance do
  it 'mantém apenas tipos de fonte conhecidos' do
    result = described_class.normalize(sources: [{ type: 'company_catalog', id: 1 }, { type: 'secret', id: 2 }])
    expect(result['sources']).to eq([{ 'type' => 'company_catalog', 'id' => 1 }])
  end
end
