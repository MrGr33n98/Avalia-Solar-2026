require 'test_helper'

class CompanyCardSerializerTest < ActiveSupport::TestCase
  test "should serialize correct unified fields" do
    company = Company.new(
      name: "Sol Eletrica",
      slug: "sol-eletrica",
      rating_avg: 4.8,
      rating_count: 10,
      business_verification_status: 'verified',
      response_sla_minutes: 120,
      delivered_projects_count: 50,
      active_admin: true
    )
    
    serializer = CompanyCardSerializer.new(company)
    data = serializer.as_json
    
    assert_equal "Sol Eletrica", data[:identity][:name]
    assert_equal "sol-eletrica", data[:identity][:slug]
    assert_equal "verified", data[:trust][:verification_status]
    assert_equal 4.8, data[:reputation][:rating_avg].to_f
    assert_equal 10, data[:reputation][:rating_count].to_i
    assert_equal 50, data[:operations][:delivered_projects]
    assert_equal 120, data[:operations][:sla_minutes]
  end
end
