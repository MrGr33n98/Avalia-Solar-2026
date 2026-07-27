# frozen_string_literal: true

class PublicProfileRevalidationJob < ApplicationJob
  queue_as :default

  def perform(company_id)
    return unless PublicProfileRevalidator.configured?

    PublicProfileRevalidator.call!(Company.find(company_id))
  end
end
