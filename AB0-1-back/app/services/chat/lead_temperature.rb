# frozen_string_literal: true

module Chat
  module LeadTemperature
    MAPPING = {
      'cold' => 'frio',
      'warm' => 'morno',
      'hot' => 'quente',
      'frio' => 'frio',
      'morno' => 'morno',
      'quente' => 'quente',
      'muito_quente' => 'muito_quente'
    }.freeze

    def self.normalize(value)
      MAPPING.fetch(value.to_s) do
        raise ArgumentError, "Temperatura de lead inválida: #{value.inspect}"
      end
    end
  end
end
