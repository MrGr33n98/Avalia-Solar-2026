# frozen_string_literal: true

# Database indexes recommendations - TASK-022
module QueryOptimization
  class Indexes
    # Analyze and suggest indexes
    def self.analyze
      suggestions = []

      # Check for missing foreign key indexes
      suggestions += missing_foreign_key_indexes

      # Check for missing unique indexes
      suggestions += missing_unique_indexes

      # Check for unused indexes (requires pg_stat_statements)
      suggestions += unused_indexes if Rails.env.production?

      suggestions
    end

    def self.missing_foreign_key_indexes
      suggestions = []
      
      ActiveRecord::Base.connection.tables.each do |table|
        columns = ActiveRecord::Base.connection.columns(table)
        indexes = ActiveRecord::Base.connection.indexes(table)
        index_columns = indexes.flat_map(&:columns)

        columns.each do |column|
          if column.name.end_with?('_id') && !index_columns.include?(column.name)
            suggestions << {
              table: table,
              column: column.name,
              type: :foreign_key,
              migration: "add_index :#{table}, :#{column.name}"
            }
          end
        end
      end

      suggestions
    end

    def self.missing_unique_indexes
      # Add logic to detect columns that should have unique indexes
      []
    end

    def self.unused_indexes
      # Requires pg_stat_statements extension
      []
    end

    # Generate migration file
    def self.generate_migration
      suggestions = analyze
      return "No indexes needed" if suggestions.empty?

      migration = <<~RUBY
        class AddMissingIndexes < ActiveRecord::Migration[7.0]
          def change
        #{suggestions.map { |s| "    #{s[:migration]}" }.join("\n")}
          end
        end
      RUBY

      migration
    end
  end
end
