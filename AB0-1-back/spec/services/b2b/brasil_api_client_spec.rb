# frozen_string_literal: true

require 'rails_helper'

RSpec.describe B2b::BrasilApiClient do
  describe '.fetch' do
    let(:valid_cnpj) { '06990590000123' }
    let(:formatted_cnpj) { '06.990.590/0001-23' }

    context 'when CNPJ format is invalid' do
      it 'returns error for strings with less than 14 digits' do
        result = described_class.fetch('12345')
        expect(result[:success]).to be false
        expect(result[:error]).to eq(:invalid_format)
      end
    end

    context 'when API returns 200 OK' do
      let(:api_response) do
        {
          'cnpj' => '06990590000123',
          'razao_social' => 'EMPRESA SOLAR TESTE LTDA',
          'nome_fantasia' => 'SOLAR TESTE',
          'descricao_situacao_cadastral' => 'ATIVA',
          'logradouro' => 'AV PAULISTA',
          'numero' => '1000',
          'bairro' => 'BELA VISTA',
          'municipio' => 'SAO PAULO',
          'uf' => 'SP',
          'cep' => '01310100',
          'cnae_fiscal_descricao' => 'Instalação e manutenção elétrica',
          'cnae_fiscal' => 4321500,
          'email' => 'contato@solarteste.com.br',
          'ddd_telefone_1' => '1133334444'
        }
      end

      before do
        stub_response = instance_double(HTTParty::Response, code: 200, parsed_response: api_response)
        allow(HTTParty).to receive(:get).with(
          "https://brasilapi.com.br/api/cnpj/v1/#{valid_cnpj}",
          hash_including(timeout: 6)
        ).and_return(stub_response)
      end

      it 'cleans formatting and returns normalized company details' do
        result = described_class.fetch(formatted_cnpj)
        expect(result[:success]).to be true
        expect(result[:cnpj]).to eq(valid_cnpj)
        expect(result[:razao_social]).to eq('EMPRESA SOLAR TESTE LTDA')
        expect(result[:nome_fantasia]).to eq('SOLAR TESTE')
        expect(result[:situacao]).to eq('ATIVA')
        expect(result[:municipio]).to eq('SAO PAULO')
        expect(result[:uf]).to eq('SP')
      end
    end

    context 'when CNPJ is not found (404)' do
      before do
        stub_response = instance_double(HTTParty::Response, code: 404)
        allow(HTTParty).to receive(:get).and_return(stub_response)
      end

      it 'returns friendly not_found error' do
        result = described_class.fetch(valid_cnpj)
        expect(result[:success]).to be false
        expect(result[:error]).to eq(:not_found)
      end
    end

    context 'when network timeout occurs' do
      before do
        allow(HTTParty).to receive(:get).and_raise(Net::OpenTimeout.new('Execution expired'))
      end

      it 'catches timeout and returns friendly network_error' do
        result = described_class.fetch(valid_cnpj)
        expect(result[:success]).to be false
        expect(result[:error]).to eq(:network_error)
      end
    end
  end
end
