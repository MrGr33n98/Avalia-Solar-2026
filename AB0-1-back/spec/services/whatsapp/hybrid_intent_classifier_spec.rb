# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Whatsapp::HybridIntentClassifier do
  describe '.call' do
    describe 'roteamento numérico do menu principal (1 a 5)' do
      it 'classifica opção 1 (AVALIAR) com dígito, ponto, emoji ou texto' do
        %w[1 1. 1️⃣ #1 opcao\ 1 opção\ 1].each do |input|
          result = described_class.call(input)
          expect(result[:intent]).to eq('evaluate_company'), "Falhou para entrada: #{input}"
          expect(result[:confidence]).to eq(1.0)
        end
      end

      it 'classifica opção 2 (CADASTRAR) com dígito, ponto, emoji ou texto' do
        %w[2 2. 2️⃣ #2 opcao\ 2 opção\ 2].each do |input|
          result = described_class.call(input)
          expect(result[:intent]).to eq('register_company'), "Falhou para entrada: #{input}"
          expect(result[:confidence]).to eq(1.0)
        end
      end

      it 'classifica opção 3 (REIVINDICAR) com dígito, ponto, emoji ou texto' do
        %w[3 3. 3️⃣ #3 opcao\ 3 opção\ 3].each do |input|
          result = described_class.call(input)
          expect(result[:intent]).to eq('claim_company'), "Falhou para entrada: #{input}"
          expect(result[:confidence]).to eq(1.0)
        end
      end

      it 'classifica opção 4 (PERFIL) com dígito, ponto, emoji ou texto' do
        %w[4 4. 4️⃣ #4 opcao\ 4 opção\ 4].each do |input|
          result = described_class.call(input)
          expect(result[:intent]).to eq('check_brand_page'), "Falhou para entrada: #{input}"
          expect(result[:confidence]).to eq(1.0)
        end
      end

      it 'classifica opção 5 (PLANOS) com dígito, ponto, emoji ou texto' do
        %w[5 5. 5️⃣ #5 opcao\ 5 opção\ 5].each do |input|
          result = described_class.call(input)
          expect(result[:intent]).to eq('ask_plans_pricing'), "Falhou para entrada: #{input}"
          expect(result[:confidence]).to eq(1.0)
        end
      end

      it 'NUNCA classifica o número 5 como human_support' do
        %w[5 5. 5️⃣ opcao\ 5].each do |input|
          result = described_class.call(input)
          expect(result[:intent]).not_to eq('human_support'), "5 não deve ser human_support para: #{input}"
        end
      end
    end

    describe 'palavras-chave e intenções textuais' do
      it 'classifica suporte humano por palavras-chave explícitas' do
        ['ajuda', 'AJUDA', 'atendente', 'Quero falar com uma pessoa', 'preciso de suporte'].each do |input|
          result = described_class.call(input)
          expect(result[:intent]).to eq('human_support')
        end
      end

      it 'classifica planos por termos comerciais' do
        ['planos', 'preço', 'tabela de preços', 'quanto custa o destaque', 'receber leads'].each do |input|
          result = described_class.call(input)
          expect(result[:intent]).to eq('ask_plans_pricing')
        end
      end

      it 'classifica menu de boas-vindas' do
        %w[menu MENU oi olá bom\ dia].each do |input|
          result = described_class.call(input)
          expect(result[:intent]).to eq('welcome_menu')
        end
      end

      it 'não confunde números de CNPJ ou telefones com opções do menu' do
        result = described_class.call('11222333000181')
        expect(result[:intent]).to eq('register_company')
        expect(result[:slots][:cnpj]).to eq('11222333000181')
      end
    end
  end
end
