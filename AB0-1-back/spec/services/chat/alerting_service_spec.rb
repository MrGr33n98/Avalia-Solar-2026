# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::AlertingService do
  it 'ignora eventos não registrados' do
    expect(Chat::PosthogTrackingService).not_to receive(:track)
    described_class.alert(event: 'unknown', properties: {})
  end
end
