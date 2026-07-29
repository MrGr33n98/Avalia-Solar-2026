# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::Mobivolt::IntentParserService, type: :service do
  describe '.parse' do
    it 'extrai cidade e define recommendation_intent como true para "recomende instalador em Cuiabá"' do
      result = described_class.parse('recomende instalador em Cuiabá')
      expect(result[:recommendation_intent]).to be true
      expect(result[:city]).to eq('Cuiabá')
    end

    it 'extrai keyword de marca para "tem empresa que trabalha com Intelbras?"' do
      result = described_class.parse('tem empresa que trabalha com Intelbras?')
      expect(result[:keyword]).to eq('Intelbras')
    end

    it 'extrai keyword de servico para "quem trabalha com carregador?"' do
      result = described_class.parse('quem trabalha com carregador?')
      expect(result[:keyword]).to eq('carregador')
    end

    it 'extrai categoria de mobilidade para busca de wallbox residencial' do
      result = described_class.parse('recomende empresas de wallbox residencial em São Paulo SP')
      expect(result[:category_seo_url]).to eq('carregadores-residenciais')
    end

    it 'extrai categoria solar para busca residencial' do
      result = described_class.parse('recomende empresas de energia solar com perfil residencial em Campinas SP')
      expect(result[:category_seo_url]).to eq('energia-solar-residencial')
    end

    it 'prioriza categoria de financiamento quando a busca também informa perfil residencial' do
      text = 'recomende empresas de energia solar para buscar financiamento com perfil residencial em Campinas SP'
      result = described_class.parse(text)
      expect(result[:category_seo_url]).to eq('financiamento-energia-solar')
    end

    context 'testes de variação de texto e ambiguidade geográfica' do
      it 'identifica cidade informada sem UF (ex: São Paulo)' do
        result = described_class.parse('recomende instaladores em São Paulo')
        expect(result[:city]).to eq('São Paulo')
      end

      it 'identifica UF informada sem cidade (ex: SP)' do
        result = described_class.parse('empresas em SP')
        expect(result[:state]).to eq('SP')
      end

      it 'suporta caixa alta e baixa sem diferenciação' do
        result = described_class.parse('RECOMENDE EMPRESAS EM CUIABÁ MT')
        expect(result[:city]).to eq('Cuiabá')
        expect(result[:state]).to eq('MT')
      end

      it 'suporta texto sem acentos' do
        result = described_class.parse('recomende instalador em Cuiaba MT')
        expect(result[:city]).to eq('Cuiabá')
      end

      it 'trata Formosa com UF explícita' do
        result = described_class.parse('instalador em Formosa GO')
        expect(result[:city]).to eq('Formosa')
        expect(result[:state]).to eq('GO')
      end

      it 'trata Registro com UF explícita' do
        result = described_class.parse('empresa em Registro SP')
        expect(result[:city]).to eq('Registro')
        expect(result[:state]).to eq('SP')
      end
    end
  end
end
