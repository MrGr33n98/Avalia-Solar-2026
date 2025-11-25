class UrlValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    return if value.blank? && options[:allow_blank]

    uri = URI.parse(value)
    valid = uri.is_a?(URI::HTTP) || uri.is_a?(URI::HTTPS)
    record.errors.add(attribute, 'must be a valid URL') unless valid
  rescue URI::InvalidURIError
    record.errors.add(attribute, 'must be a valid URL')
  end
end
