class AddCompanyReferencesAndSponsorshipToContentEntities < ActiveRecord::Migration[7.0]
  def change
    # Articles: add company, sponsored flags
    unless column_exists?(:articles, :company_id)
      add_reference :articles, :company, foreign_key: true, index: true
    end
    add_column :articles, :sponsored, :boolean, default: false unless column_exists?(:articles, :sponsored)
    add_column :articles, :sponsored_label, :string unless column_exists?(:articles, :sponsored_label)

    # ForumQuestions: add company (optional replacement for product context)
    unless column_exists?(:forum_questions, :company_id)
      add_reference :forum_questions, :company, foreign_key: true
    end

    # CampaignReviews -> rename to CampaignEngagements (future) left intact now, but add company reference for segmentation
    unless column_exists?(:campaign_reviews, :company_id)
      add_reference :campaign_reviews, :company, foreign_key: true
    end
    add_column :campaign_reviews, :sponsored, :boolean, default: false unless column_exists?(:campaign_reviews, :sponsored)
  end
end
