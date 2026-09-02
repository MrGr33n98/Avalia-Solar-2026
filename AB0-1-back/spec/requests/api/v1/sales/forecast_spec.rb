require 'rails_helper'

RSpec.describe 'Sales forecast API' do
  it 'define endpoint de forecast' do
    expect(Rails.application.routes.routes.any? { |route| route.path.spec.to_s.include?('/api/v1/sales/forecast') }).to be(true)
  end
end
