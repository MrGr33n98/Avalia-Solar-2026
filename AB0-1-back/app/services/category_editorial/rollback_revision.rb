# frozen_string_literal: true

module CategoryEditorial
  class RollbackRevision
    def self.call(category:, target_revision:, actor_id: nil)
      if target_revision.nil? || target_revision.category_id != category.id
        return PublishRevision::Result.new(
          success?: false,
          category: category,
          revision: target_revision,
          error_code: :invalid_target_revision,
          error_message: 'Target revision must belong to the category'
        )
      end

      rollback_copy = CategoryEditorialRevision.create!(
        category: category,
        version_number: CategoryEditorialRevision.next_version_number_for(category.id),
        status: 'review',
        payload_json: target_revision.payload_json,
        change_reason: "Rollback to v#{target_revision.version_number}",
        created_by_id: actor_id,
        reviewed_by_id: actor_id
      )

      PublishRevision.call(revision: rollback_copy, actor_id: actor_id)
    end
  end
end

