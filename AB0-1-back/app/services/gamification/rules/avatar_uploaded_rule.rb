# frozen_string_literal: true

module Gamification
  module Rules
    class AvatarUploadedRule < BaseRule
      def evaluate(user)
        has_avatar = user.avatar.attached?
        [has_avatar, has_avatar ? (user.avatar.attachment&.created_at || user.updated_at || Time.current) : nil]
      end
    end
  end
end
