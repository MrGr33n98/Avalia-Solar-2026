# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Outbound routing', type: :routing do
  it 'routes GET /api/v1/outbound/redirect to api/v1/outbound#redirect_to_target' do
    expect(get: '/api/v1/outbound/redirect').to route_to(
      controller: 'api/v1/outbound',
      action: 'redirect_to_target'
    )
  end
end
