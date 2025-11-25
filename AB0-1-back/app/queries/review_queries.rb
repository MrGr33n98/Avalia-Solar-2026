# frozen_string_literal: true

# Optimized review queries - TASK-022
module ReviewQueries
  def self.with_associations
    Review.includes(:user, :company).order(created_at: :desc)
  end

  def self.recent(page = 1, per_page = 25)
    Review.includes(:user, :company).order(created_at: :desc).page(page).per(per_page)
  end
end
