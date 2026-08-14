module ReviewForms
  class CriteriaResolver
    def self.call(review_form:, category: nil)
      category ||= review_form.experience_category
      return [] unless category

      settings = review_form.normalized_settings
      ids = Array(settings.dig('questions', 'criteria_ids')).filter_map { |id| Integer(id, exception: false) }
      scope = RatingCriterion.active.where(category: category)
      scope = scope.where(id: ids) if ids.any?
      criteria = scope.order(:id).to_a
      return criteria if ids.empty?

      criteria.sort_by { |criterion| ids.index(criterion.id) || ids.length }
    end
  end
end
