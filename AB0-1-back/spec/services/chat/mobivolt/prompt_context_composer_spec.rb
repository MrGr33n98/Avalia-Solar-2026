# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::Mobivolt::PromptContextComposer, type: :service do
  let(:payload_with_companies) do
    {
      busca_realizada: {
        cidade: 'Cuiabá',
        estado: 'MT',
        termo_chave: 'solar',
        source: 'https://www.avaliasolar.com.br/'
      },
      empresas_encontradas: [
        {
          nome: 'Alfa Solar',
          cidade: 'Cuiabá',
          estado: 'MT',
          nota_media: 4.9,
          total_avaliacoes: 22,
          link_perfil: 'https://www.avaliasolar.com.br/companies/alfa-solar',
          patrocinada: true,
          verificada: true,
          recommendation_reason: 'Empresa Destaque/Patrocinada',
          servicos: ['Instalação', 'Projetos'],
          nichos: ['Baterias e Off-Grid'],
          reviews_recentes: [
            { autor: 'Bobi S.', nota: 5.0, comentario: 'Instalação perfeita' }
          ]
        }
      ]
    }
  end

  let(:payload_empty) do
    {
      busca_realizada: {
        cidade: 'Rio Branco',
        estado: 'AC',
        termo_chave: 'solar',
        source: 'https://www.avaliasolar.com.br/'
      },
      empresas_encontradas: []
    }
  end

  describe '.compose' do
    it 'constrói o bloco estruturado de contexto quando há empresas' do
      result = described_class.compose(payload_with_companies)
      expect(result).to include('=== DYNAMIC COMPANY CONTEXT ===')
      expect(result).to include('Alfa Solar')
      expect(result).to include('Cuiabá, MT')
      expect(result).to include('Empresa Destaque/Patrocinada')
      expect(result).to include('INSTRUÇÕES ADICIONAIS IMPORTANTES:')
      expect(result).to include('NUNCA cite, recomende ou invente qualquer empresa que não esteja listada')
    end

    it 'constrói o fallback de nenhuma empresa quando a lista está vazia' do
      result = described_class.compose(payload_empty)
      expect(result).to include('=== DYNAMIC COMPANY CONTEXT ===')
      expect(result).to include('NENHUMA EMPRESA ENCONTRADA no banco de dados')
      expect(result).to include('Explique de forma amigável e honesta que atualmente não existem instaladores')
      expect(result).to include('Convide o usuário a preencher seus dados de contato')
    end
  end
end
