# frozen_string_literal: true

module Groups
  module Feature
    module_function

    def enabled?
      ActiveModel::Type::Boolean.new.cast(ENV.fetch('GROUPS_ENABLED', 'false'))
    end
  end
end