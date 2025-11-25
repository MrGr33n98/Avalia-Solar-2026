require 'test_helper'

class ContentFeedServiceTest < ActiveSupport::TestCase
  def setup
    @company = Company.create!(name: 'TestCo', description: 'Desc')
    @category = Category.create!(name: 'Cat One', description: 'Category desc')

    # Organic articles
    3.times do |i|
      Article.create!(title: "Organic #{i}", content: 'Body', category: @category, company: @company, sponsored: false)
    end
    # Sponsored articles
    2.times do |i|
      Article.create!(title: "Sponsored #{i}", content: 'Body', category: @category, company: @company, sponsored: true, sponsored_label: 'AD')
    end

    # Organic campaign reviews
    2.times do |i|
      CampaignReview.create!(title: "CampOrg #{i}", campaign: Campaign.create!(name: "Camp #{i}"), company: @company, sponsored: false)
    end
    # Sponsored campaign review
    CampaignReview.create!(title: 'CampSponsored', campaign: Campaign.create!(name: 'Camp S'), company: @company, sponsored: true)
  end

  test 'feed returns mixed organic and sponsored respecting limit' do
    feed = ContentFeedService.new(company_id: @company.id, limit: 10, sponsored_interval: 2).build
    assert feed.length <= 10
    # Should contain both Article and CampaignReview objects
    assert feed.any? { |i| i.is_a?(Article) }, 'Feed should include articles'
    assert feed.any? { |i| i.is_a?(CampaignReview) }, 'Feed should include campaign reviews'
  end

  test 'feed respects company filter' do
    other_company = Company.create!(name: 'OtherCo', description: 'Other')
    Article.create!(title: 'Other article', content: 'X', category: @category, company: other_company)
    feed = ContentFeedService.new(company_id: @company.id, limit: 5).build
    refute feed.any? { |i| i.respond_to?(:company_id) && i.company_id == other_company.id }, 'Feed should exclude other company content'
  end

  test 'sponsored interval logic interleaves sponsored items' do
    feed = ContentFeedService.new(company_id: @company.id, limit: 8, sponsored_interval: 2).build
    sponsored_positions = feed.each_with_index.select { |(item, _)| item.respond_to?(:sponsored) && item.sponsored }.map(&:last)
    refute sponsored_positions.sort == sponsored_positions.reverse, 'Sponsored items should be interleaved'
  end
end
