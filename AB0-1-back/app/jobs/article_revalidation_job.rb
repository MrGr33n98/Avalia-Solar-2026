# frozen_string_literal: true

class ArticleRevalidationJob < ApplicationJob
  queue_as :default

  retry_on Articles::FrontendRevalidator::Error, wait: :exponentially_longer, attempts: 5

  def perform(slugs)
    return unless Articles::FrontendRevalidator.configured?

    Articles::FrontendRevalidator.call!(slugs)
  end
end
