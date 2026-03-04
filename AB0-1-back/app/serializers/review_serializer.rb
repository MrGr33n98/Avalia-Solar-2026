class ReviewSerializer < ActiveModel::Serializer
  attributes :id, :rating, :comment, :user_id, :company_id, :created_at, :updated_at,
             :reply, :replied_at, :status, :featured, :display_order, :verified,
             :headline, :project_type, :installation_status, :estimated_power,
             :is_legacy, :content_metadata, :metadata, :display_headline,
             :pros, :cons, :buyer_tip, :editorial_complete

  belongs_to :user
  belongs_to :company
  has_many :review_criterion_scores

  def display_headline
    object.headline.presence || object.comment&.truncate(60)
  end

  def pros
    object.content_metadata['pros'] || []
  end

  def cons
    object.content_metadata['cons'] || []
  end

  def buyer_tip
    object.content_metadata['buyer_tip']
  end

  def editorial_complete
    [object.headline, object.pros, object.cons, object.buyer_tip].all?(&:present?)
  end
end
