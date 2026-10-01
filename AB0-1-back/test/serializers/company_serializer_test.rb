require 'test_helper'

class CompanySerializerTest < ActiveSupport::TestCase
  def setup
    @company = Company.create!(name: 'Comp', description: 'Desc', website: 'https://example.com', state: 'MG',
                               city: 'BH', rating_avg: 4.5, rating_count: 10, featured: true, verified: true)
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

  test 'does not expose historical banner attachment for free company' do
    @company.banner.attach(io: StringIO.new('legacy-banner'), filename: 'legacy.png', content_type: 'image/png')

    @company.stub(:custom_banner_entitled?, false) do
      assert_nil CompanySerializer.new(@company).as_json[:banner_url]
    end
  end
end
