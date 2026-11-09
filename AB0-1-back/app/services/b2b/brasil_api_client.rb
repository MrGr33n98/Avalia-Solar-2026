# frozen_string_literal: true

module B2b
  class BrasilApiClient
    BASE_URL = 'https://brasilapi.com.br/api/cnpj/v1'

    def self.fetch(cnpj)
      new(cnpj).fetch
    end

    def initialize(cnpj)
      @raw_cnpj = cnpj.to_s
    end

    def fetch
      clean_cnpj = @raw_cnpj.gsub(/\D/, '')
      return { success: false, error: :invalid_format, message: 'O CNPJ deve conter exatamente 14 dígitos.' } unless clean_cnpj.length == 14

      response = HTTParty.get("#{BASE_URL}/#{clean_cnpj}", timeout: 6, headers: { 'Accept' => 'application/json' })

      case response.code
      when 200
        data = response.parsed_response
        {
          success: true,
          cnpj: clean_cnpj,
          razao_social: data['razao_social'].to_s.strip,
          nome_fantasia: (data['nome_fantasia'].presence || data['razao_social']).to_s.strip,
          situacao: data['descricao_situacao_cadastral'].to_s.strip,
          logradouro: data['logradouro'].to_s.strip,
          numero: data['numero'].to_s.strip,
          bairro: data['bairro'].to_s.strip,
          municipio: data['municipio'].to_s.strip,
          uf: data['uf'].to_s.strip.upcase,
          cep: data['cep'].to_s.strip,
          cnae_descricao: data['cnae_fiscal_descricao'].to_s.strip,
          cnae_codigo: data['cnae_fiscal'].to_s.strip,
          email: data['email'].to_s.strip.downcase,
          telefone: data['ddd_telefone_1'].to_s.strip
        }
      when 404
        { success: false, error: :not_found, message: 'CNPJ não encontrado na base oficial da Receita Federal.' }
      when 400
        { success: false, error: :invalid_cnpj, message: 'Número de CNPJ inválido perante a Receita Federal.' }
      else
        { success: false, error: :api_error, message: "Erro ao consultar CNPJ (#{response.code})." }
      end
    rescue HTTParty::Error, Net::OpenTimeout, Net::ReadTimeout, SocketError => e
      Rails.logger.error("[B2B::BrasilApiClient] Erro de rede: #{e.class} - #{e.message}")
      { success: false, error: :network_error, message: 'Serviço da Receita Federal temporariamente instável. Tente novamente em instantes.' }
    end
  end
end
