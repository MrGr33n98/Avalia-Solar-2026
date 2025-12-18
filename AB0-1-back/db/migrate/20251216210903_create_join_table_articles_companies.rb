class CreateJoinTableArticlesCompanies < ActiveRecord::Migration[7.0]
  def change
    create_join_table :articles, :companies do |t|
      # t.index [:article_id, :company_id]
      # t.index [:company_id, :article_id]
    end
  end
end
