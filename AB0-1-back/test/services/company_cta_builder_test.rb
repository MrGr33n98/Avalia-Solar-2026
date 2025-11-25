require 'test_helper'

class CompanyCtaBuilderTest < ActiveSupport::TestCase
  setup do
    @company = companies(:one)
    @builder = CompanyCtaBuilder.new(@company)
  end

  test "should build CTA for company" do
    cta = @builder.build
    
    assert_not_nil cta
    assert_includes cta, @company.name
  end

  test "should build primary CTA" do
    cta = @builder.build_primary_cta('Sign Up')
    
    assert_equal 'Sign Up', cta[:text]
    assert_not_nil cta[:url]
  end

  test "should build secondary CTA" do
    cta = @builder.build_secondary_cta('Learn More')
    
    assert_equal 'Learn More', cta[:text]
    assert_not_nil cta[:url]
  end

  test "should customize CTA with options" do
    options = { style: 'primary', size: 'large' }
    cta = @builder.build_with_options('Click Me', options)
    
    assert_equal 'primary', cta[:style]
    assert_equal 'large', cta[:size]
  end

  test "should generate tracking URL" do
    url = @builder.generate_tracking_url('https://example.com')
    
    assert_includes url, 'utm_source'
    assert_includes url, @company.slug
  end

  test "should build CTA for campaign" do
    campaign = campaigns(:one)
    cta = @builder.build_for_campaign(campaign)
    
    assert_not_nil cta
    assert_includes cta[:url], campaign.id.to_s
  end

  test "should build multiple CTAs" do
    ctas = @builder.build_multiple([
      { text: 'CTA 1', url: '/url1' },
      { text: 'CTA 2', url: '/url2' }
    ])
    
    assert_equal 2, ctas.count
  end

  test "should validate CTA data" do
    assert @builder.valid_cta?({ text: 'Click', url: '/path' })
    assert_not @builder.valid_cta?({ text: '' })
    assert_not @builder.valid_cta?({ url: '' })
  end

  test "should handle missing company" do
    builder = CompanyCtaBuilder.new(nil)
    cta = builder.build
    
    assert_nil cta
  end

  test "should add analytics to CTA" do
    cta = @builder.build_with_analytics('Button', event: 'click')
    
    assert_not_nil cta[:analytics]
    assert_equal 'click', cta[:analytics][:event]
  end
end
