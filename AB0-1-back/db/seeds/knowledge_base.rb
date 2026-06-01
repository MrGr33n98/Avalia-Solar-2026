# frozen_string_literal: true

module Seeds
  class KnowledgeBase
    def self.run!
      puts "\n==> Base de Conhecimento (MobiVolt AI FAQ Seeds)"
      articles_count = 0

      # 1. Mapeamento de FAQs
      faqs = [
        {
          title: "O que é um microinversor?",
          content: "Um microinversor é um pequeno dispositivo eletrônico instalado individualmente em cada painel solar (diferente de um inversor tradicional 'string', que gerencia um grupo inteiro de placas). Sua principal vantagem é otimizar a geração de energia de cada placa de forma independente. Isso significa que, se uma placa sofrer sombreamento por sujeira ou sombra de uma árvore, as outras continuarão gerando energia em capacidade máxima, garantindo maior eficiência e segurança para o sistema residencial.",
          category_seo: "inversores-solares"
        },
        {
          title: "Qual a diferença entre inversor e microinversor?",
          content: "A diferença principal está na arquitetura e na otimização. O inversor tradicional (string) fica na parede e gerencia a energia produzida por todo o conjunto de painéis de forma centralizada. Se um painel render menos (devido a sombra ou sujeira), todo o conjunto sofre a perda. Já o microinversor é instalado atrás de cada placa (ou para cada dupla/quádruplo), tratando a produção de cada uma individualmente. Isso traz mais segurança (trabalha em corrente alternada e baixa tensão no telhado), facilita a expansão do sistema no futuro e oferece monitoramento individual placa a placa.",
          category_seo: "inversores-solares"
        },
        {
          title: "O que é energia injetada?",
          content: "Energia injetada é o excedente de eletricidade gerado pelos seus painéis solares que você não consumiu no momento da produção e que foi enviado para a rede da distribuidora local (como Enel, Light, Neoenergia, etc.). Essa energia é medida pelo relógio bidirecional. Toda vez que o sistema gera mais do que a casa consome, essa energia é 'injetada' e a concessionária registra essa quantidade para gerar créditos de energia na sua conta de luz.",
          category_seo: "monitoramento-operacao-manutencao"
        },
        {
          title: "Como funcionam os créditos de energia?",
          content: "Os créditos de energia funcionam como uma 'poupança' energética. A energia injetada na rede da distribuidora gera créditos medidos em quilowatts-hora (kWh). Você utiliza esses créditos automaticamente para abater o consumo da rede nos momentos em que o sistema solar não está gerando energia (como à noite ou em dias muito nublados). Segundo a Resolução da ANEEL, os créditos têm validade de 60 meses e também podem ser usados para abater contas de outros imóveis do mesmo titular na mesma distribuidora.",
          category_seo: "financiamento-energia-solar"
        },
        {
          title: "O que é um wallbox?",
          content: "Wallbox é o termo comercial para carregadores rápidos residenciais ou comerciais de veículos elétricos que são fixados na parede ou em um totem. Diferente do carregador portátil de emergência (que liga em tomadas comuns de 10A ou 20A e demora até 20 a 30 horas para carregar), o wallbox opera em potências maiores (geralmente de 7,4 kW a 22 kW), permitindo carregar a bateria do carro elétrico em poucas horas (geralmente entre 4 a 8 horas), com muito mais segurança elétrica, proteção interna e recursos de conectividade smart.",
          category_seo: "carregadores-residenciais"
        },
        {
          title: "Qual a diferença entre recarga AC e DC?",
          content: "A principal diferença está no local onde ocorre a conversão da corrente e na velocidade. As baterias dos carros elétricos armazenam energia em Corrente Contínua (DC). A energia da rede elétrica é Corrente Alternada (AC). Na recarga AC (lenta, típica de residências e wallboxes), o próprio carro converte a energia AC em DC através do seu carregador interno. Na recarga DC (rápida/ultra-rápida, encontrada em rodovias e postos comerciais), a própria estação converte a energia e a injeta diretamente na bateria, entregando alta potência (acima de 50 kW até 350 kW) e reduzindo o tempo de carga para minutos.",
          category_seo: "carregadores-comerciais"
        },
        {
          title: "Posso instalar carregador veicular em condomínio?",
          content: "Sim, é possível instalar, mas exige conformidade técnica e aprovação. O principal desafio é a capacidade elétrica do condomínio e a individualização do consumo. Existem três caminhos principais: 1) Instalação ligada diretamente ao relógio do próprio apartamento (se tecnicamente viável); 2) Criação de uma rede coletiva pelo condomínio com medidores inteligentes individualizados; 3) Uso de estações compartilhadas geridas por empresas de recarga que faturam o usuário pelo uso. Recomenda-se sempre realizar um estudo de demanda e apresentar o projeto em assembleia condominial.",
          category_seo: "carregadores-comerciais"
        },
        {
          title: "O que é uma bateria solar e quando vale a pena?",
          content: "A bateria solar é um sistema de armazenamento que guarda o excedente de energia gerado pelas placas solares durante o dia para ser usado à noite ou em momentos de queda de energia (backup). Vale a pena principalmente em sistemas off-grid (sem conexão com a rede, como sítios isolados), em locais com quedas constantes de eletricidade onde o backup é vital, ou em regiões onde a tarifa de energia no horário de pico (início da noite) é excessivamente cara. Para sistemas residenciais urbanos comuns (on-grid), o uso de créditos costuma ser financeiramente mais viável devido ao alto custo inicial das baterias.",
          category_seo: "baterias-armazenamento"
        },
        {
          title: "O que é carport solar?",
          content: "Carport solar é uma estrutura de estacionamento de veículos (cobertura) cujas telhas tradicionais são substituídas por painéis solares fotovoltaicos. Em vez de simplesmente proteger o carro da chuva e do sol, o carport aproveita a área de cobertura para gerar energia limpa. É uma solução excelente para residências com telhados desfavoráveis (com sombreamento ou orientação errada) e para empresas, shoppings e supermercados que querem otimizar suas vagas, gerar energia e opcionalmente alimentar carregadores de veículos elétricos integrados.",
          category_seo: "carport-solar"
        },
        {
          title: "Como funciona o financiamento de energia solar?",
          content: "O financiamento solar é uma linha de crédito específica criada por bancos (como BV, Santander, Sicredi, Banco do Brasil, etc.) para a aquisição de geradores fotovoltaicos e instalação. Na maioria das vezes, a própria economia gerada na conta de luz mensal é suficiente para pagar o valor da parcela mensal do financiamento. O crédito pode cobrir até 100% do projeto (equipamentos e mão de obra), possui taxas de juros competitivas (sendo um financiamento sustentável) e carências que variam de 60 a 120 dias antes do vencimento da primeira parcela.",
          category_seo: "financiamento-energia-solar"
        }
      ]

      # 2. Criação dos artigos no banco de dados de forma idempotente
      faqs.each do |faq|
        category = Category.find_by(seo_url: faq[:category_seo])
        unless category
          puts "  ⚠️ Categoria '#{faq[:category_seo]}' não encontrada. Pulando FAQ."
          next
        end

        slug = faq[:title].parameterize
        article = KnowledgeArticle.find_or_initialize_by(slug: slug)
        if article.new_record?
          article.assign_attributes(
            title: faq[:title],
            content: faq[:content],
            category_id: category.id,
            status: 'published',
            published_at: Time.current
          )
        else
          article.assign_attributes(
            title: faq[:title],
            category_id: category.id
          )
        end

        if article.save
          articles_count += 1
        else
          puts "  ❌ Erro ao criar artigo '#{faq[:title]}': #{article.errors.full_messages.join(', ')}"
        end
      end

      puts "  ✓ Artigos criados na base de conhecimento: #{articles_count}"
    end
  end
end
