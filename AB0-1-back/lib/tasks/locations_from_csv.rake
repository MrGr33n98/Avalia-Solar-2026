# frozen_string_literal: true

require 'csv'
require 'fileutils'
require 'json'

namespace :locations do
  desc 'Gera config/data/br_locations.json a partir de db/data/municipios.csv'
  task sync_from_csv: :environment do
    csv_path = Rails.root.join('db', 'data', 'municipios.csv')
    output_path = Rails.root.join('config', 'data', 'br_locations.json')

    unless File.exist?(csv_path)
      raise "CSV não encontrado em #{csv_path}. Verifique o caminho do arquivo."
    end

    raw = File.binread(csv_path)
    data = raw.dup.force_encoding('UTF-8')
    unless data.valid_encoding?
      data = begin
        raw.dup.force_encoding('Windows-1252').encode('UTF-8')
      rescue Encoding::InvalidByteSequenceError, Encoding::UndefinedConversionError
        raw.dup.force_encoding('ISO-8859-1').encode('UTF-8', invalid: :replace, undef: :replace)
      end
    end

    rows = CSV.parse(data, headers: true, col_sep: ';')
    headers = rows.headers.compact
    header_map = headers.each_with_object({}) do |header, acc|
      key = ActiveSupport::Inflector.transliterate(header.to_s)
                                      .downcase
                                      .gsub(/[^a-z0-9]+/, '_')
                                      .gsub(/\A_+|_+\z/, '')
      acc[key] = header
    end

    uf_header = header_map['uf'] || header_map['sigla_uf'] || header_map['estado_sigla']
    state_header = header_map['nome_uf'] || header_map['estado'] || header_map['nome_estado'] || header_map['estado_nome']
    city_header =
      header_map['municipio'] ||
      header_map['municipio_ibge'] ||
      header_map['municipio_tom'] ||
      header_map['cidade'] ||
      header_map['nome_municipio'] ||
      header_map['nome']

    if uf_header.blank? || city_header.blank?
      raise "Cabeçalhos inválidos no CSV. UF: #{uf_header.inspect}, cidade: #{city_header.inspect}."
    end

    state_names = {
      'AC' => 'Acre',
      'AL' => 'Alagoas',
      'AP' => 'Amapá',
      'AM' => 'Amazonas',
      'BA' => 'Bahia',
      'CE' => 'Ceará',
      'DF' => 'Distrito Federal',
      'ES' => 'Espírito Santo',
      'GO' => 'Goiás',
      'MA' => 'Maranhão',
      'MT' => 'Mato Grosso',
      'MS' => 'Mato Grosso do Sul',
      'MG' => 'Minas Gerais',
      'PA' => 'Pará',
      'PB' => 'Paraíba',
      'PR' => 'Paraná',
      'PE' => 'Pernambuco',
      'PI' => 'Piauí',
      'RJ' => 'Rio de Janeiro',
      'RN' => 'Rio Grande do Norte',
      'RS' => 'Rio Grande do Sul',
      'RO' => 'Rondônia',
      'RR' => 'Roraima',
      'SC' => 'Santa Catarina',
      'SP' => 'São Paulo',
      'SE' => 'Sergipe',
      'TO' => 'Tocantins'
    }

    states = {}

    rows.each do |row|
      uf = row[uf_header].to_s.strip.upcase
      next if uf.blank?

      state_name = state_header.present? ? row[state_header].to_s.strip : ''
      state_name = state_names[uf] if state_name.blank?
      state_name = uf if state_name.blank?

      city = row[city_header].to_s.strip.gsub(/\s+/, ' ')
      next if city.blank?

      states[uf] ||= { 'acronym' => uf, 'name' => state_name, 'cities' => [] }
      states[uf]['cities'] << city
    end

    payload_states = states.values.sort_by { |state| state['acronym'] }
    total_cities = 0

    payload_states.each do |state|
      cities = state['cities']
                    .map { |city| city.to_s.strip.gsub(/\s+/, ' ') }
                    .reject(&:blank?)
                    .uniq
                    .sort_by { |city| ActiveSupport::Inflector.transliterate(city).downcase }
      state['cities'] = cities
      total_cities += cities.length
    end

    FileUtils.mkdir_p(output_path.dirname)
    File.write(output_path, JSON.pretty_generate({ 'states' => payload_states }))

    puts "UFs: #{payload_states.size}, total cidades: #{total_cities}, arquivo: #{output_path}"
  end
end
