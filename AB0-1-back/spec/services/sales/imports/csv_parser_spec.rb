# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Sales::Imports::CsvParser do
  describe '.call' do
    it 'parses comma-separated CSV correctly' do
      csv_text = "empresa,nome,email\nSolar MT,João,joao@solar.com"
      result = described_class.call(csv_text)

      expect(result[:headers]).to eq(%w[empresa nome email])
      expect(result[:rows].size).to eq(1)
      expect(result[:rows].first[:data]).to eq({ 'empresa' => 'Solar MT', 'nome' => 'João', 'email' => 'joao@solar.com' })
    end

    it 'detects semicolon delimiter' do
      csv_text = "empresa;nome;email\nSolar MT;João;joao@solar.com"
      result = described_class.call(csv_text)

      expect(result[:delimiter]).to eq(';')
      expect(result[:headers]).to eq(%w[empresa nome email])
    end

    it 'strips UTF-8 BOM' do
      bom_csv = "\xEF\xBB\xBFempresa,email\nSolar,test@solar.com"
      result = described_class.call(bom_csv)

      expect(result[:headers].first).to eq('empresa')
    end
  end
end
