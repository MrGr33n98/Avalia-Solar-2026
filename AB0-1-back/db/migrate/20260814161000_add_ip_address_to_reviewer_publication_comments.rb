class AddIpAddressToReviewerPublicationComments < ActiveRecord::Migration[7.0]
  def change
    add_column :reviewer_publication_comments, :ip_address, :string unless column_exists?(:reviewer_publication_comments, :ip_address)
    add_index :reviewer_publication_comments, %i[ip_address created_at], name: 'idx_publication_comments_ip_created' unless index_exists?(:reviewer_publication_comments, %i[ip_address created_at], name: 'idx_publication_comments_ip_created')
  end
end
