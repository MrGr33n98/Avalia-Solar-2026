module Sales
  class Policy < ApplicationPolicy
    def index? = internal_sales?
    alias show? index?
    alias create? index?
    alias update? index?

    private

    def internal_sales?
      user.respond_to?(:admin?) && user.admin?
    end
  end
end
