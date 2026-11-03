# frozen_string_literal: true

# db/seeds/mercado_livre_categories.rb
# Arquitetura de subcategorias para Mercado Livre de Energia (ACL)

root = Category.find_by(seo_url: 'mercado-livre-de-energia') || Category.find_by(id: 90)

unless root
  root = Category.create!(
    name: 'Mercado Livre de Energia',
    seo_url: 'mercado-livre-de-energia',
    kind: 'main',
    status: 'active',
    featured: true,
    short_description: 'Compare comercializadoras varejistas, consultorias e empresas de gestão de energia no ACL.',
    description: 'Compare comercializadoras varejistas, consultorias e empresas de gestão de energia. Entenda quais soluções atendem ao seu negócio e avalie propostas com atenção aos custos, ao contrato e ao suporte.'
  )
end

puts "⚡ Configurando subcategorias de Mercado Livre de Energia (Pai ID #{root.id})..."

subcategories_data = [
  {
    name: 'Comercializadoras Varejistas de Energia',
    slug: 'comercializadoras-varejistas-energia',
    featured: true,
    seo_title: 'Comercializadoras Varejistas de Energia | Avalia Solar',
    seo_description: 'Compare comercializadoras varejistas, entenda a representação na CCEE e avalie custos, condições contratuais e atendimento para sua empresa.',
    short_description: 'Representação de consumidores na CCEE e comercialização varejista no ACL.',
    description: 'As comercializadoras varejistas de energia representam empresas no Ambiente de Contratação Livre (ACL) junto à Câmara de Comercialização de Energia Elétrica (CCEE). Esta modalidade é obrigatória para empresas do Grupo A com demanda inferior a 500 kW, eliminando a burocracia de adesão direta e aportes complexos de garantia. Compare empresas habilitadas, taxas de serviço, condições contratuais e prazos.'
  },
  {
    name: 'Consultoria para Migração ao Mercado Livre',
    slug: 'consultoria-migracao-mercado-livre',
    featured: true,
    seo_title: 'Consultoria para Migração ao Mercado Livre | Avalia Solar',
    seo_description: 'Encontre consultorias para avaliar a migração ao mercado livre de energia. Compare escopo, experiência, etapas do projeto e modelo de remuneração.',
    short_description: 'Análise de viabilidade técnica, econômica e denúncia de contrato para migração ao ACL.',
    description: 'A consultoria para migração ao Mercado Livre de Energia conduz a análise técnica da fatura, o estudo de histórico de consumo das unidades consumidoras, a denúncia do contrato regulado junto à distribuidora e a escolha da melhor estratégia de contratação no ACL. Compare consultorias independentes com experiência comprovada no seu segmento.'
  },
  {
    name: 'Gestão de Energia no Mercado Livre',
    slug: 'gestao-energia-mercado-livre',
    featured: true,
    seo_title: 'Gestão de Energia no Mercado Livre | Avalia Solar',
    seo_description: 'Compare empresas de gestão de energia no ACL. Avalie acompanhamento do consumo, contratos, faturas, relatórios e suporte para o seu negócio.',
    short_description: 'Acompanhamento de consumo, conciliação de faturas e gestão de obrigações regulatórias no ACL.',
    description: 'A gestão de energia no ACL assegura que sua empresa mantenha o consumo alinhado aos montantes contratados, evitando exposições ao Preço de Liquidação das Diferenças (PLD), multas por ultrapassagem e custos desnecessários. Inclui conciliação mensal da fatura da distribuidora e da comercializadora, relatórios gerenciais e inteligência setorial.'
  },
  {
    name: 'Compra de Energia e Contratos de Longo Prazo',
    slug: 'compra-energia-contratos-longo-prazo',
    featured: false,
    seo_title: 'Compra de Energia e Contratos de Longo Prazo | Avalia Solar',
    seo_description: 'Encontre fornecedores e assessores para compra de energia. Compare prazo, volume, reajuste, garantias e condições dos contratos de longo prazo.',
    short_description: 'Contratos bilaterais de compra de energia (PPA), fixação de tarifas e suprimento corporativo.',
    description: 'Estruturação de contratos de compra e venda de energia elétrica (CCVEE / PPAs) nos ambientes de contratação livre. Permite fixar tarifas no longo prazo, garantir previsibilidade orçamentária para a sua indústria ou comércio e escolher geradores com matriz 100% renovável.'
  },
  {
    name: 'Gestão de Riscos e Portfólio de Energia',
    slug: 'gestao-riscos-portfolio-energia',
    featured: false,
    seo_title: 'Gestão de Riscos e Portfólio de Energia | Avalia Solar',
    seo_description: 'Compare especialistas em riscos e portfólio de energia. Avalie exposição, flexibilidade contratual e estratégias para empresas e múltiplas unidades.',
    short_description: 'Análise de volatilidade de preços, exposição ao PLD e hedge para redes com múltiplos CNPJs.',
    description: 'Assessoria avançada em riscos energéticos para médias e grandes corporações e redes com múltiplos CNPJs. Monitoramento contínuo de curva de preços, cenários hidrológicos, modulação de carga e estratégias de hedge para conter volatilidade no mercado de energia.'
  },
  {
    name: 'Medição e Adequação para o Mercado Livre',
    slug: 'medicao-adequacao-mercado-livre',
    featured: false,
    seo_title: 'Medição e Adequação para o Mercado Livre | Avalia Solar',
    seo_description: 'Encontre serviços de medição e adequação para migração ao mercado livre, quando necessários. Compare escopo técnico, suporte e responsabilidades.',
    short_description: 'Adequação técnica de cabines, TPs, TCs e nobreaks para Sistema de Medição para Faturamento (SMF).',
    description: 'Engenharia elétrica especializada na adequação de cabines primárias, transformadores de instrumentos (TPs e TCs) e nobreaks para atender aos requisitos de telemedição e segurança operacional do Sistema de Medição para Faturamento (SMF) exigidos pela CCEE e distribuidoras locais.'
  },
  {
    name: 'Software para Gestão de Energia no ACL',
    slug: 'software-gestao-energia-acl',
    featured: false,
    seo_title: 'Software para Gestão de Energia no ACL | Avalia Solar',
    seo_description: 'Compare plataformas para acompanhar consumo, contratos e indicadores de energia no ACL. Avalie integrações e recursos para sua operação.',
    short_description: 'Plataformas de telemetria, rateio de custos e acompanhamento em tempo real de consumo elétrico.',
    description: 'Sistemas dedicados ao gerenciamento de dados de telemedição, rateio de custos entre filiais, previsão de consumo por inteligência artificial e geração automática de relatórios de conformidade regulatória e metas ESG.'
  },
  {
    name: 'Energia Renovável e Certificados de Origem',
    slug: 'energia-renovavel-certificados-origem',
    featured: false,
    seo_title: 'Energia Renovável e Certificados de Origem | Avalia Solar',
    seo_description: 'Entenda a diferença entre contratar energia renovável e adquirir certificados de origem. Compare ofertas, evidências e escopo dos fornecedores.',
    short_description: 'Contratação de fontes incentivadas e certificados I-REC para comprovação de metas sustentáveis ESG.',
    description: 'Soluções corporativas para comprovação de consumo de fontes limpas (solar, eólica, biomassa e PCHs) por meio de certificados de energia renovável (I-RECs) e contratos de autoprodução ou fornecimento incentivado com rastreabilidade auditada.'
  }
]

subcategories_data.each do |sub_data|
  sub = Category.find_or_initialize_by(seo_url: sub_data[:slug])
  sub.name = sub_data[:name]
  sub.parent_id = root.id
  sub.kind = 'sub'
  sub.status = 'active'
  sub.featured = sub_data[:featured]
  sub.seo_title = sub_data[:seo_title]
  sub.seo_description = sub_data[:seo_description]
  sub.short_description = sub_data[:short_description]
  sub.description = sub_data[:description]
  sub.save!
  puts "  ✅ Subcategoria salva: #{sub.name} (slug: #{sub.seo_url})"
end

root.update_metrics!
puts "✨ Subcategorias de Mercado Livre de Energia cadastradas com sucesso!"

