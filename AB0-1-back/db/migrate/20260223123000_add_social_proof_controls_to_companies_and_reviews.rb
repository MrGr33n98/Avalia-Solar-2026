class AddSocialProofControlsToCompaniesAndReviews < ActiveRecord::Migration[7.0]
  def change
    unless column_exists?(:companies, :social_proof_enabled)
      add_column :companies, :social_proof_enabled, :boolean, default: false, null: false
    end

    unless column_exists?(:reviews, :display_order)
      add_column :reviews, :display_order, :integer, default: 0, null: false
    end

    unless index_exists?(:companies, :social_proof_enabled)
      add_index :companies, :social_proof_enabled
    end

    unless index_exists?(:reviews, [:company_id, :status, :featured, :display_order], name: 'idx_reviews_social_proof')
      add_index :reviews, [:company_id, :status, :featured, :display_order], name: 'idx_reviews_social_proof'
    end
  end
end
