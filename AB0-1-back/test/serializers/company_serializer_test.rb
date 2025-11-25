require 'test_helper'

class CompanySerializerTest < ActiveSupport::TestCase
  def setup
    @company = Company.create!(name: 'Comp', description: 'Desc', website: 'https://example.com', state: 'MG', city: 'BH', rating_avg: 4.5, rating_count: 10, featured: true, verified: true)
  end

  test 'sanitized serializer excludes sensitive fields' do
    json = CompanySerializer.new(@company).as_json
    refute json.key?(:phone)
    refute json.key?(:address)
    refute json.key?(:email_public)
    refute json.key?(:payment_methods)
    refute json.key?(:working_hours)
    assert json.key?(:name)
    assert json.key?(:rating_avg)
  end
end
