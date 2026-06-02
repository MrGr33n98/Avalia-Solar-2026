module Reviews
  class ModerationService
    def evaluate(review)
      return if review.approved? || review.rejected?

      if suspicious?(review)
        DecisionService.new.flag!(review)
      elsif trusted_reviewer?(review.user)
        DecisionService.new.approve!(review)
      else
        # Stays pending
      end
    end

    private

    def trusted_reviewer?(user)
      return false unless user

      user.reviews.where(status: Review.statuses[:approved]).count > 0
    end

    def suspicious?(review)
      return true if self_review?(review)
      return true if contains_pii?(review.comment.to_s)
      
      false
    end

    def self_review?(review)
      user = review.user
      company = review.company
      return false unless user && company

      return true if company.respond_to?(:user_id) && user.id == company.user_id
      return true if company.respond_to?(:owner_id) && user.id == company.owner_id
      return true if user.respond_to?(:owner_of?) && user.owner_of?(company)

      false
    end

    def contains_pii?(text)
      # Basic regex for email
      email_regex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
      
      # Basic regex for CPF (xxx.xxx.xxx-xx or xxxxxxxxxxx)
      cpf_regex = /(?:\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})/
      
      text.match?(email_regex) || text.match?(cpf_regex)
    end
  end
end
