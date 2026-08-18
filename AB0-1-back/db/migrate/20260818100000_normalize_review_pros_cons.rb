require 'json'

class NormalizeReviewProsCons < ActiveRecord::Migration[7.0]
  class MigrationReview < ActiveRecord::Base
    self.table_name = 'reviews'
  end

  def up
    counts = audit_counts
    say "Review pros/cons normalization counts before update: #{counts.sort.to_h.inspect}"

    MigrationReview.find_each(batch_size: 1_000) do |review|
      updates = {}
      %w[pros cons].each do |column|
        raw_value = review.public_send(column)
        normalized = normalize_list(raw_value)
        serialized = JSON.generate(normalized)
        updates[column] = serialized if raw_value != serialized
      end
      review.update_columns(updates) if updates.any?
    end

    change_column :reviews, :pros, :jsonb, default: [], null: false,
                  using: "CASE WHEN pros IS NULL OR btrim(pros) = '' THEN '[]'::jsonb ELSE pros::jsonb END"
    change_column :reviews, :cons, :jsonb, default: [], null: false,
                  using: "CASE WHEN cons IS NULL OR btrim(cons) = '' THEN '[]'::jsonb ELSE cons::jsonb END"
  end

  def down
    change_column :reviews, :pros, :text, default: nil, null: true, using: 'pros::text'
    change_column :reviews, :cons, :text, default: nil, null: true, using: 'cons::text'
  end

  private

  def audit_counts
    counts = Hash.new(0)
    MigrationReview.find_each(batch_size: 1_000) do |review|
      %w[pros cons].each do |column|
        raw_value = review.public_send(column)
        counts["#{column}:#{classification(raw_value, normalize_list(raw_value))}"] += 1
      end
    end
    counts
  end

  def normalize_list(value)
    items = case value
            when Array
              value
            when String
              stripped = value.strip
              if stripped.blank? || stripped == '[]'
                []
              else
                begin
                  parsed = JSON.parse(stripped)
                  parsed.is_a?(Array) ? parsed : [stripped]
                rescue JSON::ParserError
                  [stripped]
                end
              end
            when nil
              []
            else
              Array(value)
            end

    items.map { |item| item.to_s.strip }
         .reject(&:blank?)
         .reject { |item| %w[[] {} null nil].include?(item.downcase) }
  end

  def classification(raw_value, normalized)
    return 'null' if raw_value.nil?
    return 'array_valid' if raw_value.is_a?(Array) && normalized == raw_value.map { |item| item.to_s.strip }
    return 'array_contaminated' if raw_value.is_a?(Array)
    return 'string_empty' if raw_value.to_s.strip.blank?
    return 'string_empty_json' if normalized.empty?
    return 'string_json_array' if raw_value.to_s.strip.start_with?('[')

    'string_text'
  end
end