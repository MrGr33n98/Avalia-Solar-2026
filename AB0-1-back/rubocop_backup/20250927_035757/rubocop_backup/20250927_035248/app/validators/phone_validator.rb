class PhoneValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    return if value.blank? && options[:allow_blank]

    # Basic phone format validation for Brazilian numbers
    return if value.match?(/\A\([0-9]{2}\)\s[0-9]{4,5}-[0-9]{4}\z/)

    record.errors.add(attribute, 'must be in format (XX) XXXX-XXXX or (XX) XXXXX-XXXX')
  end
end
