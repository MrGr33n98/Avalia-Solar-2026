require 'rails_helper'

RSpec.describe Review, type: :model do
  describe '#pros and #cons' do
    shared_examples 'normalizes editorial list' do |attribute|
      it 'returns an empty list for invalid empty values' do
        review = build(:review, attribute => nil)
        expect(review.public_send(attribute)).to eq([])

        review.write_attribute(attribute, [])
        expect(review.public_send(attribute)).to eq([])

        review.write_attribute(attribute, '[]')
        expect(review.public_send(attribute)).to eq([])

        review.write_attribute(attribute, ['[]'])
        expect(review.public_send(attribute)).to eq([])

        review.write_attribute(attribute, [''])
        expect(review.public_send(attribute)).to eq([])

        review.write_attribute(attribute, ['null'])
        expect(review.public_send(attribute)).to eq([])
      end

      it 'preserves valid text values' do
        review = build(:review, attribute => 'Atendimento bom')
        expect(review.public_send(attribute)).to eq(['Atendimento bom'])

        review.write_attribute(attribute, ['Atendimento bom', 'Instalação rápida'])
        expect(review.public_send(attribute)).to eq(['Atendimento bom', 'Instalação rápida'])
      end
    end

    include_examples 'normalizes editorial list', :pros
    include_examples 'normalizes editorial list', :cons
  end
end