class AddPartialIndexesForSponsoredContent < ActiveRecord::Migration[7.0]
  def change
    add_index :articles, :id, where: "sponsored = true", name: 'index_articles_on_sponsored_true' unless index_exists?(:articles, :id, name: 'index_articles_on_sponsored_true')
    add_index :campaign_reviews, :id, where: "sponsored = true", name: 'index_campaign_reviews_on_sponsored_true' unless index_exists?(:campaign_reviews, :id, name: 'index_campaign_reviews_on_sponsored_true')
  end
end
