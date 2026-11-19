# frozen_string_literal: true

# O catálogo pode ser editado, mas não excluído: a exclusão apagaria em cascata o
# histórico de conquistas. Para aposentar uma conquista, use `active: false`.
class AchievementBadgePolicy < ApplicationPolicy
  def destroy?
    false
  end
end
