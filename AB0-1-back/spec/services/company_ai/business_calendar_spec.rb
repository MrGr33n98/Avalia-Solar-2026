# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyAi::BusinessCalendar do
  let(:config) do
    {
      'timezone' => 'America/Sao_Paulo',
      'weekly' => { 'monday' => [{ 'start' => '09:00', 'end' => '18:00' }] },
      'exceptions' => { '2026-11-23' => [] }
    }
  end

  it 'respects local weekday hours and end-exclusive intervals' do
    config['exceptions'] = {}
    calendar = described_class.new(config)
    expect(calendar.open_at?(Time.utc(2026, 11, 23, 15))).to eq(true)  # 12:00 local
    expect(calendar.open_at?(Time.utc(2026, 11, 23, 21))).to eq(false) # 18:00 local
  end

  it 'gives dated exceptions precedence over recurring hours' do
    expect(described_class.new(config).open_at?(Time.utc(2026, 11, 23, 15))).to eq(false)
  end

  it 'rejects unknown timezones and impossible hours' do
    expect { described_class.new(config.merge('timezone' => 'Not/A_Zone')) }.to raise_error(ArgumentError)
    config['weekly']['monday'][0]['end'] = '25:40'
    expect { described_class.new(config) }.to raise_error(ArgumentError)
  end

  it 'rejects overlapping intervals and cross-midnight ranges in V1' do
    config['weekly']['monday'] = [
      { 'start' => '09:00', 'end' => '12:00' },
      { 'start' => '11:00', 'end' => '15:00' }
    ]
    expect { described_class.new(config) }.to raise_error(ArgumentError)
  end
end
