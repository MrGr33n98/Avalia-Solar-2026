class AddPartialIndexesForSponsoredContent < ActiveRecord::Migration[7.0]
  def change
    if postgresql?
      add_index :articles, :id, where: "sponsored = true", name: 'index_articles_on_sponsored_true' unless index_exists?(:articles, :id, name: 'index_articles_on_sponsored_true')
      add_index :campaign_reviews, :id, where: "sponsored = true", name: 'index_campaign_reviews_on_sponsored_true' unless index_exists?(:campaign_reviews, :id, name: 'index_campaign_reviews_on_sponsored_true')
    else
      add_index :articles, :sponsored, name: 'index_articles_on_sponsored' unless index_exists?(:articles, :sponsored, name: 'index_articles_on_sponsored')
      add_index :campaign_reviews, :sponsored, name: 'index_campaign_reviews_on_sponsored' unless index_exists?(:campaign_reviews, :sponsored, name: 'index_campaign_reviews_on_sponsored')
    end
  end

  private

  def postgresql?
    ActiveRecord::Base.connection.adapter_name =~ /PostgreSQL/i
  end
end
