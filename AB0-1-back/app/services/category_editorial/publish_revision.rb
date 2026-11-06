# frozen_string_literal: true

module CategoryEditorial
  class PublishRevision
    Result = Struct.new(:success?, :category, :revision, :error_code, :error_message, keyword_init: true)

    ALLOWED_CATEGORY_FIELDS = %w[
      name
      seo_title
      seo_description
      short_description
      description
    ].freeze

    def self.call(...)
      new(...).call
    end

    def initialize(revision:, actor_id: nil)
      @revision = revision
      @actor_id = actor_id
    end

    def call
      return failure(:invalid_revision, 'Revision is required') if @revision.nil?

      category = @revision.category
      payload = @revision.payload_json.is_a?(Hash) ? @revision.payload_json : {}

      ActiveRecord::Base.transaction do
        CategoryEditorialRevision
          .where(category_id: category.id, status: 'published')
          .where.not(id: @revision.id)
          .update_all(status: 'archived', updated_at: Time.current)

        updatable = payload.slice(*ALLOWED_CATEGORY_FIELDS).select do |col, _val|
          category.respond_to?("#{col}=")
        end

        updatable['editorial_status'] = 'published' if category.respond_to?(:editorial_status=)
        updatable['published_at'] = Time.current if category.respond_to?(:published_at=)
        updatable['published_by_id'] = @actor_id if category.respond_to?(:published_by_id=) && @actor_id.present?

        category.assign_attributes(updatable)
        category.save!

        @revision.update!(
          status: 'published',
          reviewed_by_id: @actor_id || @revision.reviewed_by_id,
          published_at: Time.current
        )
      end

      category.clear_query_cache! if category.respond_to?(:clear_query_cache!)
      Result.new(success?: true, category: category, revision: @revision)
    rescue ActiveRecord::StaleObjectError => e
      failure(:stale_object, e.message)
    rescue ActiveRecord::RecordInvalid => e
      failure(:validation_failed, e.message)
    end

    private

    def failure(code, message)
      Result.new(success?: false, category: @revision&.category, revision: @revision, error_code: code, error_message: message)
    end
  end
end

