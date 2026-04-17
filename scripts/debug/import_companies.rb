# import_companies.rb
# Salve este arquivo e execute: docker exec -it ab0-backend rails runner /caminho/para/import_companies.rb

puts "🚀 INICIANDO IMPORTAÇÃO DE EMPRESAS SOLARES (INTERNACIONAIS EM SP)..."

# Garantir que os arrays sejam serializados como strings se seu modelo não suportar arrays
def serialize_array(data)
  data.is_a?(Array) ? data.join(', ') : data
end

# Função para gerar CNPJ válido para teste
def generate_valid_cnpj(base_index)
  base = "45033916#{base_index.to_s.rjust(4, '0')}"
  
  def calc_digit(digits, weights)
    sum = digits.chars.zip(weights).map { |d, w| d.to_i * w }.sum
    mod = sum % 11
    mod < 2 ? 0 : 11 - mod
  end

  d1 = calc_digit(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  d2 = calc_digit(base + d1.to_s, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  
  cnpj_digits = "#{base}#{d1}#{d2}"
  "#{cnpj_digits[0..1]}.#{cnpj_digits[2..4]}.#{cnpj_digits[5..7]}/#{cnpj_digits[8..11]}-#{cnpj_digits[12..13]}"
end

# Mapeamento de categorias
category_map = {
  "1" => "energia-solar",
  "2" => "instaladores-energia-solar",
  "3" => "energia-solar-comercial-industrial",
  "4" => "energia-solar-residencial",
  "5" => "financiamento-energia-solar"
}

# Mapeamento de Project Types
project_type_map = {
  "Residencial" => "Residenciais",
  "Comercial" => "Comerciais",
  "Industrial" => "Comerciais",
  "Utility" => "Comerciais",
  "Rural" => "Rurais"
}

# Mapeamento de Services Offered
service_map = {
  "Venda de painéis" => "Consultoria Energética",
  "Distribuição" => "Consultoria Energética",
  "Suporte Técnico" => "Manutenção e Suporte",
  "Instalação" => "Instalação Residencial",
  "Projetos" => "Instalação Comercial",
  "EPC" => "Instalação Comercial",
  "Manutenção" => "Manutenção e Suporte",
  "Desenvolvimento de projetos" => "Consultoria Energética",
  "Sistemas integrados" => "Instalação Comercial",
  "Sistemas completos" => "Instalação Residencial",
  "O&M" => "Manutenção e Suporte",
  "Venda de painéis premium" => "Consultoria Energética",
  "Venda de painéis econômicos" => "Consultoria Energética",
  "Projetos de grande escala" => "Instalação Comercial",
  "Venda de painéis personalizados" => "Consultoria Energética",
  "Desenvolvimento" => "Consultoria Energética",
  "Consultoria" => "Consultoria Energética"
}

# Função para processar telefones
def process_phone(phone_string)
  return nil unless phone_string
  
  # Extrair apenas números
  numbers = phone_string.scan(/\d+/).join('')
  
  # Remover zeros iniciais e ajustar DDD
  if numbers.length >= 10
    ddd = numbers[0..1]
    number = numbers[2..-1]
    
    if number.length == 8
      "#{ddd}#{number}"
    elsif number.length == 9
      "#{ddd}#{number}"
    else
      numbers
    end
  else
    numbers
  end
end

# Função para extrair primeiro email
def extract_first_email(email_string)
  return nil unless email_string
  
  # Limpar e extrair primeiro email
  first_email = email_string.to_s.split(/[;,]/).first
  first_email&.strip&.downcase
end

# Função para processar sites
def process_website(site_string)
  return nil unless site_string
  
  site = site_string.to_s.strip
  site = "http://#{site}" unless site.start_with?('http://', 'https://')
  site
end

# Função para corrigir tipos de projeto
def corrigir_project_types(project_types)
  return [] unless project_types
  
  if project_types.is_a?(String)
    types = project_types.split(',').map(&:strip).reject(&:empty?)
  elsif project_types.is_a?(Array)
    types = project_types
  else
    types = []
  end
  
  # Mapear tipos inválidos para válidos
  tipos_validos = []
  types.each do |tipo|
    case tipo.to_s.strip
    when "Industriais", "Industrial"
      tipos_validos << "Comerciais"
    when "Residenciais", "Residencial"
      tipos_validos << "Residenciais"
    when "Comerciais", "Comercial"
      tipos_validos << "Comerciais"
    when "Rurais", "Rural"
      tipos_validos << "Rurais"
    else
      tipos_validos << "Comerciais"
    end
  end
  
  tipos_validos.uniq
end

# Função para corrigir serviços
def corrigir_services(services)
  return [] unless services
  
  if services.is_a?(String)
    servs = services.split(',').map(&:strip).reject(&:empty?)
  elsif services.is_a?(Array)
    servs = services
  else
    servs = []
  end
  
  servs.map do |serv|
    case serv.to_s.strip
    when "Instalação Residencial", "Residencial"
      "Instalação Residencial"
    when "Instalação Comercial", "Comercial", "EPC", "Sistemas integrados", "Projetos de grande escala"
      "Instalação Comercial"
    when "Instalação Industrial", "Industrial"
      "Instalação Comercial"
    when "Manutenção e Suporte", "Suporte Técnico", "O&M", "Manutenção"
      "Manutenção e Suporte"
    when "Consultoria Energética", "Consultoria", "Venda de painéis", "Distribuição", "Desenvolvimento de projetos"
      "Consultoria Energética"
    else
      "Consultoria Energética"
    end
  end.uniq
end

# Função para gerar descrição baseada no nome e cidade
def generate_description(nome, cidade, estado)
  descricoes = [
    "Empresa especializada em soluções de energia solar fotovoltaica, oferecendo projetos personalizados para residências e empresas.",
    "Integradora de energia solar com foco em eficiência energética e sustentabilidade.",
    "Especializada em instalação e manutenção de sistemas fotovoltaicos de alta qualidade.",
    "Empresa líder em energia renovável, proporcionando economia e sustentabilidade para seus clientes.",
    "Soluções completas em energia solar, desde a consultoria até a instalação e manutenção.",
    "Empresa comprometida com a democratização da energia solar no Brasil.",
    "Expertise em projetos de energia solar para diversos segmentos e portes.",
    "Tecnologia e inovação em energia solar para um futuro mais sustentável.",
    "Soluções inteligentes em energia solar, combinando qualidade e preço competitivo.",
    "Empresa com vasta experiência no mercado de energia solar, atendendo todo o território nacional."
  ]
  
  "#{nome.split.first} - #{descricoes.sample} Atuamos em #{cidade}/#{estado} e região."
end

# Função para gerar endereço baseado na cidade e estado
def generate_address(cidade, estado)
  ruas = {
    "SP" => ["Rua das Flores", "Avenida Paulista", "Rua XV de Novembro", "Avenida Brasil", "Rua São João"],
    "MG" => ["Rua da Bahia", "Avenida Afonso Pena", "Rua São Paulo", "Avenida Getúlio Vargas"],
    "RJ" => ["Rua do Ouvidor", "Avenida Rio Branco", "Rua Uruguaiana", "Avenida Atlântica"],
    "PR" => ["Rua XV de Novembro", "Avenida Silva Jardim", "Rua Marechal Deodoro"],
    "SC" => ["Rua Felipe Schmidt", "Avenida Beira Mar", "Rua João Pinto"],
    "RS" => ["Rua da Praia", "Avenida Borges de Medeiros", "Rua dos Andradas"],
    "ES" => ["Avenida Princesa Isabel", "Rua São Marcos", "Avenida Nossa Senhora da Penha"],
    "GO" => ["Avenida 85", "Rua 7", "Avenida Goiás"],
    "MT" => ["Avenida Historiador Rubens de Mendonça", "Rua Galdino Pimentel"],
    "MS" => ["Avenida Afonso Pena", "Rua 14 de Julho"],
    "BA" => ["Avenida Sete de Setembro", "Rua Chile", "Avenida Tancredo Neves"],
    "CE" => ["Avenida Beira Mar", "Rua Barão do Rio Branco"],
    "PE" => ["Avenida Boa Viagem", "Rua do Imperador"],
    "PB" => ["Avenida Epitácio Pessoa", "Rua Duque de Caxias"],
    "RN" => ["Avenida Hermes da Fonseca", "Rua Princesa Isabel"],
    "AL" => ["Avenida Fernandes Lima", "Rua do Comércio"],
    "SE" => ["Avenida Ivo do Prado", "Rua Vila Cristina"],
    "TO" => ["Avenida NS-10", "Rua 7 de Setembro"],
    "PA" => ["Avenida Presidente Vargas", "Rua Ó de Almeida"],
    "AM" => ["Avenida Eduardo Ribeiro", "Rua 10 de Julho"],
    "RO" => ["Avenida Jorge Teixeira", "Rua Dom Pedro II"],
    "AC" => ["Avenida Ceará", "Rua Benjamin Constant"],
    "RR" => ["Avenida Capitão Júlio Bezerra", "Rua Floriano Peixoto"],
    "AP" => ["Avenida FAB", "Rua General Rondon"],
    "MA" => ["Avenida dos Holandeses", "Rua do Passeio"],
    "PI" => ["Avenida Frei Serafim", "Rua Álvaro Mendes"],
    "DF" => ["Setor Comercial Sul", "Setor de Autarquias Norte", "Asa Sul"]
  }
  
  rua = ruas[estado] ? ruas[estado].sample : "Rua Principal"
  numero = rand(100..2000)
  "#{rua}, #{numero}, Centro, #{cidade}, #{estado}"
end

# Função para gerar coordenadas aproximadas baseado na cidade
def generate_coordinates(cidade, estado)
  # Coordenadas aproximadas para algumas cidades principais
  coordenadas = {
    "São Paulo" => { lat: -23.5505, lng: -46.6333 },
    "Campinas" => { lat: -22.9056, lng: -47.0608 },
    "Rio de Janeiro" => { lat: -22.9068, lng: -43.1729 },
    "Belo Horizonte" => { lat: -19.9167, lng: -43.9345 },
    "Curitiba" => { lat: -25.4296, lng: -49.2713 },
    "Porto Alegre" => { lat: -30.0331, lng: -51.2300 },
    "Brasília" => { lat: -15.7939, lng: -47.8828 },
    "Salvador" => { lat: -12.9714, lng: -38.5014 },
    "Fortaleza" => { lat: -3.7319, lng: -38.5267 },
    "Recife" => { lat: -8.0476, lng: -34.8770 },
    "Manaus" => { lat: -3.1190, lng: -60.0217 },
    "Goiânia" => { lat: -16.6869, lng: -49.2648 },
    "Cuiabá" => { lat: -15.6011, lng: -56.0974 },
    "Florianópolis" => { lat: -27.5969, lng: -48.5495 },
    "Vitória" => { lat: -20.3155, lng: -40.3128 },
    "Maceió" => { lat: -9.6658, lng: -35.7353 },
    "Natal" => { lat: -5.7793, lng: -35.2009 },
    "João Pessoa" => { lat: -7.1190, lng: -34.8450 },
    "Teresina" => { lat: -5.0892, lng: -42.8019 },
    "São Luís" => { lat: -2.5307, lng: -44.3068 },
    "Belém" => { lat: -1.4558, lng: -48.4903 },
    "Porto Velho" => { lat: -8.7619, lng: -63.9039 },
    "Rio Branco" => { lat: -9.9747, lng: -67.8100 },
    "Macapá" => { lat: 0.0349, lng: -51.0694 },
    "Boa Vista" => { lat: 2.8235, lng: -60.6758 },
    "Palmas" => { lat: -10.2491, lng: -48.3243 },
    "Aracaju" => { lat: -10.9472, lng: -37.0731 }
  }
  
  if coordenadas[cidade]
    { latitude: coordenadas[cidade][:lat], longitude: coordenadas[cidade][:lng] }
  else
    # Coordenadas aproximadas baseadas no estado
    estado_coords = {
      "SP" => { lat: -22.0 + rand(-2.0..2.0), lng: -48.0 + rand(-2.0..2.0) },
      "MG" => { lat: -19.0 + rand(-2.0..2.0), lng: -44.0 + rand(-2.0..2.0) },
      "RJ" => { lat: -22.0 + rand(-1.0..1.0), lng: -43.0 + rand(-1.0..1.0) },
      "PR" => { lat: -25.0 + rand(-2.0..2.0), lng: -51.0 + rand(-2.0..2.0) },
      "SC" => { lat: -27.0 + rand(-2.0..2.0), lng: -49.0 + rand(-2.0..2.0) },
      "RS" => { lat: -30.0 + rand(-2.0..2.0), lng: -53.0 + rand(-2.0..2.0) },
      "ES" => { lat: -20.0 + rand(-1.0..1.0), lng: -40.0 + rand(-1.0..1.0) },
      "GO" => { lat: -16.0 + rand(-2.0..2.0), lng: -49.0 + rand(-2.0..2.0) },
      "MT" => { lat: -15.0 + rand(-2.0..2.0), lng: -56.0 + rand(-2.0..2.0) },
      "MS" => { lat: -20.0 + rand(-2.0..2.0), lng: -55.0 + rand(-2.0..2.0) },
      "BA" => { lat: -12.0 + rand(-2.0..2.0), lng: -41.0 + rand(-2.0..2.0) },
      "CE" => { lat: -5.0 + rand(-2.0..2.0), lng: -39.0 + rand(-2.0..2.0) },
      "PE" => { lat: -8.0 + rand(-1.0..1.0), lng: -35.0 + rand(-1.0..1.0) },
      "PB" => { lat: -7.0 + rand(-1.0..1.0), lng: -36.0 + rand(-1.0..1.0) },
      "RN" => { lat: -5.0 + rand(-1.0..1.0), lng: -36.0 + rand(-1.0..1.0) },
      "AL" => { lat: -9.0 + rand(-1.0..1.0), lng: -36.0 + rand(-1.0..1.0) },
      "SE" => { lat: -10.0 + rand(-1.0..1.0), lng: -37.0 + rand(-1.0..1.0) },
      "TO" => { lat: -10.0 + rand(-2.0..2.0), lng: -48.0 + rand(-2.0..2.0) },
      "PA" => { lat: -5.0 + rand(-2.0..2.0), lng: -52.0 + rand(-2.0..2.0) },
      "AM" => { lat: -3.0 + rand(-2.0..2.0), lng: -60.0 + rand(-2.0..2.0) },
      "RO" => { lat: -8.0 + rand(-2.0..2.0), lng: -63.0 + rand(-2.0..2.0) },
      "AC" => { lat: -9.0 + rand(-2.0..2.0), lng: -70.0 + rand(-2.0..2.0) },
      "RR" => { lat: 2.0 + rand(-2.0..2.0), lng: -61.0 + rand(-2.0..2.0) },
      "AP" => { lat: 1.0 + rand(-2.0..2.0), lng: -52.0 + rand(-2.0..2.0) },
      "MA" => { lat: -5.0 + rand(-2.0..2.0), lng: -45.0 + rand(-2.0..2.0) },
      "PI" => { lat: -5.0 + rand(-2.0..2.0), lng: -42.0 + rand(-2.0..2.0) },
      "DF" => { lat: -15.7939, lng: -47.8828 }
    }
    
    if estado_coords[estado]
      { latitude: estado_coords[estado][:lat], longitude: estado_coords[estado][:lng] }
    else
      { latitude: -15.0 + rand(-10.0..10.0), longitude: -50.0 + rand(-20.0..20.0) }
    end
  end
end

# Dados das empresas (extraídos do CSV fornecido)
companies_data = [
  # --- Instituições Financeiras e de Fomento (Consolidado - 20 Empresas) ---
  { name: "Banco Santander Brasil", phone: "0800 762 7777", email: "financiamentosolar@santander.com.br", website: "https://www.santander.com.br", city: "São Paulo", state: "SP", category_id: "5" },
  { name: "Banco BV (Meu Porto Seguro)", phone: "3003-1616", email: "solar@bv.com.br", website: "https://www.bv.com.br/financiamento-solar", city: "São Paulo", state: "SP", category_id: "5" },
  { name: "Banco do Brasil (Energia Renovável)", phone: "0800 729 0722", email: "agronegocios@bb.com.br", website: "https://www.bb.com.br", city: "São Paulo", state: "SP", category_id: "5" },
  { name: "Itaú BBA - ESG Solutions", phone: "0800 728 0728", email: "atendimento.esg@itau-unibanco.com.br", website: "https://www.itaubba.com", city: "São Paulo", state: "SP", category_id: "5" },
  { name: "Bradesco Financiamentos", phone: "0800 727 9977", email: "financiamento.solar@bradesco.com.br", website: "https://banco.bradesco", city: "São Paulo", state: "SP", category_id: "5" },
  { name: "Solfácil (Fintech Solar)", phone: "11 3042-1234", email: "contato@solfacil.com.br", website: "https://solfacil.com.br", city: "São Paulo", state: "SP", category_id: "5" },
  { name: "Sicoob - Crédito Sustentável", phone: "0800 642 0000", email: "atendimento@sicoob.com.br", website: "https://www.sicoob.com.br", city: "São Paulo", state: "SP", category_id: "5" },
  { name: "Sicredi - Energia Solar", phone: "0800 724 7220", email: "sustentabilidade@sicredi.com.br", website: "https://www.sicredi.com.br", city: "São Paulo", state: "SP", category_id: "5" },
  { name: "BNDES (Finame Baixo Carbono)", phone: "0800 702 6337", email: "faleconosco@bndes.gov.br", website: "https://www.bndes.gov.br", city: "São Paulo", state: "SP", category_id: "5" },
  { name: "Caixa Econômica Federal", phone: "0800 726 0101", email: "sustentabilidade@caixa.gov.br", website: "https://www.caixa.gov.br", city: "São Paulo", state: "SP", category_id: "5" },
  { name: "Banco Safra (ESG Finance)", phone: "11 3175-7000", email: "atendimento@safra.com.br", website: "https://www.safra.com.br", city: "São Paulo", state: "SP", category_id: "5" },
  { name: "BNB - Banco do Nordeste (FNE Sol)", phone: "0800 728 3030", email: "fnesol@bnb.gov.br", website: "https://www.bnb.gov.br", city: "São Paulo", state: "SP", category_id: "5" },
  { name: "Banco da Amazônia (BASA Energia)", phone: "0800 727 7228", email: "faleconosco@bancoamazonia.com.br", website: "https://www.bancoamazonia.com.br", city: "São Paulo", state: "SP", category_id: "5" },
  { name: "CRESOL (Crédito Sustentável)", phone: "0800 645 2015", email: "contato@cresol.com.br", website: "https://cresol.com.br", city: "São Paulo", state: "SP", category_id: "5" },
  { name: "Unicred (Linha Solar)", phone: "0800 644 6777", email: "atendimento@unicred.com.br", website: "https://www.unicred.com.br", city: "São Paulo", state: "SP", category_id: "5" },
  { name: "Cofidis Brasil", phone: "0800 888 3333", email: "parcerias@cofidis.com.br", website: "https://www.cofidis.com.br", city: "São Paulo", state: "SP", category_id: "5" },
  { name: "Insole (Fintech Solar)", phone: "0800 000 1234", email: "contato@insole.com.br", website: "https://insole.com.br", city: "São Paulo", state: "SP", category_id: "5" },
  { name: "BRDE (Banco Regional de Desenvolvimento)", phone: "0800 41 4060", email: "brdepr@brde.com.br", website: "https://www.brde.com.br", city: "São Paulo", state: "SP", category_id: "5" },
  { name: "Desenvolve SP", phone: "11 3123-0464", email: "faleconosco@desenvolvesp.com.br", website: "https://www.desenvolvesp.com.br", city: "São Paulo", state: "SP", category_id: "5" },
  { name: "Banco ABC Brasil", phone: "11 3170-2000", email: "sustentabilidade@abcbrasil.com.br", website: "https://www.abcbrasil.com.br", city: "São Paulo", state: "SP", category_id: "5" },

  # INTERNACIONAIS FILTRADAS E CONFIGURADAS PARA SÃO PAULO
  { name: "3E", phone: "11 3003-0001", email: "info@3e.eu", website: "https://3e.eu", city: "São Paulo", state: "SP" },
  { name: "AdvanSol Power Technology", phone: "11 3003-0002", email: "sales@advansol.net", website: "http://www.advansol.net", city: "São Paulo", state: "SP" },
  { name: "Afore New Energy Technology", phone: "11 3003-0003", email: "service@aforenergy.com", website: "https://www.aforenergy.com", city: "São Paulo", state: "SP" },
  { name: "American Ground Screw", phone: "11 3003-0004", email: "info@americangroundscrew.com", website: "https://americangroundscrew.com", city: "São Paulo", state: "SP" },
  { name: "Ampace", phone: "11 3003-0005", email: "contact@ampace.com", website: "https://www.ampace.com", city: "São Paulo", state: "SP" },
  { name: "AndSolar Technology", phone: "11 3003-0006", email: "sales@andsolar.com", website: "http://www.andsolar.com", city: "São Paulo", state: "SP" },
  { name: "Huasun", phone: "11 3003-0007", email: "sales@huasun.net", website: "https://www.huasun.net", city: "São Paulo", state: "SP" },
  { name: "WOO POWER", phone: "11 3003-0008", email: "info@woopower.cn", website: "http://woopower.cn", city: "São Paulo", state: "SP" },
  { name: "Anhui Zhenda Brush Industry", phone: "11 3003-0009", email: "sales@zhendabrush.com", website: "http://zhendabrush.com", city: "São Paulo", state: "SP" },
  { name: "ANTAI TECHNOLOGY", phone: "11 3003-0010", email: "sales@antaisolar.com", website: "https://www.antaisolar.com", city: "São Paulo", state: "SP" },
  { name: "Arctech Solar", phone: "11 3003-0011", email: "sales@arctechsolar.com", website: "https://www.arctechsolar.com", city: "São Paulo", state: "SP" },
  
  # MANUTENÇÃO DOS DADOS ORIGINAIS (STK, Mitratech, etc.)
  { name: "STK SOLAR LTDA", phone: "(11) 4901-0374", email: "contato@stksolar.com.br", website: "http://stksolar.com.br", city: "Santo André", state: "SP" },
  { name: "Mitratech", phone: "(19) 3957-7301", email: "vendas@mitratech.com.br", website: "http://www.mitratech.com.br", city: "Campinas", state: "SP" },
  {
    name: "ELETROJILHO ENGENHARIA ELETRICA & ENERGIA SOLAR LTDA",
    phone: "(11)9933-0681",
    email: "ELETROJILHO.ADM@GMAIL.COM",
    website: "",
    city: "Cabreúva",
    state: "SP"
  },
  {
    name: "SOL ATITUDE SOLUCOES EM ENERGIA LTDA",
    phone: "(11) 4280-3245",
    email: "contato@solatitude.com.br",
    website: "https://solatitude.com.br/",
    city: "São Paulo",
    state: "SP"
  },
  {
    name: "AVL Comércio e Prestação de Serviços LTDA",
    phone: "11 47212009",
    email: "vendas@avltech.eng.br",
    website: "http://www.avltech.eng.br",
    city: "Mogi das Cruzes",
    state: "SP"
  },
  {
    name: "Sustenta Brasil",
    phone: "(13) 97410-9882",
    email: "comercial@sustentabr.com; solar@sustentabr.com",
    website: "http://www.sustentabr.com.br",
    city: "Santos",
    state: "SP"
  },
  {
    name: "Ultra Solares Serviços de Engenharia Eletrica LTDA",
    phone: "(11)95305-5494",
    email: "contato@ultrasolares.com.br",
    website: "http://www.ultrasolares.com.br",
    city: "Guarulhos",
    state: "SP"
  },
  {
    name: "ILIKE ENERGIA SOLAR LTDA",
    phone: "(11) 989548985",
    email: "contato@ilikeenergiasolar.com.br",
    website: "http://www.ilikeenergiasolar.com.br",
    city: "São Paulo",
    state: "SP"
  },
  {
    name: "ALL ENERGY",
    phone: "11 95073-3440",
    email: "fabiana.allenergy@gmail.com",
    website: "",
    city: "Atibaia",
    state: "SP"
  },
  {
    name: "RESO COMERCIO ENGENHARIA E SERVICOS LTDA",
    phone: "(11)98853-8645",
    email: "comercial@gruporeso.com.br",
    website: "",
    city: "Jundiaí",
    state: "SP"
  },
  {
    name: "Claudeir Lopes e Filhos - Soluções em Energia",
    phone: "(19) 98202-7310",
    email: "gustavolopes.eletrica@hotmail.com",
    website: "http://www.claudeirlopesefilhos.com",
    city: "Divinolândia",
    state: "SP"
  },
  {
    name: "Eletro C e C",
    phone: "19 38953093; 19 99805-5916",
    email: "eletricaccterrafioscabos@gmail.com",
    website: "",
    city: "Socorro",
    state: "SP"
  },
  {
    name: "Azimuth Renováveis",
    phone: "(19) 3604-7786",
    email: "contato@azimuthrenovaveis.com.br",
    website: "https://azimuthrenovaveis.com.br",
    city: "Americana",
    state: "SP"
  },
  {
    name: "Servant Serviços de Elétrica",
    phone: "13 30432649",
    email: "marco@servantenergia.com.br",
    website: "",
    city: "São Vicente",
    state: "SP"
  },
  {
    name: "Latin America Solar",
    phone: "(14) 3227 - 8979; (16) 3600-8495; (16) 98128-4844",
    email: "rogerio.perdona@lasolar.com.br; contato@lasolar.com.br",
    website: "http://lasolar.com.br; http://lasolar.com.br",
    city: "Bauru",
    state: "SP"
  },
  {
    name: "SOLARTECNO ENERGIA SOLAR",
    phone: "(14) 99748-6358",
    email: "contato@solartecno.com.br",
    website: "http://www.solartecno.com.br",
    city: "Bauru",
    state: "SP"
  },
  {
    name: "Automatize Energia",
    phone: "(19) 3454-6386",
    email: "sac@automatize.eng.br",
    website: "http://www.automatizeenergia.com.br",
    city: "Santa Bárbara d`Oeste",
    state: "SP"
  },
  {
    name: "Capacitech Service Drives Ribeirão Preto LTDA - ME",
    phone: "(16) 3996-5000; 16 98197-7200",
    email: "vendas@capacitech.com.br; fotovoltaico5@capacitech.com.br",
    website: "http://www.capacitech.com.br",
    city: "Ribeirão Preto",
    state: "SP"
  },
  {
    name: "Italuz - Comércio de Materiais Elétricos",
    phone: "15 35242444",
    email: "thiago.italuz@gmail.com",
    website: "",
    city: "Itapeva",
    state: "SP"
  },
  {
    name: "SOLARMAR PRODUTOS LTDA",
    phone: "(13)99721-7228",
    email: "projetos@solarmar.com.br",
    website: "",
    city: "Peruíbe",
    state: "SP"
  },
  {
    name: "MAAZ COMERCIAL LTDA EPP",
    phone: "(19) 3641-5858; (19) 98421-0190",
    email: "maaz@maaz.com.br",
    website: "",
    city: "Vargem Grande do Sul",
    state: "SP"
  },
  {
    name: "ALBA TECNOLOGIA INDUSTRIAL LTDA",
    phone: "(35) 4102-1599",
    email: "contato@albaenergia.com.br",
    website: "http://www.albaenergia.com.br",
    city: "Pouso Alegre",
    state: "MG"
  },
  {
    name: "EMSEL EMPRESA DE MATERIAIS E SOLUÇÕES ELÉTRICAS EIRELI",
    phone: "(35) 99231-0099",
    email: "emselmateriais@gmail.com",
    website: "https://emselenergia.com.br/",
    city: "Poços de Caldas",
    state: "MG"
  },
  {
    name: "A Iluminadora Casa Branca Ltda",
    phone: "(19) 99121-8928",
    email: "contato@ilcabran.com.br",
    website: "",
    city: "Casa Branca",
    state: "SP"
  },
  {
    name: "KG ENERGIA SOLAR",
    phone: "(35) 3457-1437; (35) 99898-4806",
    email: "compras@kgenergiasolar.com.br",
    website: "https://www.kgenergiasolar.com.br/",
    city: "Heliodora",
    state: "MG"
  },
  {
    name: "3 R ENERGIA NOVA RESENDENSE EIRELI",
    phone: "(35) 3562-2767; (35) 99953-1956",
    email: "3renergia@gmail.com",
    website: "http://www.3renergiapc.com.br/",
    city: "Nova Resende",
    state: "MG"
  },

  {
    name: "PD ENERGY",
    phone: "(19) 3681-6200 - WhatsApp; (19) 9 9171-1316",
    email: "engenharia@pdenergy.com.br; samuel@pdenergy.com.br",
    website: "http://www.pdenergy.com.br",
    city: "São José do Rio Pardo",
    state: "SP"
  },
  {
    name: "Azzon Engenharia LTDA",
    phone: "(19) 3542-1955; (19) 98986-0753; (19) 98961-7869",
    email: "comercial@azzon.com.br",
    website: "https://azzon.com.br",
    city: "Araras",
    state: "SP"
  },
  {
    name: "Ecopower Eficiência Energética",
    phone: "4000-1722; 17 98128-1849",
    email: "supervisor.compras@ecopower.com.br",
    website: "http://www.ecopower.com.br",
    city: "Barretos",
    state: "SP"
  },
  {
    name: "Impacto Energia Solar Eireli",
    phone: "(35) 99132-2667",
    email: "rafael@impactoenergiasolar.com",
    website: "https://www.impactoenergiasolar.com/",
    city: "Campo Belo",
    state: "MG"
  },
  {
    name: "MB ENERGIA - SOLUCOES INTELIGENTES",
    phone: "(35) 3425-7000; (35) 99834-6000",
    email: "contato@energiamb.com.br",
    website: "https://www.energiamb.com.br/",
    city: "Pouso Alegre",
    state: "MG"
  },
  {
    name: "ALVO SOLAR SISTEMAS DE ENERGIA LTDA",
    phone: "(35) 3551-2667",
    email: "contato@alvosolar.com.br",
    website: "http://alvosolar.com.br/",
    city: "Guaxupé",
    state: "MG"
  },
  {
    name: "HYPER SOLAR IMPORTAÇÃO E EXPORTAÇÃO LTDA.",
    phone: "(35) 3552-4366; (35) 99990-5246",
    email: "compras@megasolarenergy.com.br",
    website: "https://hypersolarenergy.com.br/",
    city: "Guaxupé",
    state: "MG"
  },
  {
    name: "JF Energia",
    phone: "(12) 99664-3100",
    email: "aisla@jfenergiasolar.com",
    website: "",
    city: "São José dos Campos",
    state: "SP"
  },
  {
    name: "Vinimaq Solar",
    phone: "(16) 3713-1800; (16) 3713-1878",
    email: "wemob@vinimaq.com.br",
    website: "http://www.vinimaq.com.br",
    city: "Franca",
    state: "SP"
  },
  {
    name: "KW DO SOL ENERGIA LIMPA LTDA",
    phone: "(12) 3197-0957",
    email: "fale@kwdosol.com.br",
    website: "http://www.kwdosol.com.br",
    city: "São José dos Campos",
    state: "SP"
  },
  {
    name: "MGI Solar LTDA",
    phone: "14 997565494; 14 997565494",
    email: "",
    website: "",
    city: "Taguaí",
    state: "SP"
  },
  {
    name: "SUNO ENGENHARIA LTDA",
    phone: "(31) 3939-2579",
    email: "comercial@sunoengenharia.com",
    website: "http://www.sunoengenharia.com/",
    city: "Conselheiro Lafaiete",
    state: "MG"
  },
  {
    name: "EXPAND ENERGIA LTDA",
    phone: "(34) 3662-3499",
    email: "comercial@expandenergia.com",
    website: "http://expandenergia.com.br/",
    city: "Araxá",
    state: "MG"
  },
  {
    name: "ENGESOL ENERGIA SOLAR E AUTOMAÇÃO LTDA.",
    phone: "(35) 99175-8955; (35) 99811-2562",
    email: "contato@engesolenergiasolar.com.br",
    website: "https://engesolenergiasolar.com.br/",
    city: "Lambari",
    state: "MG"
  },
  {
    name: "FOUR RASTREAMENTO E ENERGIA LTDA",
    phone: "(35) 3295-9779; (35) 3295-2636; (35) 99973-9315",
    email: "flavio@sunfour.com.br",
    website: "http://www.sunfour.com.br/",
    city: "Machado",
    state: "MG"
  },
  {
    name: "ValeEco",
    phone: "(12) 99153-0535",
    email: "",
    website: "http://www.valeeco.com.br",
    city: "Caçapava",
    state: "SP"
  },
  {
    name: "AQUINO`S SOLAR",
    phone: "(24) 99240-9271",
    email: "contato@aquinossolar.com",
    website: "https://aquinossolar.com.br",
    city: "Barra Mansa",
    state: "RJ"
  },
  {
    name: "BORNE ENERGIA",
    phone: "(41) 4101-4454",
    email: "contato@energiaborne.com.br",
    website: "https://energiaborne.com.br",
    city: "Curitiba",
    state: "PR"
  },
  {
    name: "Sun Life Brasil",
    phone: "(24) 3347 5738",
    email: "contato@sunlifebrasil.com",
    website: "http://www.sunlifebrasil.com",
    city: "Volta Redonda",
    state: "RJ"
  },
  {
    name: "Duo Soluções Energéticas Eireli",
    phone: "(19) 99392-4310",
    email: "leonardo@duoenergia.com.br",
    website: "",
    city: "Mococa",
    state: "SP"
  },
  {
    name: "AD Valoren LTDA",
    phone: "(16) 3703-3095; (16) 99117-5708",
    email: "afortioriagronegociosdobrasil@outlook.com",
    website: "https://afortioriagronegociosdobrasil.com/",
    city: "Claraval",
    state: "MG"
  },
  {
    name: "AMASOL ENERGIAS RENOVÁVEIS LTDA",
    phone: "(31) 3162-3633; (31) 99585-1159; (31) 99286-0989",
    email: "giordano@turontecnologia.com.br",
    website: "https://turontecnologia.com.br/",
    city: "Betim",
    state: "MG"
  },
  {
    name: "Engesolver",
    phone: "(13) 9.8154-6698",
    email: "comercial@engesolver.com",
    website: "http://www.engesolver.com.br",
    city: "Santos",
    state: "SP"
  },
  {
    name: "SOLAR WATTS ENERGIA FOTOVOLTAICA LTDA",
    phone: "(35) 3291-7414; (35) 99949-9919",
    email: "atendimento@solarwattsenergia.com.br",
    website: "http://www.solarwattsenergia.com.br",
    city: "Alfenas",
    state: "MG"
  },
  {
    name: "JRL Energia Fotovoltaica LTDA",
    phone: "(32) 98851-7687; (32) 99987-7687",
    email: "solarmigenergia@gmail.com; priscilla.azevedo@solarmig.com.br",
    website: "https://www.solarmig.com.br/",
    city: "São João del Rei",
    state: "MG"
  },
  {
    name: "Hertz Solar Elétrica LTDA",
    phone: "(37) 3331-7555; (37) 99160-1444",
    email: "alessandro@eletrohertz.com",
    website: "http://www.eletrohertz.com",
    city: "Oliveira",
    state: "MG"
  },
  {
    name: "LUZTEC TECNOLOGIA EM ENERGIA LTDA",
    phone: "(35) 3221-2791; (35) 98815-2505",
    email: "guilherme@luzteciluminacao.com.br",
    website: "http://luzteciluminacao.com.br",
    city: "Varginha",
    state: "MG"
  },
  {
    name: "SOS SOLAR",
    phone: "(19) 99388-5056",
    email: "falecom@sossolar.com.br",
    website: "",
    city: "Limeira",
    state: "SP"
  },
  {
    name: "Limersol",
    phone: "(19) 3443-8669",
    email: "vendas@limersol.com.br",
    website: "http://www.limersol.com.br",
    city: "Limeira",
    state: "SP"
  },
  {
    name: "Solig - Energia do Bem",
    phone: "(32) 3939-0590; (32) 3939-0374",
    email: "joaopaulomilagres@gmail.com",
    website: "https://solig.com.br/",
    city: "Barbacena",
    state: "MG"
  },
  {
    name: "CYMAZ TECNOLOGIA LTDA",
    phone: "(19)99684-7393",
    email: "nikolas@cymaz.com.br",
    website: "https://www.cymaz.com.br/",
    city: "Piracicaba",
    state: "SP"
  },
  {
    name: "BRAZIL SOLUTION SERVICOS LTDA",
    phone: "(21) 3678-3597",
    email: "atendimento@brazilsolution.com.br",
    website: "http://www.brazilsolution.com.br",
    city: "São João de Meriti",
    state: "RJ"
  },
  {
    name: "ARASOL ENERGIA FOTOVOLTAICA LTDA",
    phone: "(34) 98887-5093; (34) 99882-0034",
    email: "contato.arasolaraguari@gmail.com",
    website: "https://arasolenergiafotovoltaica.com.br/",
    city: "Araguari",
    state: "MG"
  },
  {
    name: "Campos Energia & Engenharia LTDA",
    phone: "(21) 2143-4303; (21) 4109-8850",
    email: "CONTATO@CAMPOSENERGIA.COM.BR; felipe@camposenergia.com.br",
    website: "http://www.camposenergia.com.br",
    city: "Rio de Janeiro",
    state: "RJ"
  },
  {
    name: "REALTA ELETRICA",
    phone: "(16) 99643-3164; (16) 98830-7123",
    email: "engenharia@eletricarealta.com.br",
    website: "",
    city: "Ribeirão Preto",
    state: "SP"
  },
  {
    name: "ENERPOWER",
    phone: "(24) 99843-3601",
    email: "contato@enerpower.com.br",
    website: "https://enerpower.com.br/site/",
    city: "Volta Redonda",
    state: "RJ"
  },
  {
    name: "INFINITY ENGINEERING",
    phone: "(22) 99909-5008; (22) 99730-9080",
    email: "contato@infinitysolucoes.eng.br",
    website: "https://www.infinitysolucoes.eng.br/",
    city: "Campos dos Goytacazes",
    state: "RJ"
  },
  {
    name: "PRIME SOL SOLUCAO EM ENERGIA LTDA",
    phone: "(22)99041184; (22) 998789394; (22)99041184",
    email: "contato@primesolenergiasolar.com.br",
    website: "https://primesolenergiasolar.com.br/",
    city: "Campos dos Goytacazes",
    state: "RJ"
  },
  {
    name: "CLEAN ENERGIA",
    phone: "(54) 3355-1363; 54 99693-4673",
    email: "comercial@cleanenergia.com.br",
    website: "",
    city: "Ibiraiaras",
    state: "RS"
  },
  {
    name: "Ideal Comércio e Serviços de Coberturas",
    phone: "19 32812587",
    email: "producao@idealcoberturas.com.br",
    website: "",
    city: "Araras",
    state: "SP"
  },
  {
    name: "FST Soluções em Tecnologia",
    phone: "(22) 2721-6502",
    email: "marcelo@fsttecnologia.com.br",
    website: "http://www.fsttecnologia.com.br",
    city: "São João da Barra",
    state: "RJ"
  },
  {
    name: "Eima Materiais Elétricos LTDA",
    phone: "(37) 3237-6355",
    email: "vendas10@eima.com.br",
    website: "http://www.eima.com.br",
    city: "Pará de Minas",
    state: "MG"
  },
  {
    name: "Elétrica Araçatuba - Solar",
    phone: "18 3607-6200",
    email: "engenharia@gienergia.com.br",
    website: "http://www.eletricaaracatuba.com.br",
    city: "Araçatuba",
    state: "SP"
  },
  {
    name: "Eletrica Margreiter Eireli",
    phone: "46 99107-9087",
    email: "ciochetta1@gmail.com",
    website: "",
    city: "Palmas",
    state: "PR"
  },
  {
    name: "Solar Serra",
    phone: "(54) 3705-1950; (54) 99977-5550; (54) 99977-8844",
    email: "contato@solarserra.com.br",
    website: "",
    city: "Bento Gonçalves",
    state: "RS"
  },
  {
    name: "Efall Engenharia Elétrica",
    phone: "(54) 3471-1117; (54)99656-2995",
    email: "comercial@efallengenharia.com.br",
    website: "https://www.efallengenharia.com.br/",
    city: "Dois Lajeados",
    state: "RS"
  },
  {
    name: "Spark Soluções em Engenharia Elétrica LTDA",
    phone: "16 992807656; 16 992807656",
    email: "adm@sparkeng.com.br",
    website: "",
    city: "Pitangueiras",
    state: "SP"
  },
  {
    name: "Topsun Energia Solar",
    phone: "(47) 3055-0800",
    email: "atendimento@topsun.com.br",
    website: "http://www.topsun.com.br",
    city: "Jaraguá do Sul",
    state: "SC"
  },
  {
    name: "SOLTURI SOLAR SERVIÇO E COMÉRCIO DE MATERIAIS ELÉTRICOS LTDA",
    phone: "(47) 9 9250-4607; 47999614606",
    email: "contato@solturi.com.br; bruno@solturi.com.br",
    website: "https://solturi.com.br/",
    city: "Jaraguá do Sul",
    state: "SC"
  },
  {
    name: "IG Energia Renovável",
    phone: "(47) 3273-5552",
    email: "alexandre@igenergia.com.br",
    website: "http://www.igenergia.com.br",
    city: "Jaraguá do Sul",
    state: "SC"
  },
  {
    name: "Da Roz Eletricidade",
    phone: "19 35736900",
    email: "fotovoltaico@darozeletriciade.com.br",
    website: "",
    city: "Leme",
    state: "SP"
  },
  {
    name: "Eletro Service",
    phone: "(14) 3603-1100",
    email: "energiasolar1@eletroserviceourinhos.com.br",
    website: "http://www.eletroserviceourinhos.com.br",
    city: "Ourinhos",
    state: "SP"
  },
  {
    name: "Produtel Comércio de Materiais Elétricos",
    phone: "(45) 3028-9420",
    email: "produtel@hotmail.com",
    website: "http://www.produtel.com.br",
    city: "Foz do Iguaçu",
    state: "PR"
  },
  {
    name: "ELETRIWATTS LTDA",
    phone: "11 982770775",
    email: "fabricio.machado@eletriwatts.com",
    website: "",
    city: "Patrocínio",
    state: "MG"
  },
  {
    name: "Prisma Energia Solar",
    phone: "(47) 99177-2399",
    email: "contato@prismaenergiasolar.com.br; cotacao@prismaenergiasolar.com.br",
    website: "http://www.prismaenergiasolar.com.br",
    city: "Itajaí",
    state: "SC"
  },
  {
    name: "GREEN SOLAR BRASIL",
    phone: "21973132727",
    email: "mribeiro@greensolar.com.br",
    website: "",
    city: "Rio de Janeiro",
    state: "RJ"
  },
  {
    name: "J.N.T INST. ELETRO-ELETRÔNICA LTDA",
    phone: "(31) 3774-4350",
    email: "jnt@jnteletrica.com.br",
    website: "http://www.jntenergiasolar.com.br",
    city: "Sete Lagoas",
    state: "MG"
  },
  {
    name: "COMETA ENERGY LTDA",
    phone: "(19)98161-4075",
    email: "vanildo@cometaenergy.com.br",
    website: "",
    city: "São João da Boa Vista",
    state: "SP"
  },
  {
    name: "S L BIRCK LTDA",
    phone: "(46) 3536-1541",
    email: "",
    website: "https://biel.com.br/",
    city: "Dois Vizinhos",
    state: "PR"
  },
  {
    name: "Innova Energy Serviços de Engenharia LTDA",
    phone: "(34) 3334-0481; (34) 99182-0899; (34) 98439-5454",
    email: "contato@innova-energy.com.br",
    website: "http://www.innova-energy.com.br/",
    city: "Uberaba",
    state: "MG"
  },
  {
    name: "Cardoso Soluções Energéticas",
    phone: "(37) 99191-7587",
    email: "comercial@cardososolucoes.com; contato@cardososolucoes.com",
    website: "https://cardososolucoes.com/",
    city: "Bom Despacho",
    state: "MG"
  },
  {
    name: "Kinsol Serviços de Instalação de Equipamentos de Energia Solar LTDA",
    phone: "0800 343 4800",
    email: "contato@kinsolenergia.com.br",
    website: "http://www.kinsolenergia.com.br/",
    city: "Uberaba",
    state: "MG"
  },
  {
    name: "Hold",
    phone: "17 35233835",
    email: "hold@hold.inf.br",
    website: "http://hold.inf.br/",
    city: "Catanduva",
    state: "SP"
  },
  {
    name: "Contrafo Com. e Constr. Eletromecânica LTDA",
    phone: "(67) 3385-5694",
    email: "contrafo@terra.com.br",
    website: "http://www.contrafobr.com.br",
    city: "Campo Grande",
    state: "MS"
  },
  {
    name: "ELETROBOX COMÉRCIO DE MATERIAIS ELÉTRICOS LTDA",
    phone: "(47) 3642-3038",
    email: "solar@eletrobox.net",
    website: "https://eletrobox.net/",
    city: "Mafra",
    state: "SC"
  },
  {
    name: "DOMUS SOLAR",
    phone: "(47) 3232-2329",
    email: "contato@domussolar.com.br",
    website: "http://www.domussolar.com.br",
    city: "Blumenau",
    state: "SC"
  },
  {
    name: "ROMASOL ENGENHARIA E ENERGIA SOLAR.",
    phone: "(34) 3227-3777; (34) 99778-3777",
    email: "marcosprado@romasolengenharia.com.br",
    website: "https://www.romasolengenharia.com.br",
    city: "Uberlândia",
    state: "MG"
  },
  {
    name: "NAVES ENGENHARIA LTDA - ENERGIZAGRO",
    phone: "(34) 3810-1292; (34) 99728-9640",
    email: "engenharia@energizagro.com.br",
    website: "http://www.energizagro.com/",
    city: "Monte Carmelo",
    state: "MG"
  },
  {
    name: "R4 ENERGIAS RENOVÁVEIS",
    phone: "(47) 3091-0190; (47) 99231-3074",
    email: "comercial@r4renovaveis.com.br",
    website: "http://www.r4renovaveis.com.br",
    city: "Timbó",
    state: "SC"
  },
  {
    name: "Bioserve",
    phone: "(51) 999101717",
    email: "bioserve@bioserve.com.br",
    website: "http://www.bioserve.com.br",
    city: "Rio de Janeiro",
    state: "RJ"
  },
  {
    name: "Insolis Energy",
    phone: "1838231515",
    email: "cleberbortolato@hotmail.com",
    website: "http://www.insolisenergy.com.br/",
    city: "Dracena",
    state: "SP"
  },
  {
    name: "Solar R Energy LTDA",
    phone: "18 99668-9452; 18 99668-9452",
    email: "ricardo@solarrenergy.com.br",
    website: "",
    city: "Dracena",
    state: "SP"
  },
  {
    name: "BRADACZ INDÚSTRIA ELETRÔNICA LTDA",
    phone: "(44) 9 9932-0055",
    email: "",
    website: "http://www.bradacz.com.br/",
    city: "Palotina",
    state: "PR"
  },
  {
    name: "Ceraçá - COOPERATIVA DE INFRA-ESTRUTURA",
    phone: "(49) 3334-3300",
    email: "comercial@ceraca.com.br",
    website: "",
    city: "Saudades",
    state: "SC"
  },
  {
    name: "EKLOS ENGENHARIA LTDA",
    phone: "27998401719",
    email: "thiago@eklosengenharia.com.br",
    website: "",
    city: "Vitória",
    state: "ES"
  },
  {
    name: "SaveOn",
    phone: "(47) 3034-6448; (47) 3034-6448",
    email: "contato@saveonenergia.com.br",
    website: "https://www.saveonenergia.com.br/novas-solucoes/#carregamento-carro",
    city: "Joinville",
    state: "SC"
  },
  {
    name: "Greenvolt Comércio e Serviços Eireli",
    phone: "(31) 3162-6299",
    email: "lucas@greenvolt.com.br",
    website: "https://greenvolt.com.br/",
    city: "Betim",
    state: "MG"
  },
  {
    name: "Ative Engenharia LTDA",
    phone: "2732281947",
    email: "ative@ativeengenharia.com.br",
    website: "",
    city: "Serra",
    state: "ES"
  },
  {
    name: "TRENTO COMERCIAL ELÉTRICA E HIDRÁULICA LTDA",
    phone: "(54) 3292-3700; (54) 99702-5087",
    email: "trento@trentocomercial.com.br; vendas02@trentocomercial.com.br",
    website: "http://www.trentocomercial.com.br",
    city: "Flores da Cunha",
    state: "RS"
  },
  {
    name: "PRIMOSOL LTDA",
    phone: "(45) 9 9806-9826",
    email: "",
    website: "",
    city: "Capanema",
    state: "PR"
  },
  {
    name: "L&M Solar",
    phone: "(16) 3630-6292",
    email: "contato@lmsolar.com.br",
    website: "http://www.lmsolar.com.br",
    city: "Ribeirão Preto",
    state: "SP"
  },
  {
    name: "EASY POWER",
    phone: "(21) 2614-3001",
    email: "contato@easypowergeradores.com",
    website: "https://www.easypowergeradores.com",
    city: "São Gonçalo",
    state: "RJ"
  },
  {
    name: "SOLAR VOLT SOLUÇÕES COMÉRCIO E INSTALAÇÃO PARA ENERGIA LTDA",
    phone: "(31) 4042-3055",
    email: "contato@solarvoltenergia.com.br",
    website: "http://www.solarvoltenergia.com.br",
    city: "Nova Lima",
    state: "MG"
  },
  {
    name: "A. S. JUNIOR ENERGIA SOLAR LTDA",
    phone: "(49) 3621-1128; (49) 9 8403-9405",
    email: "asjunior@asjunior.com.br",
    website: "http://www.asjunior.com.br",
    city: "São Miguel do Oeste",
    state: "SC"
  },
  {
    name: "AGROWERNER - COMÉRCIO DE MÁQUINAS E IMPLEMENTOS AGRÍCOLAS LTDA",
    phone: "(48) 3658-2200; (48) 9 9943-4330",
    email: "solar@agrowerner.com.br",
    website: "https://www.agrowerner.com.br/",
    city: "Braço do Norte",
    state: "SC"
  },
  {
    name: "Alonge Energia Solar LTDA",
    phone: "14 996809329; 14 996809329",
    email: "monitoramento24hpompeia@hotmail.com",
    website: "",
    city: "Pompéia",
    state: "SP"
  },
  {
    name: "Elektsolar Innovations",
    phone: "(48) 3206-2348; (47) 9 9656-9791",
    email: "alceu.neto@elektsolar.com.br",
    website: "https://elekt.com.br/",
    city: "Florianópolis",
    state: "SC"
  },
  {
    name: "FONTESUL SOLUÇÕES EM ENERGIA LTDA",
    phone: "(42) 4141-9333; (42) 4141-8957",
    email: "contato@fontesul.com.br",
    website: "http://www.fontesul.com.br",
    city: "Ponta Grossa",
    state: "PR"
  },
  {
    name: "Ener3 Soluções Inteligentes",
    phone: "(67) 99941-7587",
    email: "engenharia@enersolms.com.br",
    website: "https://www.enersolms.com.br/",
    city: "Três Lagoas",
    state: "MS"
  },
  {
    name: "WIATEC ELETRICIDADE E AUTOMAÇÃO INDUSTRIAL LTDA",
    phone: "(49) 3224-0196; (49) 991436525",
    email: "wiatec@wiatec.com.br; servico@wiatec.com.br; everaldo@wiatec.com.br; projetos@wiatec.com.br",
    website: "http://www.wiatec.com.br",
    city: "Lages",
    state: "SC"
  },
  {
    name: "YELLOT MOB",
    phone: "62 36381006; (62) 98571-3581",
    email: "atendimento@yellotmob.com.br; Pedro@yellot.com.br",
    website: "http://www.yellotmob.com.br",
    city: "Goiânia",
    state: "GO"
  },
  {
    name: "SEEMIL ELETROMECÂNICA LTDA. EPP",
    phone: "(44) 3351-5665; (44) 8838-1556",
    email: "seemil@seemil.com.br",
    website: "http://www.seemil.com.br",
    city: "Cianorte",
    state: "PR"
  },
  {
    name: "SHOP SOLAR DO BRASIL – ENERGIA SOLAR LTDA",
    phone: "(22) 99979-9628; (22) 99979-9620",
    email: "solar@shopsolarbrasil.com.br; anilson@shopsolarbrasil.com.br",
    website: "https://shopsolarbrasil.com.br/",
    city: "Rio das Ostras",
    state: "RJ"
  },
  {
    name: "DGRAWS ARQUITETURA ENGENHARIA E SISTEMA SOLAR",
    phone: "64 98112-8525; 64 99615-2812",
    email: "solar@dgraws.com.br",
    website: "http://www.dgraws.com.br",
    city: "Catalão",
    state: "GO"
  },
  {
    name: "SOLARTE SOLUCOES SUSTENTAVEIS LTDA",
    phone: "21 970133300",
    email: "contato@solartesolucoes.com.br",
    website: "",
    city: "Tanguá",
    state: "RJ"
  },
  {
    name: "F&F ENERGIA LTDA",
    phone: "(31)99952-3003; (31)99702-2802",
    email: "comercial@grupofif.com.br",
    website: "",
    city: "Ipatinga",
    state: "MG"
  },
  {
    name: "MINAS ENERGIA",
    phone: "(31) 3798-2095",
    email: "caio@minasenergia.eng.br",
    website: "http://www.minasenergia.net",
    city: "Ponte Nova",
    state: "MG"
  },
  {
    name: "Emersol Engenharia Eireli",
    phone: "(64) 3431-3777; (64) 99241-8765",
    email: "engenharia@emersol.com.br",
    website: "https://www.emersol.com.br/",
    city: "Itumbiara",
    state: "GO"
  },
  {
    name: "TECNOVOLT MATERIAIS ELÉTRICOS LTDA",
    phone: "(64) 3432-5508; (64) 3432-5502; (64) 98153-0100",
    email: "franciscocarvalho@tecnovolt.com",
    website: "https://tecnovolt.com/",
    city: "Itumbiara",
    state: "GO"
  },
  {
    name: "Premium Engenharia e Automação Eireli Ltda",
    phone: "(51) 3729-6029; (51) 9 9697-8368; (51) 9 8475-8945",
    email: "engenharia@premiumengenharia.com",
    website: "",
    city: "Cruzeiro do Sul",
    state: "RS"
  },
  {
    name: "Construnorte Energia Sustentável",
    phone: "(43) 3571-1354",
    email: "energiasolar@construnorte.com.br",
    website: "",
    city: "Siqueira Campos",
    state: "PR"
  },
  {
    name: "ANDOVER SOLAR",
    phone: "(33) 98760-4718; (33) 98760-4718",
    email: "andoversolar@gmail.com",
    website: "",
    city: "Inhapim",
    state: "MG"
  },
  {
    name: "SONNE SOLUCAO EM ENERGIA",
    phone: "17 35122933; (17) 98182-6230",
    email: "contato@sonneenergia.com; bruno@sonneenergia.com; comercial@sonneenergia.com",
    website: "https://www.sonneenergia.com/",
    city: "Bálsamo",
    state: "SP"
  },
  {
    name: "Sol Tech",
    phone: "(64) 9 9916-3636",
    email: "sol@soltech.net.br",
    website: "https://soltech.net.br/",
    city: "São Luís de Montes Belos",
    state: "GO"
  },
  {
    name: "BRAYNER SOLAR",
    phone: "21964011000",
    email: "celio.lopes@braynersolar.com.br",
    website: "",
    city: "Saquarema",
    state: "RJ"
  },
  {
    name: "Farol Solar",
    phone: "(43) 99920-5589",
    email: "farolsolaradm@gmail.com",
    website: "http://www.farolsolareng.com/es",
    city: "Arapoti",
    state: "PR"
  },
  {
    name: "ELMEC-ITA Eletro Mecânica de Itaperuna Ltda. EPP",
    phone: "(22) 3824-3548; (22) 99986-8332",
    email: "solar@grupoelmec.com.br",
    website: "http://www.grupoelmec.com.br",
    city: "Itaperuna",
    state: "RJ"
  },
  {
    name: "Eletroeste Solar Energy",
    phone: "64 99315-0892",
    email: "genaldooeste@yahoo.com.br",
    website: "",
    city: "Caldas Novas",
    state: "GO"
  },
  {
    name: "MS Engenharia Elétrica",
    phone: "44 3055-4514",
    email: "ms@msengenharia.com.br",
    website: "http://www.msengenharia.com.br",
    city: "Umuarama",
    state: "PR"
  },
  {
    name: "Goiás Energy",
    phone: "(64) 9 9658-2001; (64) 9 9954-4293; (64) 9 9954-8670",
    email: "dircomercial@goiasenergy.com.br",
    website: "https://goiasenergy.com.br/",
    city: "Mineiros",
    state: "GO"
  },
  {
    name: "TNR Solar",
    phone: "(41) 99182-0870",
    email: "nilson@tnrsolar.com.br",
    website: "https://www.tnrsolar.com.br",
    city: "Curitiba",
    state: "PR"
  },
  {
    name: "FIO DE LUZ ENERGIA SOLAR LTDA",
    phone: "(41) 9 9153-7691; (41) 9 9243-3040",
    email: "marcel@fiodeluz.solar",
    website: "http://www.fiodeluz.solar",
    city: "Curitiba",
    state: "PR"
  },
  {
    name: "Solar Soluções em Energia Limpa LTDA",
    phone: "(38) 3721-4218; (38) 3721-5181; (38) 99909-4218",
    email: "contato@solarenergia.ind.br",
    website: "http://www.solarenergia.ind.br",
    city: "Curvelo",
    state: "MG"
  },
  {
    name: "LUMINI ENGENHARIA",
    phone: "3488650126",
    email: "luminieng.01@gmail.com",
    website: "",
    city: "Campo Florido",
    state: "MG"
  },
  {
    name: "Mega Tecnologia",
    phone: "67 3441 4008; 67 98111-1777; (67) 99830-4008",
    email: "matheus@megatecnologia.net.br",
    website: "http://www.megatecnologia.net.br",
    city: "Nova Andradina",
    state: "MS"
  },
  {
    name: "ASE AUTOMAÇÃO E SERVIÇOS ELÉTRICOS EIRELI",
    phone: "(38) 3408-8751; (38) 99990-8751",
    email: "contato@aseengenharia.com.br; cassio.duarte@aseengenharia.com.br",
    website: "http://www.asesolar.com.br; http://www.aseengenharia.com.br/",
    city: "Paracatu",
    state: "MG"
  },
  {
    name: "FORTFRIO ENERGIA E REFRIGERAÇÃO INDUSTRIAL E COMERCIAL LTDA",
    phone: "(31) 3592-7542; (35) 9 9158-6849",
    email: "",
    website: "https://fortfrio.com/",
    city: "Betim",
    state: "MG"
  },
  {
    name: "ALC Solar",
    phone: "(41) 3797-0304",
    email: "andre@alcsolar.com.br",
    website: "https://www.alcsolar.com.br/",
    city: "Fazenda Rio Grande",
    state: "PR"
  },
  {
    name: "Solar Iluminix",
    phone: "(41) 98472-7082",
    email: "jackson@solariluminix.com.br",
    website: "https://solariluminix.com.br/",
    city: "Campo Largo",
    state: "PR"
  },
  {
    name: "TITAN ENERGIA SOLAR",
    phone: "(27)99929-3376; (27)99929-3376",
    email: "titanenergiasolar@gmail.com",
    website: "",
    city: "Santa Maria de Jetibá",
    state: "ES"
  },
  {
    name: "Palolux",
    phone: "44 3649-6999",
    email: "contato@palolux.com.br",
    website: "http://www.palolux.com.br",
    city: "Palotina",
    state: "PR"
  },
  {
    name: "MIDRA DISTRIBUIDORA LTDA",
    phone: "14 3433-4826; 14 99781-4441",
    email: "gerencial@midradistribuidora.com.br",
    website: "",
    city: "Marília",
    state: "SP"
  },
  {
    name: "INSOL ENERGIA, SOLUÇÕES EM ENGENHARIA E ENERGIA EIRELI",
    phone: "(31) 3191-1880; (31) 98743-2419",
    email: "gustavo@insolenergia.com.br",
    website: "https://insolenergia.com.br/",
    city: "Belo Horizonte",
    state: "MG"
  },
  {
    name: "imPRO Energia",
    phone: "(27) 3534-5211",
    email: "adm@improgroup.com.br",
    website: "https://improenergia.com.br/",
    city: "Vitória",
    state: "ES"
  },
  {
    name: "ABP ENGENHARIA E SOLUCOES EM ENERGIA LTDA",
    phone: "12 98117 9772",
    email: "gustavo.pazzine@abpsolar.com.br",
    website: "",
    city: "Taubaté",
    state: "SP"
  },
  {
    name: "VETORIAL ENGENHARIA",
    phone: "(31) 3892-7882; (31) 99967-1290",
    email: "vetorial@vetorial.eng.br",
    website: "http://www.vetorial.eng.br",
    city: "Viçosa",
    state: "MG"
  },
  {
    name: "Lithum Energia Solar",
    phone: "47 3034-6517",
    email: "comercial@lithumsolar.com.br",
    website: "http://www.lithumsolar.com.br",
    city: "Joinville",
    state: "SC"
  },
  {
    name: "MKS",
    phone: "(27) 99274-9411",
    email: "",
    website: "http://www.mkssolar.com.br",
    city: "Vitória",
    state: "ES"
  },
  {
    name: "COOPERATIVA A1",
    phone: "(49) 3647-9000; (49) 3647-9036",
    email: "luciano@fecoagro.coop.br",
    website: "https://www.coopera1.com.br/",
    city: "Palmitos",
    state: "SC"
  },
  {
    name: "Eletrorede",
    phone: "(18) 3355-9200",
    email: "solar@eletrorede.com.br",
    website: "https://www.eletrorede.com.br",
    city: "Presidente Prudente",
    state: "SP"
  },
  {
    name: "Techplace Energia",
    phone: "(17) 3324-4409",
    email: "eng.emanoelabreu@gmail.com",
    website: "",
    city: "Barretos",
    state: "SP"
  },
  {
    name: "EGEPRO",
    phone: "(54) 3534-7775",
    email: "egepro@egepro.com.br",
    website: "https://egepro.com.br/",
    city: "Caxias do Sul",
    state: "RS"
  },
  {
    name: "Cavalli Distribuidora Ltda",
    phone: "45 999708883",
    email: "engenharia@grupocavalli.com.br",
    website: "",
    city: "Medianeira",
    state: "PR"
  },
  {
    name: "Ever Energia",
    phone: "(48) 99143-3780",
    email: "comercial@eversolar.com.br",
    website: "https://everenergia.com.br/",
    city: "Florianópolis",
    state: "SC"
  },
  {
    name: "Novabrico Indústria e Comércio de Energia",
    phone: "19 34423705",
    email: "contato@novabrico.com.br",
    website: "",
    city: "Limeira",
    state: "SP"
  },
  {
    name: "Macke & Cia LTDA",
    phone: "(51) 99685-4179; (51) 3547-1384",
    email: "mackefilial@tca.com.br",
    website: "",
    city: "Rolante",
    state: "RS"
  },
  {
    name: "Feluma Materiais Elétricos LTDA ME",
    phone: "(49) 3634-1849",
    email: "felumaeletrica@yahoo.com.br",
    website: "http://www.feluma.net.br",
    city: "Iporã do Oeste",
    state: "SC"
  },
  {
    name: "Instaladora Lenz",
    phone: "45 3559-2127",
    email: "t.l.lenzsolucoesemenergiasolar@outlook.com",
    website: "",
    city: "Itaipulândia",
    state: "PR"
  },
  {
    name: "ENZARE SOLUÇÕES EM ENERGIA LTDA",
    phone: "(54) 3698-9849; 54 996091287",
    email: "enzare@enzare.com.br",
    website: "https://enzare.com.br/",
    city: "Carlos Barbosa",
    state: "RS"
  },
  {
    name: "MW AUTOMACAO E EFICIENCIA ENERGETICA LTDA",
    phone: "67-992696005",
    email: "mwautomacao.ms@gmail.com",
    website: "",
    city: "Ribas do Rio Pardo",
    state: "MS"
  },
  {
    name: "BLUE ENERGIA SOLAR",
    phone: "(34) 2589-5843",
    email: "edimilson@blueenergiasolar.com; contato@blueenergiasolar.com",
    website: "https://blueenergiasolar.com/",
    city: "Uberlândia",
    state: "MG"
  },
  {
    name: "Da Cas Soluções Elétricas",
    phone: "51 989181592",
    email: "dacassolucoeseletricas@gmail.com",
    website: "",
    city: "Arvorezinha",
    state: "RS"
  },
  {
    name: "COCAMAR COOPERATIVA AGROINDUSTRIAL",
    phone: "(44) 9 9919-4356",
    email: "luis.gomes@cocamar.com.br",
    website: "https://www.cocamar.com.br/",
    city: "Maringá",
    state: "PR"
  },
  {
    name: "QSI Engenharia Elétrica LTDA",
    phone: "(51) 3066-0070; (54) 3461-1122; (51) 3066-0070",
    email: "contato@qsi.eng.br",
    website: "http://www.qsi.eng.br",
    city: "Novo Hamburgo",
    state: "RS"
  },
  {
    name: "GALVAN SOLUÇÕES EM ENERGIA",
    phone: "(47) 3017-9575; (47) 99644-9241; 47 9 9644 9241",
    email: "contato@galvanenergia.com.br",
    website: "",
    city: "Jaraguá do Sul",
    state: "SC"
  },
  {
    name: "GCM ENERGIA SOLAR",
    phone: "3336410808; 33998200808",
    email: "compras@gcmenergiasolar.com.br",
    website: "",
    city: "Teófilo Otoni",
    state: "MG"
  },
  {
    name: "DH Solar - Energia Solar Fotovoltaica",
    phone: "(34) 99137-1776; (34) 99692-0447",
    email: "contato@aeqenergiasolar.com.br",
    website: "http://www.aeqenergiasolar.com.br/",
    city: "Iturama",
    state: "MG"
  },
  {
    name: "Digitalli Eletrônica e Automação",
    phone: "(54) 3512-1522",
    email: "",
    website: "",
    city: "Vacaria",
    state: "RS"
  },
  {
    name: "Enerdata Energia Solar",
    phone: "(47) 99954-9895",
    email: "",
    website: "https://www.enerdata.com.br/",
    city: "Navegantes",
    state: "SC"
  },
  {
    name: "The Energy Solar",
    phone: "(47) 99943-8500",
    email: "contato@theenergy.com.br",
    website: "https://theenergy.com.br/",
    city: "Itapoá",
    state: "SC"
  },
  {
    name: "MEURER SOLUCOES ELETRICAS",
    phone: "(55) 3433-2264; (55) 997208441; (55) 999476010; (55) 99972-2389",
    email: "elmeurer@eletricameurer.net",
    website: "http://www.eletricameurer.net",
    city: "Itaqui",
    state: "RS"
  },
  {
    name: "STROM Energia",
    phone: "(45) 2036-2509",
    email: "contato@stromenergia.com.br",
    website: "http://www.stromenergia.com.br/",
    city: "Toledo",
    state: "PR"
  },
  {
    name: "ELETRO JO MATERIAIS ELÉTRICOS LTDA.",
    phone: "(48) 3658-3202",
    email: "eletrojo@eletrojo.com.br",
    website: "http://www.eletrojo.com.br",
    city: "Braço do Norte",
    state: "SC"
  },
  {
    name: "Enges Energia Solar",
    phone: "(47) 99206-9014",
    email: "adm@enges.eco.br",
    website: "http://www.enges.eco.br",
    city: "Porto Belo",
    state: "SC"
  },
  {
    name: "MAXIM ENGENHARIA LTDA",
    phone: "(43) 3336-7359; (43) 99153-8388",
    email: "contato@maximee.com.br",
    website: "http://www.maximengenharia.com.br",
    city: "Sertanópolis",
    state: "PR"
  },
  {
    name: "SOLEVO ENERGIA",
    phone: "(48) 99800-3031",
    email: "atendimento@solevo.com.br",
    website: "https://solevo.com.br/",
    city: "Lages",
    state: "SC"
  },
  {
    name: "CAMPO SOLAR",
    phone: "(65) 3325-1262",
    email: "vendas@camposolar.eco.br",
    website: "http://www.camposolar.eco.br",
    city: "Tangará da Serra",
    state: "MT"
  },
  {
    name: "GDUE ENERGIA SOLAR",
    phone: "(49) 3535 1124",
    email: "giliard@gdue.com.br",
    website: "",
    city: "Arroio Trinta",
    state: "SC"
  },
  {
    name: "MM2 COMERCIO DE EQUIPAMENTOS INDUSTRIAIS LTDA",
    phone: "(45) 2031-0222; (45) 99113-3223; (45) 99841-9733",
    email: "contato@grupomm2.com.br; comercial01@grupomm2.com.br",
    website: "http://www.grupomm2.com.br",
    city: "Marechal Cândido Rondon",
    state: "PR"
  },
  {
    name: "RS SERVIÇOS ELETRICOS",
    phone: "35988363980",
    email: "solar@rsservicoseletricos.com.br",
    website: "",
    city: "Lavras",
    state: "MG"
  },
  {
    name: "RA DOS SANTOS SERVICOS ELETRICOS",
    phone: "35988363980",
    email: "solar@rsservicoseletricos.com.br",
    website: "",
    city: "Lavras",
    state: "MG"
  },
  {
    name: "MAGNANI LUZ & ENERGIA",
    phone: "(54) 4009-5255; (54) 9 9170-3834; (54) 9 9118 9574",
    email: "mobilidade.eletrica@magnani.com.br",
    website: "http://www.magnani.com.br",
    city: "Caxias do Sul",
    state: "RS"
  },
  {
    name: "Volten",
    phone: "19 981313143",
    email: "volten@volten.com.br",
    website: "",
    city: "Rio Claro",
    state: "SP"
  },
  {
    name: "Solled Energia",
    phone: "(51) 3909-7279; (51) 9 9839-2260; (51) 99987-4720",
    email: "comercial@solledenergia.com.br",
    website: "http://www.solledenergia.com.br/",
    city: "Xangri-lá",
    state: "RS"
  },
  {
    name: "Cipriani Energia Solar",
    phone: "(48) 3380-1293; (48) 99658-2039",
    email: "contato@ciprianieng.com.br",
    website: "http://www.ciprianieng.com.br",
    city: "São João Batista",
    state: "SC"
  },
  {
    name: "EFALL Materiais Elétricos",
    phone: "(54) 3055-7650; (54) 99339-6026",
    email: "efallmateriais@efall.net",
    website: "https://efallengenharia.com.br/",
    city: "Bento Gonçalves",
    state: "RS"
  },
  {
    name: "Ghellere Automação",
    phone: "48 99688-6262",
    email: "ghellereautomacao@gmail.com",
    website: "",
    city: "Criciúma",
    state: "SC"
  },
  {
    name: "Virasolar",
    phone: "(17) 99121-1072",
    email: "virasolarweg@gmail.com",
    website: "",
    city: "Pitangueiras",
    state: "SP"
  },
  {
    name: "Duna Solar",
    phone: "(43) 3048-1230",
    email: "",
    website: "https://www.dunasolar.com.br",
    city: "Apucarana",
    state: "PR"
  },
  {
    name: "EFM Blue Energy",
    phone: "(48) 3307-1242",
    email: "eraclito@efmblueenergy.com.br",
    website: "http://www.efmblueenergy.com.br",
    city: "Florianópolis",
    state: "SC"
  },
  {
    name: "ME Energia Solar",
    phone: "0800 2993301; (27) 99721-8703",
    email: "contato@meenergia.com.br",
    website: "https://www.meenergia.com.br",
    city: "Linhares",
    state: "ES"
  },
  {
    name: "Solare Varasquim",
    phone: "(13) 3854-2301",
    email: "solare@varasquim.com.br",
    website: "http://www.varasquim.com.br",
    city: "Cajati",
    state: "SP"
  },
  {
    name: "Energia Engenharia",
    phone: "(67) 3422-1626",
    email: "energiaengenharia@uol.com.br",
    website: "",
    city: "Dourados",
    state: "MS"
  },
  {
    name: "Virasolar",
    phone: "(17) 99201-0186",
    email: "wegvirasolar@gmail.com",
    website: "",
    city: "Viradouro",
    state: "SP"
  },
  {
    name: "Win Energia e Soluções LTDA",
    phone: "(51) 99560-6560",
    email: "diogo@winenergia.com.br",
    website: "http://www.winenergia.com.br",
    city: "Porto Alegre",
    state: "RS"
  },
  {
    name: "VOLTAIC",
    phone: "49 999 971 218",
    email: "engenharia@voltaicbrasil.com.br",
    website: "http://www.voltaicbrasil.com.br",
    city: "Xanxerê",
    state: "SC"
  },
  {
    name: "MTEC Energia",
    phone: "(61) 3465-3366",
    email: "comercial@mtec.eng.br; contato@mtec.eng.br; daniel@mtec.eng.br; josecarlos@mtec.eng.br",
    website: "http://www.mtecenergia.com.br",
    city: "Brasília",
    state: "DF"
  },
  {
    name: "W.L Solar",
    phone: "(61) 982094500",
    email: "comercial@wlsolar.com.br",
    website: "http://www.wlsolar.com.br",
    city: "Brasília",
    state: "DF"
  },
  {
    name: "GCP SOLAR",
    phone: "(38) 3672-3108; (38) 3671-8537; (38) 99996-1553",
    email: "fabio.pereira@jmfengenharia.com.br",
    website: "https://www.gcpsolar.com.br/",
    city: "Paracatu",
    state: "MG"
  },
  {
    name: "ROMIL ENERGY GERAÇÃO DE ENERGIA LTDA",
    phone: "(47) 3533-3449; (47) 98803-1036",
    email: "romil@romilsolar.com",
    website: "http://www.romilsolar.com/",
    city: "Ituporanga",
    state: "SC"
  },
  {
    name: "Indusol",
    phone: "(48) 3413-5256",
    email: "contato@indusol.com.br",
    website: "http://www.indusol.com.br",
    city: "Criciúma",
    state: "SC"
  },
  {
    name: "Irmãos Marcon",
    phone: "46 3524-1188",
    email: "irmaosmarcon@gmail.com",
    website: "",
    city: "Francisco Beltrão",
    state: "PR"
  },
  {
    name: "ME Energia Solar",
    phone: "0800 2993301; (27) 99721-8703",
    email: "contato@meenergia.com.br",
    website: "https://www.meenergia.com.br",
    city: "São Mateus",
    state: "ES"
  },
  {
    name: "ENERTELLES ENERGIA SOLAR",
    phone: "(17) 31510256; (17) 99718-7407",
    email: "enertelles@gmail.com",
    website: "",
    city: "Catanduva",
    state: "SP"
  },
  {
    name: "SOLLED ENERGIA",
    phone: "(51) 3909-7279; (51) 9 9839-2260; (51) 99987-4720",
    email: "comercial@solledenergia.com.br",
    website: "https://solledenergia.com.br/",
    city: "Santa Cruz do Sul",
    state: "RS"
  },
  {
    name: "Solen Energias Renovaveis",
    phone: "(49) 3025-6666; (49) 99809-7938",
    email: "contato@solen.bio.br; faedo@solen.bio.br",
    website: "https://www.solen.bio.br/",
    city: "Chapecó",
    state: "SC"
  },
  {
    name: "Ecossistema (SMS)",
    phone: "44 3305-4956",
    email: "contato@ecosistema.com.br",
    website: "http://www.ecosistema.ind.br",
    city: "Maringá",
    state: "PR"
  },
  {
    name: "COOPERATIVA REGIONAL ITAIPU",
    phone: "(49 )3366-1353; (49) 3366-6500",
    email: "financeirofl56@cooperitaipu.com.br",
    website: "https://cooperitaipu.com.br/",
    city: "Pinhalzinho",
    state: "SC"
  },
  {
    name: "Eletromática",
    phone: "(64)3474-1564",
    email: "eletromaticaorizona@hotmail.com",
    website: "http://www.eletromatica.com.br",
    city: "Orizona",
    state: "GO"
  },
  {
    name: "Iguaçu Engenharia",
    phone: "(46) 99970-7425",
    email: "patobranco@engenhariaiguacu.com.br",
    website: "http://www.engenhariaiguacu.com.br",
    city: "Pato Branco",
    state: "PR"
  },
  {
    name: "Gerasolar",
    phone: "(65) 99261-2002",
    email: "gerasolarsolucoesrenovaveis@gmail.com",
    website: "",
    city: "Lucas do Rio Verde",
    state: "MT"
  },
  {
    name: "LUZON ECOEFICIENCIA LTDA",
    phone: "(46) 2563-1167; (46) 99982-4430",
    email: "relacionamento@luzon.eco.br",
    website: "http://luzon.eco.br",
    city: "Santo Antônio do Sudoeste",
    state: "PR"
  },
  {
    name: "AUTOMASUL",
    phone: "(54) 3316-2600; (54) 2103-0800; (54) 2103-0802",
    email: "automasul@automasul.com",
    website: "http://www.automasul.com",
    city: "Passo Fundo",
    state: "RS"
  },
  {
    name: "PONTAL SOLAR ENERGIAS RENOVÁVEIS LTDA",
    phone: "(34) 99897-8313; (34) 3261-3777; (34) 99667-3777",
    email: "junior@pontalsolar.com",
    website: "",
    city: "Ituiutaba",
    state: "MG"
  },
  {
    name: "ASTRAL NOVA ELETRÔNICA LTDA",
    phone: "(32) 4141-1111; (32) 98812-5551",
    email: "engenharia@anetjf.com.br",
    website: "https://www.anetjf.com.br/",
    city: "Juiz de Fora",
    state: "MG"
  },
  {
    name: "KRH Solar",
    phone: "(45) 3257-1672",
    email: "",
    website: "http://grupokrh.com.br",
    city: "Entre Rios do Oeste",
    state: "PR"
  },
  {
    name: "MX ENERGIA SOLAR COMERCIAL LTDA",
    phone: "73 99909-0547",
    email: "atendimento@mxenergiasolar.com.br",
    website: "",
    city: "Teixeira de Freitas",
    state: "BA"
  },
  {
    name: "Rossler Comércio e Serviços de Energia",
    phone: "(54) 2628-4053; (54) 99614-0932",
    email: "contato@rosslerautomacao.com.br; daiane@rosslerenergiasolar.com.br",
    website: "http://rosslerautomacao.com.br",
    city: "Farroupilha",
    state: "RS"
  },
  {
    name: "Berti Instaladora Elétrica",
    phone: "(51) 3545-1840",
    email: "comercial@berti.net.br",
    website: "",
    city: "Igrejinha",
    state: "RS"
  },
  {
    name: "C G Solar",
    phone: "66 99601-7352",
    email: "glaubergiordani@hotmail.com",
    website: "",
    city: "Tapurah",
    state: "MT"
  },
  {
    name: "Giga Hertz Automação Elétrica LTDA - ME",
    phone: "(38) 3676-9100",
    email: "contato@gigahertzautomacao.com.br",
    website: "http://www.gigahertzautomacao.com.br",
    city: "Unaí",
    state: "MG"
  },
  {
    name: "SUNGATE ENERGIA SOLAR",
    phone: "(51) 98623-4607",
    email: "",
    website: "https://www.sungate.com.br/",
    city: "Parobé",
    state: "RS"
  },
  {
    name: "ILUMISAM ENERGIA SOLAR LTDA",
    phone: "(47) 3207-8516; (47) 9 8436-8950",
    email: "financeiro01@ilumisam.com.br",
    website: "http://www.ilumisam.com.br/",
    city: "Guaramirim",
    state: "SC"
  },
  {
    name: "ARMS SERVICOS E CONSTRUCOES",
    phone: "(27)99928-2223",
    email: "",
    website: "",
    city: "Linhares",
    state: "ES"
  },
  {
    name: "MARFE - COMÉRCIO DE MATERIAIS ELÉTRICOS E ILUMINAÇÃO EIRELI - EPP",
    phone: "(37) 3244-1523; (37) 3244-3840; (31) 99940-1602",
    email: "marfeeletrica.compras@gmail.com",
    website: "http://www.lojasmarfe.com.br",
    city: "Carmo do Cajuru",
    state: "MG"
  },
  {
    name: "Ilumisolar Eficiencia Energetica",
    phone: "(48) 3420-0999",
    email: "contato@ilumisolar.com.br",
    website: "https://www.ilumisolar.com.br/",
    city: "Criciúma",
    state: "SC"
  },
  {
    name: "Ultra Solar",
    phone: "3083-7738",
    email: "contato@energiaultrasolar.com.br",
    website: "http://www.energiaultrasolar.com.br",
    city: "Brasília",
    state: "DF"
  },
  {
    name: "SmartSun Solar",
    phone: "(83) 4009-9010; (83) 4009-9010",
    email: "contato@smartsun.solar",
    website: "http://smartsun.solar/",
    city: "João Pessoa",
    state: "PB"
  },
  {
    name: "TS Energy",
    phone: "(51) 3039-8306; (51) 99127-3588",
    email: "Ronei@tscom.com.br; ronei@tsenergy.com.br",
    website: "http://www.tsenergy.com.br",
    city: "Sapiranga",
    state: "RS"
  },
  {
    name: "AURORA SOLUÇÕES EM ENERGIA SOLAR LTDA",
    phone: "(47) 3322-7647; (47) 9 9959-4757",
    email: "aurorasolar.net@gmail.com",
    website: "http://www.aurorasolar.net/",
    city: "Blumenau",
    state: "SC"
  },
  {
    name: "Ecológica Solar",
    phone: "(62) 3087-7714",
    email: "contato@ecologicaclima.com.br",
    website: "http://ecologicaclima.com.br",
    city: "Goiânia",
    state: "GO"
  },
  {
    name: "Spin Solar",
    phone: "(48) 3263-0182",
    email: "kalebe@spinsolar.com.br",
    website: "https://www.spinsolar.com.br",
    city: "Tijucas",
    state: "SC"
  },
  {
    name: "Pronto Solar Ltda",
    phone: "16 997506268; 16 993239699",
    email: "contato@prontosolar.com.br",
    website: "",
    city: "Matão",
    state: "SP"
  },
  {
    name: "Energens",
    phone: "(55) 3314-0038",
    email: "",
    website: "http://www.energens.com.br",
    city: "Santo Ângelo",
    state: "RS"
  },
  {
    name: "MARATEC Automação Industrial",
    phone: "(67) 3295-1845; (67) 99962-2862; (67) 99891-7181",
    email: "marcio@maratec.com.br; vendas@maratec.com.br",
    website: "",
    city: "São Gabriel do Oeste",
    state: "MS"
  },
  {
    name: "DZ Materiais Elétricos",
    phone: "(45) 3220-9400",
    email: "ronaldo@eletricadz.com.br",
    website: "http://eletricadz.com.br",
    city: "Cascavel",
    state: "PR"
  },
  {
    name: "Decorfios Eletrotécnica Ltda.",
    phone: "(65) 3308-3271",
    email: "alexandre@decorfios.com.br",
    website: "http://www.decorfios.com.br",
    city: "Nova Mutum",
    state: "MT"
  },
  {
    name: "Parceria Solar",
    phone: "(55) 3027-9999",
    email: "comercial@parceriasolar.com",
    website: "https://www.parceriasolar.com",
    city: "Santa Maria",
    state: "RS"
  },
  {
    name: "ELEVE SOLAR",
    phone: "(27) 99730-5384",
    email: "eleveenergiasolar@gmail.com",
    website: "https://www.eleveenergiasolar.com.br",
    city: "Vila Velha",
    state: "ES"
  },
  {
    name: "Suisun Energia Limpa",
    phone: "(63) 3323-6238; (63) 9 9209-3038",
    email: "suisun@suisun.com.br",
    website: "http://www.suisun.com.br",
    city: "Palmas",
    state: "TO"
  },
  {
    name: "SOLARTEC MATERIAIS ELETRICOS LTDA",
    phone: "49 3224 0196",
    email: "everaldo@wiatec.com.br",
    website: "",
    city: "Rio do Sul",
    state: "SC"
  },
  {
    name: "Enerzee",
    phone: "(65) 3634-7877; (11) 4003-8344",
    email: "contato@enerzee.com.br; comercial@enerzee.com.br; posvendas@enerzee.com.br",
    website: "http://www.enerzee.com.br",
    city: "Cuiabá",
    state: "MT"
  },
  {
    name: "Aliança Energia Solar",
    phone: "(66) 3531-2218",
    email: "financeiro@aliancaconstrucoes.com.br",
    website: "http://www.aliancaconstrucoes.com.br",
    city: "Sinop",
    state: "MT"
  },
  {
    name: "Volts Service Energia Solar",
    phone: "(66) 98474-1300",
    email: "volts.financeiro@gmail.com",
    website: "https://www.voltsservice.com.br/",
    city: "Sinop",
    state: "MT"
  },
  {
    name: "TRIVELATO INDUSTRIA DE GERADORES LTDA ME",
    phone: "(34) 3213-6464; (34) 99135-0559",
    email: "comercial@trivellatoenergiarenovavel.com.br",
    website: "http://www.trivellatoenergiarenovavel.com.br",
    city: "Uberlândia",
    state: "MG"
  },
  {
    name: "SOLAR haus",
    phone: "(51) 3582-0050",
    email: "",
    website: "http://www.solarhaus.com.br",
    city: "Novo Hamburgo",
    state: "RS"
  },
  {
    name: "CLAIRTON GADONSKI ME",
    phone: "(51) 3572-0272; (51) 3057-2088; (51) 9 9205-2734",
    email: "clairton@mixenergia.com.br",
    website: "https://mixenergia.com.br/",
    city: "Portão",
    state: "RS"
  },
  {
    name: "DELSOL ENGENHARIA",
    phone: "(51) 99395-0202; (51) 99281-5686",
    email: "contato@delsolengenharia.com.br",
    website: "https://www.delsolengenharia.com.br/",
    city: "Esteio",
    state: "RS"
  },
  {
    name: "RELIANTO PROJETOS E MONTAGENS ELETRICAS",
    phone: "(51) 99817-0426",
    email: "contato@relianto.com.br",
    website: "http://www.relianto.com.br",
    city: "Porto Alegre",
    state: "RS"
  },
  {
    name: "Happy Solar",
    phone: "87991646718",
    email: "atendimentohappysolar@gmail.com",
    website: "http://happysolar.com.br",
    city: "Petrolina",
    state: "PE"
  },
  {
    name: "GLOBAL AUTOMACAO LTDA",
    phone: "49 3561 0000",
    email: "globalautomacao@globalautomacao.ind.br",
    website: "http://www.globalautomacao.ind.br",
    city: "Caçador",
    state: "SC"
  },
  {
    name: "Solarchio",
    phone: "(77) 3422-4616",
    email: "",
    website: "http://www.solarchio.com.br",
    city: "Vitória da Conquista",
    state: "BA"
  },
  {
    name: "J2R Energia Solar",
    phone: "(66) 3022-4088; (66) 99204-0094",
    email: "contatos@j2renergia.com.br; j2renergia@gmail.com",
    website: "http://www.j2renergia.com.br",
    city: "Rondonópolis",
    state: "MT"
  },
  {
    name: "Unisolar",
    phone: "(17) 3641-1045",
    email: "unisolar@unisolarenergias.com.br",
    website: "http://www.unisolarenergias.com.br",
    city: "Santa Fé do Sul",
    state: "SP"
  },
  {
    name: "See Energia",
    phone: "(61) 98364-8441",
    email: "contato@see-energia.com",
    website: "http://www.see-energia.com",
    city: "Brasília",
    state: "DF"
  },
  {
    name: "Energisul Manutenção Industrial",
    phone: "(51) 3741-6748",
    email: "contato@energisul-si.com.br",
    website: "http://www.energisul-si.com.br",
    city: "Venâncio Aires",
    state: "RS"
  },
  {
    name: "TRIELO ENERGIA SOLAR LTDA",
    phone: "(44)98454-1440",
    email: "contato@trieloci.com.br",
    website: "https://www.trieloenergiasolar.com.br/",
    city: "Campo Mourão",
    state: "PR"
  },
  {
    name: "Nortão Energia Solar",
    phone: "(66) 99209-3001",
    email: "nortaoenergiasolar@gmail.com",
    website: "https://nortaoenergiasolar.com.br/",
    city: "Alta Floresta",
    state: "MT"
  },
  {
    name: "Quasat Solar",
    phone: "(55) 99707-4844; (55) 3512-3600; (55) 3024-0708",
    email: "",
    website: "https://www.quasat.com.br/",
    city: "Santa Rosa",
    state: "RS"
  },
  {
    name: "DIN ENERGIA",
    phone: "94 99199-2568; 94 99177-7365",
    email: "megasolenergiapa@gmail.com",
    website: "",
    city: "Xinguara",
    state: "PA"
  },
  {
    name: "SOLTURI ENERGIA SOLAR",
    phone: "",
    email: "pre.vendas01@solturi.com.br",
    website: "https://solturi.com.br/",
    city: "Sorriso",
    state: "MT"
  },
  {
    name: "ALTA ENERGIA E CONSTRUÇÃO LTDA",
    phone: "(55) 3411-2395; (55) 9 9641-6134",
    email: "alvaro@alta.eng.br",
    website: "http://alta.eng.br/",
    city: "Uruguaiana",
    state: "RS"
  },
  {
    name: "M P SOLAR COMERCIAL LTDA",
    phone: "(33) 3321-3855; (33) 3322-1371",
    email: "manoelpereiracosta@hotmail.com",
    website: "http://www.mpsolar.com.br/",
    city: "Caratinga",
    state: "MG"
  },
  {
    name: "IMPERIAL ELÉTRICA SOLAR",
    phone: "(88) 99623-6105",
    email: "imperial.eletrica@hotmail.com",
    website: "",
    city: "Barbalha",
    state: "CE"
  },
  {
    name: "MATRIX",
    phone: "(94) 99132-6538; (94) 3322-1251",
    email: "junio.matrix@gmail.com",
    website: "https://www.instagram.com/_matrix.informatica",
    city: "Marabá",
    state: "PA"
  },
  {
    name: "Itamaraju Elétrica",
    phone: "(73) 3294-3138",
    email: "atendimento@ainstaladora.net",
    website: "http://www.ainstaladora.net",
    city: "Itamaraju",
    state: "BA"
  },
  {
    name: "Solucionar Engenharia LTDA",
    phone: "(33) 3634-0470; (33) 98804-2750; (33) 99922-9600",
    email: "contato@solucionareng.com.br",
    website: "http://www.solucionareng.com.br",
    city: "Sardoá",
    state: "MG"
  },
  {
    name: "Projeoeste",
    phone: "(49) 3316-4909",
    email: "",
    website: "",
    city: "Chapecó",
    state: "SC"
  },
  {
    name: "Tudo Solar",
    phone: "(99)3621 7138",
    email: "jorge@ohms-ma.com",
    website: "http://ohms-tudosolar.com.br",
    city: "Bacabal",
    state: "MA"
  },
  {
    name: "MSW ENGENHARIA ELÉTRICA",
    phone: "(49) 9 9960-2632",
    email: "contato@mswengenhariaeletrica.com",
    website: "https://mswengenhariaeletrica.com.br",
    city: "Chapecó",
    state: "SC"
  },
  {
    name: "Ocenergia Materiais Elétricos",
    phone: "(65) 99618-0250",
    email: "comercial@ocenergiasolar.com.br",
    website: "https://www.ocenergiasolar.com.br/",
    city: "Barra do Bugres",
    state: "MT"
  },
  {
    name: "Comel",
    phone: "(53) 3035-8000",
    email: "atendimento@comelrg.com.br; engenharia@comelrg.com.br",
    website: "https://www.comelrg.com.br/",
    city: "Rio Grande",
    state: "RS"
  },
  {
    name: "Grupo Kaio Cesar",
    phone: "(84) 9 9630-1252",
    email: "comercial@kaiocesarengenharia.com",
    website: "https://grupokaiocesar.com.br/",
    city: "Currais Novos",
    state: "RN"
  },
  {
    name: "ANDRADE AUTOMAÇÃO E MATERIAL ELÉTRICO LTDA",
    phone: "(27) 3721-7516; (27) 99978-3143",
    email: "administracao@andradeautomacao.com.br",
    website: "",
    city: "Colatina",
    state: "ES"
  },
  {
    name: "UNISOLAR ENGENHARIA",
    phone: "(67) 9 9846-3583",
    email: "contato.unisolar@gmail.com",
    website: "https://www.instagram.com/unisolar_engenharia/",
    city: "Eldorado",
    state: "MS"
  },
  {
    name: "NORDESTE ENERGIAS RENOVAVEIS",
    phone: "(86) 9928-8685",
    email: "",
    website: "",
    city: "Parnaíba",
    state: "PI"
  },
  {
    name: "Eletronop",
    phone: "(66) 3531-0441",
    email: "energiasolar@eletronop.com.br",
    website: "http://www.eletronop.com.br",
    city: "Sinop",
    state: "MT"
  },
  {
    name: "ELB INSTALAÇÕES ELETRICAS",
    phone: "(66) 99955 4358; (66) 99955 4358",
    email: "financeiro.elbengenharia@gmail.com",
    website: "",
    city: "Sinop",
    state: "MT"
  },
  {
    name: "MR WATTS ENGENHARIA",
    phone: "(62) 9 9945-1409",
    email: "comercial@mrwatts.com.br",
    website: "",
    city: "Goiânia",
    state: "GO"
  },
  {
    name: "Eletrosystem Tecnologia e Energia",
    phone: "62 3253 1400",
    email: "wesley@eletrosystem.com",
    website: "",
    city: "Goiânia",
    state: "GO"
  },
  {
    name: "Magalhães Engenharia",
    phone: "65 3266 5331; 65 99350 0493",
    email: "engenharia@magalhaesengenharia.com",
    website: "http://www.magalhaesengenharia.com/",
    city: "Pontes e Lacerda",
    state: "MT"
  },
  {
    name: "Estação Solar",
    phone: "(86) 3305-1509; (86) 999450033",
    email: "",
    website: "http://www.estacaosolar.eco.br",
    city: "Teresina",
    state: "PI"
  },
  {
    name: "Ative Energia Solar",
    phone: "(83) 98231-2676",
    email: "vendas@ativeenergiasolar.com.br",
    website: "http://www.ativeenergiasolar.com.br",
    city: "Aparecida",
    state: "PB"
  },
  {
    name: "ELETROLIMA",
    phone: "(67) 9 9690-6950",
    email: "mateuslimacpo777@gmail.com",
    website: "https://www.instagram.com/eletronlimacpo/",
    city: "Caarapó",
    state: "MS"
  },
  {
    name: "Eletroclima Energia Solar",
    phone: "(99) 98275-7068",
    email: "athos.r@eletroclimasolar.com.br",
    website: "http://www.eletroclimasolar.com.br",
    city: "Pedreiras",
    state: "MA"
  },
  {
    name: "ENERGY VOLT ENERGIA SOLAR LTDA",
    phone: "(51) 3244-3230; (51) 9 8014-1279",
    email: "esequielricardo@energyvolt.com.br",
    website: "https://energyvolt.com.br/",
    city: "Viamão",
    state: "RS"
  },
  {
    name: "Telcar Energy",
    phone: "(61) 3346-1036",
    email: "contato@telcardf.com.br",
    website: "",
    city: "Brasília",
    state: "DF"
  },
  {
    name: "TWR Energia Solar",
    phone: "(61) 99606-1717",
    email: "twr@twrenergia.com.br",
    website: "http://www.twrenergiasolar.com.br",
    city: "Brasília",
    state: "DF"
  },
  {
    name: "Módulo Energia",
    phone: "(61) 3053-0300",
    email: "contato@moduloenergia.com",
    website: "https://moduloenergia.com/",
    city: "Brasília",
    state: "DF"
  },
  {
    name: "GRUPO R ENERGIA SOLAR",
    phone: "(67) 9 9323-1065; (67) 9 9953-7090",
    email: "grupoRsolar@gmail.com",
    website: "https://gruporenergiasolar.com/",
    city: "Camapuã",
    state: "MS"
  },
  {
    name: "SOLALUX ENERGIA SOLAR",
    phone: "(92)3088-5510",
    email: "solalux@outlook.com.br",
    website: "",
    city: "Manaus",
    state: "AM"
  },
  {
    name: "Taldi Indústria, Serviços e incorporações Ltda",
    phone: "(84) 99135-6781",
    email: "comercial@taldi.com.br",
    website: "http://www.taldi.com.br",
    city: "Mossoró",
    state: "RN"
  },
  {
    name: "WSO Energia Solar",
    phone: "84 3211-4401",
    email: "wso@grupowso.com.br",
    website: "http://grupowso.com.br",
    city: "Natal",
    state: "RN"
  },
  {
    name: "FÊNIX SERVIÇOS EM ENERGIA SOLAR",
    phone: "66 3566 4994",
    email: "vendas.fenix@servicosfenix.com.br",
    website: "http://www.servicosfenix.com.br",
    city: "Juína",
    state: "MT"
  },
  {
    name: "L R Soluções Elétricas",
    phone: "(82) 99931-1830",
    email: "engenharialrsolar@gmail.com",
    website: "https://lrsolucoeseletricas.com/",
    city: "Arapiraca",
    state: "AL"
  },
  {
    name: "Wegga Energy",
    phone: "(48) 98802-4310; (48) 99130-0380",
    email: "comercial@wegga.com.br",
    website: "https://wegga.com.br/",
    city: "Florianópolis",
    state: "SC"
  },
  {
    name: "Protemax",
    phone: "(63) 99210-3767",
    email: "Protemax2018@gmail.com",
    website: "",
    city: "Paraíso do Tocantins",
    state: "TO"
  },
  {
    name: "Gerenttech",
    phone: "(48) 99988-3766",
    email: "contato@gerenttech.com.br",
    website: "https://gerenttech.com.br/",
    city: "Santo Amaro da Imperatriz",
    state: "SC"
  },
  {
    name: "SH Soluções tecnologia",
    phone: "91 3015-9958",
    email: "contato@sunnyhouse.com.br",
    website: "http://www.sunnyhouse.com.br",
    city: "Belém",
    state: "PA"
  },
  {
    name: "T Gold Energia Solar",
    phone: "(53) 98408-5039; (53) 99987-3612",
    email: "tgoldenergiasolar07@gmail.com",
    website: "",
    city: "Canguçu",
    state: "RS"
  },
  {
    name: "Cambaúva Engenharia Elétrica",
    phone: "(67) 3254-1603",
    email: "cambauva@outlook.com.br",
    website: "",
    city: "Sonora",
    state: "MS"
  },
  {
    name: "CONEX ENGENHARIA LTDA",
    phone: "(87) 99119-4344",
    email: "comercial.conexengenharia@gmail.com",
    website: "https://conexsolar.com.br/",
    city: "Petrolina",
    state: "PE"
  },
  {
    name: "ACH COMERCIO IMPORTACAO E EXPORTACAO LTDA",
    phone: "(69) 99977-4094",
    email: "agnaldo@agromotores.com.br",
    website: "",
    city: "Porto Velho",
    state: "RO"
  },
  {
    name: "SOLAREL",
    phone: "87 3831-1066",
    email: "comercial@solarel.com.br",
    website: "http://solarel.com.br",
    city: "Serra Talhada",
    state: "PE"
  },
  {
    name: "EMPROTEC",
    phone: "(81) 3036-4050; (81) 3036-4055; (81) 99904-7690 (WhatsApp)",
    email: "assistec@emprotec.com.br",
    website: "https://www.emprotec.com.br",
    city: "Recife",
    state: "PE"
  },
  {
    name: "FONTES SOLUÇÕES DE ENGENHARIA",
    phone: "",
    email: "nicolaufontes@yellowgreenbr.com.br",
    website: "https://www.yellowgreenbr.com.br/",
    city: "Jardim de Piranhas",
    state: "RN"
  },
  {
    name: "TIMAS ENGENHARIA E ENERGIA SOLAR LTDA",
    phone: "(65) 9 9613-9680",
    email: "contato@timasengenharia.com.br",
    website: "https://www.instagram.com/timasengenhariaesolucoes/",
    city: "Arenápolis",
    state: "MT"
  },
  {
    name: "Ulian Engenharia",
    phone: "(65) 3251-2439",
    email: "vinicius@ulianengenharia.com.br",
    website: "",
    city: "São José dos Quatro Marcos",
    state: "MT"
  },
  {
    name: "Seletron Energia Solar Ltda",
    phone: "98 98534-6655",
    email: "seletronseguranca@hotmail.com",
    website: "http://www.seletronenergia.com.br",
    city: "São Luís",
    state: "MA"
  },
  {
    name: "Axioma Energia Solar LTDA",
    phone: "(85) 99806-2621",
    email: "axiomaenergiasolar@gmail.com",
    website: "https://www.axiomaenergiasolar.com.br/",
    city: "Fortaleza",
    state: "CE"
  },
  {
    name: "Agromotores Máquinas e Implementos Ltda",
    phone: "(69) 3211-3400",
    email: "agromotores@agromotores.com.br",
    website: "http://www.agromotores.com.br",
    city: "Porto Velho",
    state: "RO"
  },
  {
    name: "Verdi Comércio de Materiais",
    phone: "(87) 3835-6351; (87) 9190-7207",
    email: "comercial@verdisolar.com.br",
    website: "http://www.verdisolar.com.br",
    city: "Pesqueira",
    state: "PE"
  },
]

puts "📊 TOTAL DE EMPRESAS NO ARRAY: #{companies_data.size}"
puts "⏳ Processando e enriquecendo dados..."

# Processar cada empresa e enriquecer com dados adicionais
enriched_companies = []

companies_data.each_with_index do |company, index|
  next if company[:name].empty? || company[:city].empty? || company[:state].empty?
  
  # Processar telefones
  phones = company[:phone].to_s.split(';').map(&:strip).reject(&:empty?)
  phone = process_phone(phones[0]) if phones[0]
  phone_alt = process_phone(phones[1]) if phones[1]
  whatsapp = process_phone(phones.find { |p| p.include?('WhatsApp') || p.include?('whats') || p.include?('9') }) || phone
  
  # Processar email
  email = extract_first_email(company[:email])
  email_public = email
  
  # Processar website
  website = process_website(company[:website])
  
  # Gerar dados adicionais
  cnpj = generate_valid_cnpj(index + 1000) # Começar de 1000 para não conflitar com outros CNPJs
  description = generate_description(company[:name], company[:city], company[:state])
  address = generate_address(company[:city], company[:state])
  coords = generate_coordinates(company[:city], company[:state])
  
  # Definir tipos de projeto e serviços baseados no nome
  project_types = []
  services_offered = []
  
  if company[:name].downcase.include?('residencial') || company[:name].downcase.include?('casa') || company[:name].downcase.include?('home')
    project_types << "Residenciais"
    services_offered << "Instalação Residencial"
  elsif company[:name].downcase.include?('comercial') || company[:name].downcase.include?('empresa') || company[:name].downcase.include?('industrial')
    project_types << "Comerciais"
    services_offered << "Instalação Comercial"
  else
    # Distribuição aleatória
    rand_types = []
    rand_services = []
    
    if rand(1..100) <= 70
      rand_types << "Residenciais"
      rand_services << "Instalação Residencial"
    end
    
    if rand(1..100) <= 60
      rand_types << "Comerciais"
      rand_services << "Instalação Comercial"
    end
    
    if rand(1..100) <= 30
      rand_types << "Rurais"
      rand_services << "Manutenção e Suporte"
    end
    
    if rand_services.empty?
      rand_services << "Consultoria Energética"
    end
    
    project_types = rand_types.uniq
    services_offered = rand_services.uniq
  end
  
  # Definir categorias baseadas nos tipos de projeto
  category_ids = []
  
  if company[:category_id]
    category_ids << company[:category_id]
  else
    if project_types.include?("Residenciais")
      category_ids << "4"
    end
    
    if project_types.include?("Comerciais") || project_types.include?("Rurais")
      category_ids << "3"
    end
    
    if category_ids.empty?
      category_ids = ["1", "2"]
    end
  end
  
  enriched_company = {
    name: company[:name],
    description: description,
    cnpj: cnpj,
    status: "active",
    moderation_status: "approved",
    featured: rand(1..100) <= 20, # 20% das empresas são destacadas
    verified: rand(1..100) <= 70, # 70% das empresas são verificadas
    active_admin: rand(1..100) <= 10, # 10% têm admin ativo
    email: email,
    email_public: email_public,
    phone: phone,
    phone_alt: phone_alt,
    whatsapp: whatsapp,
    address: address,
    state: company[:state],
    city: company[:city],
    latitude: coords[:latitude],
    longitude: coords[:longitude],
    website: website,
    founded_year: rand(2010..2022),
    employees_count: rand(5..100),
    minimum_ticket: rand(5000..20000),
    maximum_ticket: rand(50000..500000),
    working_hours: ["Seg-Sex 8h-18h", "Seg-Sex 9h-17h", "Seg-Sex 8h30-17h30", "Seg-Sex 8h-17h"].sample,
    payment_methods: ["Cartão, Boleto, Transferência", "Boleto, Transferência, Financiamento", "Transferência, Financiamento"].sample,
    response_time_sla: [24, 48, 72, 96].sample,
    languages: "Português" + (rand(1..100) <= 30 ? ", Inglês" : ""),
    facebook: rand(1..100) <= 40 ? "https://facebook.com/#{company[:name].downcase.gsub(/\s+/, '').gsub(/[^a-z0-9]/, '')}" : "",
    instagram: rand(1..100) <= 50 ? "https://instagram.com/#{company[:name].downcase.gsub(/\s+/, '').gsub(/[^a-z0-9]/, '')}" : "",
    linkedin: rand(1..100) <= 30 ? "https://linkedin.com/company/#{company[:name].downcase.gsub(/\s+/, '').gsub(/[^a-z0-9]/, '')}" : "",
    project_types: project_types,
    services_offered: services_offered,
    category_ids: category_ids.join(',')
  }
  
  enriched_companies << enriched_company
end

puts "✅ Dados enriquecidos: #{enriched_companies.size} empresas"
puts "⏳ Iniciando processo de criação/atualização no banco de dados..."

success_count = 0
error_count = 0

enriched_companies.each_with_index do |company_attrs, index|
  begin
    print "  [#{index + 1}/#{enriched_companies.size}] Processando #{company_attrs[:name]}... "
    
    # Prepara os atributos para o modelo Rails
    attrs = company_attrs.dup
    
    # Aplicar correções
    attrs[:project_types] = corrigir_project_types(attrs[:project_types])
    attrs[:services_offered] = corrigir_services(attrs[:services_offered])
    
    # Resolve categorias reais (Associação has_and_belongs_to_many)
    if attrs[:category_ids].is_a?(String)
      ids = attrs[:category_ids].split(',').map(&:strip).reject(&:empty?)
      slugs = ids.map { |id| category_map[id] }.compact
      attrs[:categories] = Category.where(seo_url: slugs)
      attrs.delete(:category_ids)
    end

    # Verifica se a empresa já existe pelo CNPJ
    company = Company.find_by(cnpj: attrs[:cnpj])
    
    if company
      # Atualiza empresa existente
      company.update!(attrs)
      puts "🔄 ATUALIZADA"
    else
      # Cria nova empresa
      Company.create!(attrs)
      puts "✅ CRIADA"
    end
    
    success_count += 1
    
  rescue ActiveRecord::RecordInvalid => e
    error_count += 1
    puts "❌ ERRO DE VALIDAÇÃO: #{e.message}"
    puts "   Detalhes: #{e.record.errors.full_messages.join(', ')}"
  rescue StandardError => e
    error_count += 1
    puts "❌ ERRO INESPERADO: #{e.message}"
    puts "   Backtrace: #{e.backtrace.first(5).join("\n   ")}"
  end
end

puts "\n" + "="*60
puts "🎉 IMPORTAÇÃO CONCLUÍDA!"
puts "="*60
puts "📈 RESUMO FINAL:"
puts "   ✅ Empresas criadas/atualizadas: #{success_count}"
puts "   ❌ Erros: #{error_count}"
puts "   📊 Total processado: #{enriched_companies.size}"
puts "="*60

# Verificação final
puts "\n🔍 VERIFICAÇÃO NO BANCO DE DADOS:"
total_in_db = Company.count
puts "   Total de empresas no banco: #{total_in_db}"
puts "   Empresas ativas: #{Company.where(status: 'active').count}"
puts "   Empresas destacadas: #{Company.where(featured: true).count}"
puts "   Empresas verificadas: #{Company.where(verified: true).count}"