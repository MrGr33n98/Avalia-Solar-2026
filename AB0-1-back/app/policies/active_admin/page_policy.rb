module ActiveAdmin
  class PagePolicy < ApplicationPolicy
    def show?
      case record.name
      when 'Dashboard'
        true
      else
        admin?
      end
    end
  end
end
