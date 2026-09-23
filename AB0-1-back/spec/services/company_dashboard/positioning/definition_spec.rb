# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyDashboard::Positioning::Definition do
  it 'mantém a versão e os pesos governados pela plataforma' do
    expect(described_class::VERSION).to eq('positioning-v1')
    expect(described_class::X_AXIS.values.sum).to eq(1.0)
    expect(described_class::Y_AXIS.values.sum).to eq(0.9)
    expect(described_class::CAPS).to be_frozen
  end

  it 'classifica os limites com igualdade no quadrante superior' do
    expect(described_class.quadrant_for(60, 50, 60, 50)).to eq(:reference)
    expect(described_class.quadrant_for(60, 49.9, 60, 50)).to eq(:specialist)
    expect(described_class.quadrant_for(59.9, 50, 60, 50)).to eq(:expansion)
    expect(described_class.quadrant_for(59.9, 49.9, 60, 50)).to eq(:developing)
  end
end
