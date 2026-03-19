f# frozen_string_literal: true

class Brand < ApplicationRecord
  has_many :products, dependent: :nullify
  has_many :analytics_events, dependent: :nullify

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true

  scope :active, -> { where(status: 'active') }

  def self.find_by_value(value)
    return nil if value.blank?

    if value.to_s.match?(/\A\d+\z/)
      find_by(id: value.to_i)
    else
      find_by(slug: value.to_s.downcase)
    end
  end
end
