# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Feed::Diversifier, type: :service do
  it 'evita mais de dois itens consecutivos do mesmo autor quando houver alternativa' do
    items = 3.times.map { |index| double(actor_type: 'User', actor_id: 1, id: index) }
    items << double(actor_type: 'User', actor_id: 2, id: 4)

    result = described_class.call(items)

    expect(result.first(3).map(&:actor_id)).to eq([1, 1, 2])
  end
end
