# frozen_string_literal: true

class SearchZeroResult < ApplicationRecord
  belongs_to :category, optional: true

  validates :query, presence: true
end
