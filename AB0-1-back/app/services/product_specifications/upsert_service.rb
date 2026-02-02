module ProductSpecifications
  class UpsertService
    def self.call(product:, specs_payload:)
      new(product: product, specs_payload: specs_payload).call
    end

    def initialize(product:, specs_payload:)
      @product = product
      @specs_payload = Array(specs_payload).compact
    end

    def call
      @specs_payload.each do |spec|
        key = spec[:key] || spec['key']
        next if key.blank?

        template = SpecTemplate.find_by(key: key)
        next unless template

        record = ProductSpecification.find_or_initialize_by(product: @product, spec_template: template)
        value = spec[:value] || spec['value'] || spec[:value_number] || spec['value_number'] || spec[:value_json] || spec['value_json']
        record.assign_typed_value(value)
        record.value_unit = template.unit
        record.save!
      end
    end
  end
end
