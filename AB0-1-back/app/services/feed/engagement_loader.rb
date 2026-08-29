# frozen_string_literal: true

module Feed
  class EngagementLoader
    attr_reader :reactions_counts, :comments_counts, :viewer_reactions, :saved_items

    def initialize(subjects:, current_user: nil)
      @subjects = Array(subjects).compact
      @current_user = current_user
      @reactions_counts = Hash.new(0)
      @comments_counts = Hash.new(0)
      @viewer_reactions = {}
      @saved_items = {}
    end

    def call
      return self if @subjects.empty?

      types = @subjects.map { |subject| subject.class.base_class.name }.uniq
      ids = @subjects.map(&:id)
      @reactions_counts = grouped_counts(Reaction, :reactable_type, :reactable_id, types, ids)
      @comments_counts = grouped_counts(Comment.where(status: 'active'), :commentable_type, :commentable_id, types, ids)
      load_viewer_state(types, ids) if @current_user
      self
    end

    def key(subject)
      [subject.class.base_class.name, subject.id]
    end

    private

    def grouped_counts(relation, type_column, id_column, types, ids)
      relation.where(type_column => types, id_column => ids).group(type_column, id_column).count
    end

    def load_viewer_state(types, ids)
      Reaction.where(user: @current_user, reactable_type: types, reactable_id: ids).find_each do |reaction|
        @viewer_reactions[[reaction.reactable_type, reaction.reactable_id]] = reaction.reaction_type
      end
      SavedItem.where(user: @current_user, saveable_type: types, saveable_id: ids).find_each do |saved|
        @saved_items[[saved.saveable_type, saved.saveable_id]] = true
      end
    end
  end
end
