# frozen_string_literal: true

module CategoryEditorial
  class SeedGuard
    CURATED_EDITORIAL_FIELDS = %i[
      seo_title
      seo_description
      short_description
      description
      seo_keywords
    ].freeze

    def self.upsert_category!(seo_url:, attributes:)
      category = Category.find_or_initialize_by(seo_url: seo_url)
      normalized_attrs = attributes.symbolize_keys

      if category.new_record?
        category.assign_attributes(normalized_attrs)
      else
        safe_attrs = normalized_attrs.except(*CURATED_EDITORIAL_FIELDS)
        CURATED_EDITORIAL_FIELDS.each do |field|
          next unless normalized_attrs.key?(field)
          next unless category.respond_to?(field)

          current_value = category.public_send(field)
          # Only populate if current value is blank or identical to the category name (trivial placeholder)
          if current_value.blank? || current_value.to_s.strip == category.name.to_s.strip
            safe_attrs[field] = normalized_attrs[field]
          end
        end
        category.assign_attributes(safe_attrs)
      end

      category.save!
      category
    end
  end
end

