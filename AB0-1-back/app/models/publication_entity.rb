# frozen_string_literal: true

class PublicationEntity < ApplicationRecord
  belongs_to :publication, class_name: 'ReviewerPublication'
  belongs_to :entity, polymorphic: true

  validates :relation_type, presence: true, inclusion: { in: %w[mentioned used recommended related sponsored] }
  validates :publication_id, uniqueness: { scope: %i[entity_type entity_id], message: 'já possui esta relação' }
end
