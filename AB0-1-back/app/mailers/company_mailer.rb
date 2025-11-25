# frozen_string_literal: true

# Company-related emails - TASK-018
class CompanyMailer < ApplicationMailer
  # New review notification to company
  def new_review(company, review)
    @company = company
    @review = review
    @review_url = "#{self.class.default_url_options[:protocol]}://#{self.class.default_url_options[:host]}/companies/#{company.id}/reviews/#{review.id}"

    mail(
      to: company.email,
      subject: "Nova avaliação recebida - #{review.rating}⭐"
    )
  end

  # Monthly digest of reviews
  def monthly_digest(company, reviews)
    @company = company
    @reviews = reviews
    @total_reviews = reviews.count
    @avg_rating = reviews.average(:rating).round(1)
    @dashboard_url = "#{self.class.default_url_options[:protocol]}://#{self.class.default_url_options[:host]}/companies/#{company.id}/dashboard"

    mail(
      to: company.email,
      subject: "Resumo mensal - #{@total_reviews} novas avaliações"
    )
  end
end
