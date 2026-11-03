# frozen_string_literal: true

class SeedMercadoLivreSubcategories < ActiveRecord::Migration[7.0]
  def up
    root = ::Category.find_by(seo_url: 'mercado-livre-de-energia') || ::Category.find_by(id: 90)

    unless root
      root = ::Category.create!(
        name: 'Mercado Livre de Energia',
        seo_url: 'mercado-livre-de-energia',
        kind: 'main',
        status: 'active',
        featured: true,
        short_description: 'Compare comercializadoras varejistas, consultorias e empresas de gestão de energia no ACL.',
        description: 'Compare comercializadoras varejistas, consultorias e empresas de gestão de energia. Entenda quais soluções atendem ao seu negócio e avalie propostas com atenção aos custos, ao contrato e ao suporte.'
      )
    end

    # Atualiza dados da categoria principal para alinhar com a nova estratégia editorial
    root.update_columns(
      name: 'Mercado Livre de Energia',
      seo_url: 'mercado-livre-de-energia',
      seo_title: 'Mercado Livre de Energia: Compare Empresas | Avalia Solar',
      seo_description: 'Compare comercializadoras e consultorias do mercado livre de energia. Entenda os critérios de migração e encontre soluções para o perfil da sua empresa.',
      short_description: 'Compare comercializadoras varejistas, consultorias e empresas de gestão de energia. Entenda quais soluções atendem ao seu negócio e avalie propostas com atenção aos custos, ao contrato e ao suporte.',
      description: "Compare comercializadoras varejistas, consultorias e empresas de gestão de energia. Entenda quais soluções atendem ao seu negócio e avalie propostas com atenção aos custos, ao contrato e ao suporte.\n\nComo escolher uma empresa de mercado livre de energia?\nCompare fornecedores pelo serviço que você precisa: compra de energia, representação varejista, migração ou gestão contínua. Verifique a entidade responsável pelo contrato, a experiência com seu perfil de consumo e a transparência sobre custos e obrigações. Para comercializadoras varejistas, consulte a habilitação na CCEE. Antes de decidir, compare prazo, reajuste, flexibilidade de consumo, garantias e condições de saída. Avaliações de clientes ajudam a entender o atendimento, mas não substituem a análise da proposta.\n\nO que comparar nas propostas?\nPreço da energia é apenas parte da análise. Considere também os demais custos aplicáveis, a remuneração dos serviços, o perfil de consumo, os reajustes e as responsabilidades previstas no contrato. Solicite propostas com premissas equivalentes para comparar o custo total projetado."
    )

    # Atualiza ou cria as FAQs auditadas da categoria principal
    faqs_data = [
      {
        question: 'O que é o mercado livre de energia?',
        answer: 'É o ambiente em que consumidores habilitados escolhem fornecedores e negociam condições de compra de energia diretamente com comercializadoras e geradores. A distribuidora local continua responsável pela integridade física e operação da rede de distribuição.'
      },
      {
        question: 'Quem pode migrar para o mercado livre?',
        answer: 'Consumidores atendidos em média e alta tensão (Grupo A) já podem participar. A representação por comercializadora varejista é obrigatória quando a carga individual é inferior a 500 kW. Para baixa tensão, a abertura segue o cronograma regulatório oficial.'
      },
      {
        question: 'Pequenas empresas podem participar do ACL?',
        answer: 'O porte empresarial não decide sozinho. Uma pequena empresa atendida no Grupo A está plenamente apta a migrar; unidades em baixa tensão (Grupo B) dependem das fases posteriores de abertura regulatória.'
      },
      {
        question: 'Quanto é possível economizar no mercado livre?',
        answer: 'A estimativa de redução depende do volume de consumo, do perfil de carga, das condições contratuais e dos custos de transição. É recomendável comparar cenários com premissas idênticas, pois não existe um percentual universal garantido.'
      },
      {
        question: 'A distribuidora local deixa de atender a empresa?',
        answer: 'Não. A distribuidora segue operando os postes, fios e transformadores, garantindo a entrega física da energia e a manutenção da infraestrutura de rede, regulada pela ANEEL.'
      },
      {
        question: 'É necessário instalar painéis solares para migrar?',
        answer: 'Não. A contratação de energia no mercado livre e a instalação de sistemas solares fotovoltaicos no local de consumo são soluções energéticas distintas e independentes.'
      },
      {
        question: 'Quanto tempo demora o processo de migração?',
        answer: 'O prazo varia conforme o aviso prévio exigido no contrato com a distribuidora, a adequação de medição e os trâmites regulatórios junto à CCEE, levando em média de 3 a 6 meses.'
      },
      {
        question: 'Como comparar comercializadoras e consultorias?',
        answer: 'Confira a habilitação oficial na CCEE para agentes varejistas, os custos totais de contratação, as cláusulas de flexibilidade de volume, garantias exigidas e avaliações de clientes verificados no Avalia Solar.'
      }
    ]

    faqs_data.each_with_index do |faq_item, index|
      faq = root.category_faqs.find_or_initialize_by(question: faq_item[:question])
      faq.answer = faq_item[:answer]
      faq.position = index + 1
      faq.status = 'published'
      faq.save!
    end

    # Definição das 8 subcategorias organizadas por fase de rollout
    subcategories_data = [
      # Fase 1 — Serviços Centrais
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

      # Fase 2 — Expansão Técnica e Contratual
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

      # Fase 3 — Tecnologia e Sustentabilidade
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

    created_subcategories = []

    subcategories_data.each do |sub_data|
      sub = ::Category.find_or_initialize_by(seo_url: sub_data[:slug])
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

      created_subcategories << sub
    end

    # Vincula fornecedores compatíveis do ACL às subcategorias pertinentes da Fase 1
    # Lead Energy (gestão, varejista, consultoria e software)
    lead_energy = ::Company.find_by(slug: 'lead-energy')
    if lead_energy
      varejistas_sub = created_subcategories.find { |s| s.seo_url == 'comercializadoras-varejistas-energia' }
      consultoria_sub = created_subcategories.find { |s| s.seo_url == 'consultoria-migracao-mercado-livre' }
      gestao_sub = created_subcategories.find { |s| s.seo_url == 'gestao-energia-mercado-livre' }
      software_sub = created_subcategories.find { |s| s.seo_url == 'software-gestao-energia-acl' }

      [varejistas_sub, consultoria_sub, gestao_sub, software_sub].compact.each do |cat|
        lead_energy.categories << cat unless lead_energy.categories.exists?(id: cat.id)
      end
    end

    # Atualiza métricas
    root.update_metrics!
    created_subcategories.each(&:update_metrics!)
    root.clear_query_cache!
  end

  def down
    sub_slugs = [
      'comercializadoras-varejistas-energia',
      'consultoria-migracao-mercado-livre',
      'gestao-energia-mercado-livre',
      'compra-energia-contratos-longo-prazo',
      'gestao-riscos-portfolio-energia',
      'medicao-adequacao-mercado-livre',
      'software-gestao-energia-acl',
      'energia-renovavel-certificados-origem'
    ]

    ::Category.where(seo_url: sub_slugs).destroy_all
  end
end

