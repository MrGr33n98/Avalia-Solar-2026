class ReviewCriterionScoreSerializer < ActiveModel::Serializer
  attributes :id, :score, :not_applicable, :rating_criterion_id, :title

  def title
    object.rating_criterion&.title
  end
end
