# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyAi::Publisher do
  it 'rejects cross-assistant workflow publication' do
    assistant = double('assistant', id: 2)
    version = double('version', company_ai_assistant_id: 3)
    expect { described_class.call(assistant: assistant, version: version, actor: double('actor')) }
      .to raise_error(ArgumentError, 'VERSION_MISMATCH')
  end

  it 'rejects publication without an authenticated actor' do
    assistant = double('assistant', id: 2)
    version = double('version', company_ai_assistant_id: 2)
    expect { described_class.call(assistant: assistant, version: version, actor: nil) }
      .to raise_error(ArgumentError, 'UNAUTHORIZED_ACTOR')
  end
end
