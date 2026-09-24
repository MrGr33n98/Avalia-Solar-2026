# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Territory::CsvAuditor do
  subject(:auditor) { described_class.new(csv_path: csv_path) }

  context 'with real municipios.csv' do
    let(:csv_path) { Rails.root.join('db', 'data', 'municipios.csv') }

    it 'successfully audits encoding, rows, IBGE uniqueness and invalid UFs' do
      report = auditor.audit

      expect(report[:audit_passed]).to be true
      expect(report[:detected_encoding]).to eq('ISO-8859-1')
      expect(report[:total_rows]).to eq(5571)
      expect(report[:unique_ibge_count]).to eq(5570)
      expect(report[:duplicate_ibge_count]).to eq(0)
      expect(report[:missing_code_count]).to eq(1) # 'EX' exterior record with IBGE 0
      expect(report[:invalid_uf_count]).to eq(1) # 'EX' exterior record
      expect(report[:invalid_ufs].first[:uf]).to eq('EX')
      expect(report[:homonym_names_count]).to be > 200
    end
  end

  context 'with a mock fixture containing duplicate IBGE' do
    let(:temp_csv) { Tempfile.new(['test_mun', '.csv']) }
    let(:csv_path) { temp_csv.path }

    before do
      temp_csv.write("TOM;IBGE;NAME_TOM;NAME_IBGE;UF\n1;10001;TEST A;Test A;SC\n2;10001;TEST B;Test B;PR\n")
      temp_csv.rewind
    end

    after do
      temp_csv.close
      temp_csv.unlink
    end

    it 'detects duplicate IBGE codes and fails audit_passed' do
      report = auditor.audit
      expect(report[:duplicate_ibge_count]).to eq(1)
      expect(report[:audit_passed]).to be false
    end
  end
end
