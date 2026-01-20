# frozen_string_literal: true

class PendingChangePolicy < ApplicationPolicy
  def approve?
    admin?
  end

  def reject?
    admin?
  end
end
