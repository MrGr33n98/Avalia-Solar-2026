# frozen_string_literal: true

require 'uri'

dump_path = Rails.root.join('db', 'seed_data', 'companies_dump.tsv')
if File.exist?(dump_path)
  public_domains = %w[
    gmail.com
    yahoo.com
    hotmail.com
    outlook.com
    uol.com.br
    bol.com.br
    terra.com.br
    live.com
    icloud.com
  ].freeze

  email_regex = /\A[^@\s]+@[^@\s]+\.[^@\s]+\z/
  url_regex = URI::DEFAULT_PARSER.make_regexp(%w[http https])

  normalize_phone = lambda do |value, enforce_length|
    digits = value.to_s.gsub(/\D/, '')
    return nil if digits.empty?
    return nil if enforce_length && !digits.length.between?(10, 15)
    digits
  end

  extract_emails = lambda do |*values|
    values
      .compact
      .flat_map { |value| value.to_s.split(/[;,]/) }
      .map { |value| value.sub(/\Amailto:\s*/i, '').strip.downcase }
      .reject { |value| value.empty? || value.casecmp('null').zero? }
      .select { |value| value.match?(email_regex) }
  end

  pick_url = lambda do |*values|
    values
      .compact
      .map { |value| value.to_s.strip }
      .find { |value| value.match?(url_regex) }
  end

  created = 0
  updated = 0
  forced = 0

  File.foreach(dump_path, encoding: 'UTF-8').with_index(1) do |line, line_number|
    line = line.chomp
    next if line.strip.empty?

    columns = line.split("\t", -1).map { |value| value.to_s.strip }
    name = columns[0]
    next if name.empty?

    phone_raw = columns[1]
    email_raw = columns[2]
    mailto_raw = columns[3]
    website_raw = columns[4]
    website_alt_raw = columns[5]
    location_raw = columns[6]
    phone_alt_raw = columns[7]

    emails = extract_emails.call(email_raw, mailto_raw)
    email = emails.first
    corporate_email = emails.find do |value|
      domain = value.split('@').last.to_s.downcase
      !public_domains.include?(domain)
    end

    website = pick_url.call(website_raw, website_alt_raw)

    location = location_raw.to_s.strip
    address = location.presence
    city = nil
    state = nil

    if location.match?(/\s+-\s+/)
      parts = location.split(/\s+-\s+/, 2)
      city = parts[0].to_s.strip.tr('`', "'")
      state = parts[1].to_s.strip.upcase
    else
      city = location.presence
    end

    if state.present? && !Locations::BrLocations.valid_state?(state)
      state = nil
    end

    if state.present? && city.present? && !Locations::BrLocations.valid_city?(state, city)
      city = nil
    end

    phone_digits = normalize_phone.call(phone_raw, false)
    alt_digits = normalize_phone.call(phone_alt_raw, false)

    phone = normalize_phone.call(phone_raw, true)
    phone = normalize_phone.call(phone_alt_raw, true) if phone.nil?

    phone_alt_candidates = [alt_digits, phone_digits].compact.uniq
    phone_alt_candidates.delete(phone) if phone
    phone_alt = phone_alt_candidates.first

    attrs = {
      name: name,
      description: 'Empresa importada do dump.',
      phone: phone,
      phone_alt: phone_alt,
      email: email,
      email_public: corporate_email,
      website: website,
      address: address,
      state: state,
      city: city,
      status: 'pending'
    }.compact

    lookup_attrs = { name: name }
    lookup_attrs[:state] = state if state.present?
    lookup_attrs[:city] = city if city.present?

    company = Company.find_or_initialize_by(lookup_attrs)
    company.assign_attributes(attrs)

    was_new = company.new_record?

    if company.save
      was_new ? created += 1 : updated += 1
    else
      company.save!(validate: false)
      forced += 1
    end
  rescue => e
    puts "Linha #{line_number}: falha ao importar #{name.inspect} - #{e.message}"
  end

  puts "Empresas do dump: #{created} criadas, #{updated} atualizadas, #{forced} com validação ignorada."
else
  puts "Arquivo de dump não encontrado: #{dump_path}"
end
