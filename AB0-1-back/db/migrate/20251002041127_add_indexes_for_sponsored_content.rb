class AddIndexesForSponsoredContent < ActiveRecord::Migration[7.0]
  def change
    add_index :articles, [:company_id, :sponsored], name: 'index_articles_on_company_sponsored' unless index_exists?(:articles, [:company_id, :sponsored])
    add_index :campaign_reviews, [:company_id, :sponsored], name: 'index_campaign_reviews_on_company_sponsored' unless index_exists?(:campaign_reviews, [:company_id, :sponsored])
    add_index :articles, :created_at unless index_exists?(:articles, :created_at)
    add_index :campaign_reviews, :created_at unless index_exists?(:campaign_reviews, :created_at)
  end
end
