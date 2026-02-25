class Plan < ApplicationRecord
  def feature_flags
    json_features =
      if respond_to?(:features_json)
        parse_feature_source(features_json)
      else
        {}
      end
    return json_features if json_features.present?

    parse_feature_source(respond_to?(:features) ? features : nil)
  end

  # Add these methods for Ransack
  def self.ransackable_attributes(_auth_object = nil)
    attrs = %w[created_at description features id name price updated_at]
    attrs << 'features_json' if column_names.include?('features_json')
    attrs
  end

  def self.ransackable_associations(_auth_object = nil)
    []
  end

  private

  def parse_feature_source(raw)
    case raw
    when String
      begin
        JSON.parse(raw)
      rescue StandardError
        begin
          YAML.safe_load(raw)
        rescue StandardError
          {}
        end
      end
    when Hash
      raw
    else
      {}
    end
  rescue StandardError
    {}
  end
end
