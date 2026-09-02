require 'rails_helper'

RSpec.describe 'Sales attribution API' do
  it 'define endpoint de atribuição' do
    expect(Rails.application.routes.routes.any? { |route| route.path.spec.to_s.include?('/api/v1/sales/attribution') }).to be(true)
  end
end
