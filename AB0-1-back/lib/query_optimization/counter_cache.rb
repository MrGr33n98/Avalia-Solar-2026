# frozen_string_literal: true

# Counter cache helpers - TASK-022
# Usage: include QueryOptimization::CounterCache
module QueryOptimization
  module CounterCache
    extend ActiveSupport::Concern

    class_methods do
      # Reset counter cache for all records
      def reset_all_counters(association_name)
        find_each do |record|
          association_name = association_name.to_s.pluralize.to_sym
          counter_name = "#{association_name.to_s.singularize}_count"
          
          if column_names.include?(counter_name)
            count = record.public_send(association_name).count
            record.update_column(counter_name, count)
          end
        end
      end
    end
  end
end
