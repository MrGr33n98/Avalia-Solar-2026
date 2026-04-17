# Go-to-Market A+++ - AvaliaSolar

**Tema:** Entrada em Florianopolis -> Santa Catarina -> expansao Brasil  
**Produto analisado:** AvaliaSolar, com foco em confianca, ranking, SEO geolocalizado e geracao de leads qualificados  
**Data:** 2026-04-15  
**Objetivo:** transformar o projeto em uma maquina regional de demanda qualificada, depois escalar com repetibilidade

---

## 1. Resumo executivo

A decisao estrategica correta nao e "crescer para o Brasil inteiro". E vencer primeiro um territorio pequeno o bastante para dominar, rico o bastante para monetizar e digital o bastante para acelerar.

A melhor tese para o AvaliaSolar e:

1. **Beachhead:** Florianopolis e Grande Florianopolis.
2. **Escala estadual:** Santa Catarina.
3. **Escala nacional:** replicacao por clusters de cidades e estados com alto fit solar e alto valor economico.

O produto ja tem as bases que um GTM serio precisa:

- paginas geolocalizadas com contexto regional e CTA direto;
- arquitetura de ranking, confianca, reviews e lead intent;
- trilha de analytics e GTM pronta para sinais de conversao;
- SEO semantico e canonicalizacao por categoria/cidade;
- dashboard para empresas com potencial de monetizacao recorrente.

Minha leitura: **o AvaliaSolar nao deve ser vendido como "mais um marketplace de orcamentos".** Ele deve ser posicionado como:

> **uma plataforma de confianca e demanda qualificada para empresas solares, com ranking verificavel, prova social e distribuicao de leads quentes por regiao.**

---

## 2. Leitura do projeto

### 2.1 O que o projeto ja e

O repositorio mostra um produto que combina:

- comparacao e descoberta de empresas solares;
- pages de SEO por cidade e categoria;
- sistema de reviews e reputacao;
- trust score e ranking;
- dashboard de empresa com analytics e funil;
- captacao de lead via WhatsApp e formulario;
- base para monetizacao via perfil, destaque, lead e inteligencia.

### 2.2 O que o projeto nao deve virar

Se o crescimento for guiado so por "volume de trafego", o produto vira commodity.

Evitar:

- campanhas broad sem prova local;
- home genérica tentando falar com o Brasil inteiro antes de dominar uma regiao;
- proposta comercial baseada apenas em preco;
- narrativa de "gerar orcamentos" sem diferenca de confianca.

### 2.3 O que o repo ja entrega para o GTM

Trechos relevantes da base atual:

- `AB0-1-front/app/solucoes/[slug]/page.tsx` ja publica landing pages por cidade com irradiacao, ROI estimado e preco medio regional;
- `AB0-1-front/docs/seo-companies-url-structure.md` ja consolida URLs semanticamente canonicas para indexacao;
- `docs/analytics/GTM_TAG_MATRIX.md` ja define o que pode ou nao pode ser disparado no GTM sem duplicar GA4;
- `docs/analytics/MEASUREMENT_READINESS_INDEX.md` ja mostra que o sistema e usavel, mas ainda tem gaps de contexto por brand e regiao;
- `docs/analytics/BRAND_ANALYTICS_TEMPLATE.md` ja aponta o caminho certo: eventos precisam carregar `brand_id`, `brand_slug` e `app_key`.

Conclusao: **o produto nao precisa inventar a camada regional. Ele precisa industrializa-la.**

---

## 3. Tese de mercado

### 3.1 Por que Florianopolis primeiro

Florianopolis e um beachhead forte porque combina:

- alta densidade urbana;
- renda e PIB per capita acima da media;
- decisores digitais e sensiveis a reputacao;
- mercado pequeno o suficiente para concentrar a forca comercial;
- capacidade de gerar cases locais rapidos e reutilizaveis.

**Dados publicos que sustentam a tese:**

| Escopo | Dado | Leitura para GTM |
|---|---:|---|
| Florianopolis | 587.486 habitantes estimados em 2025 | Cidade suficientemente grande para gerar demanda e pequenos o bastante para dominar localmente |
| Florianopolis | PIB per capita de R$ 58.059,37 em 2023 | Mercado com maior propensao a comprar por valor e confianca, nao so por preco |
| Santa Catarina | 8.187.029 habitantes estimados em 2025 | Estado relevante para escalar depois do beachhead |
| Santa Catarina | rendimento mensal domiciliar per capita de R$ 2.601 em 2024 | Indica base economica favoravel para tickets solares e services premium |
| Brasil | 41,48 GW de MMGD ate junho de 2025 | O mercado ja e grande o bastante para exigir diferenciacao e confianca |
| Brasil | 3,71 milhoes de sistemas e 6,5 milhoes de unidades beneficiadas | Mercado maduro, com demanda real e muitos pontos de captura |
| Santa Catarina | mais de 113 mil conexoes, 1,4 GW e 293 cidades em 2025 | O estado ja tem massa critica para uma entrada local acelerada |

### 3.2 O que isso significa na pratica

O argumento de entrada nao e "vamos tentar o Brasil". E:

- Florianopolis tem densidade para provar o modelo.
- Santa Catarina tem massa critica para repetir o playbook.
- O Brasil inteiro so faz sentido depois que o playbook estiver repetivel.

### 3.3 Inference de mercado

Inferencia importante: como o produto ja opera com pages por cidade, ranking e confianca, a melhor forma de ganhar e capturar **demanda de alta intencao local** antes de tentar educar massa nacional.

Isso e tipico de negocios B2B2C com efeito de rede:

- primeiro voce precisa de oferta confiavel;
- depois voce converte a demanda;
- por fim voce monetiza o algoritmo de confianca e distribuicao de leads.

---

## 4. Leitura Bain, BCG e McKinsey

### 4.1 Bain: results tree e unit economics

A lente Bain e simples: **onde esta o resultado economico?**

#### Results tree do AvaliaSolar

1. Visitas geolocalizadas.
2. Visualizacao de empresa / categoria.
3. Clique em CTA / WhatsApp / orcamento.
4. Lead qualificado ou verificado.
5. Receita por empresa.
6. Retencao / upgrade / recorrencia.

#### Alavancas de valor

- aumentar trafego de alta intencao local;
- aumentar taxa de conversao de city page para perfil de empresa;
- aumentar taxa de clique em CTA;
- aumentar taxa de lead verificado;
- aumentar ARPA por empresa ativa;
- reduzir CAC via SEO, parceria e prova social.

#### Norte economico

O North Star nao deve ser "pageviews". Deve ser:

> **leads qualificados entregues para empresas verificadas por cidade ativa**

---

### 4.2 BCG: portfolio e sequenciamento

A lente BCG ajuda a nao gastar energia igual em tudo.

#### Portfolio recomendado

| Categoria | Classificacao | Decisao |
|---|---|---|
| Landing pages geolocalizadas de Florianopolis | Star | Dobrar aposta |
| Conteudo de alto intento local | Star | Dobrar aposta |
| Perfil verificado / trust score / ranking | Star | Dobrar aposta |
| Páginas genericas nacionais sem prova local | Question mark | Testar com cautela |
| Remarketing e mid-funnel local | Cash cow | Manter e otimizar |
| Awareness nacional cedo demais | Dog | Evitar nesta fase |

#### Sequencia BCG por territorio

1. **Alta densidade e alta propensao de compra**: Florianopolis e Grande Florianopolis.
2. **Alta massa critica estadual**: Joinville, Blumenau, Itajai, Balneario Camboriu, Chapeco, Criciuma e Jaragua do Sul.
3. **Escala nacional**: estados com maior fit de solar + renda + ecossistema comercial.

---

### 4.3 McKinsey: 3C + 7S para execucao

#### 3C

**Customer**

- empresas solares;
- integradores e EPCs;
- instaladores premium;
- distribuidores;
- empresas que querem reputacao e leads melhores.

**Company**

- trust score;
- ranking;
- reviews;
- SEO local;
- dashboard de performance;
- analytics de funil.

**Competition**

- marketplaces genericos;
- directories e mapas sem confianca;
- agencias de trafego sem produto;
- lead gen commodity.

#### 7S de execucao

| S | Aplicacao |
|---|---|
| Strategy | conquistar Floripa com proof-based local GTM |
| Structure | squad enxuta de growth + sales + content + analytics |
| Systems | tracking por cidade, categoria e empresa |
| Skills | SEO local, B2B sales, proof building, analytics |
| Staff | time pequeno e obcecado por ciclo curto de aprendizado |
| Style | consultivo, transparente, sem guerra de preco |
| Shared Values | confianca, prova, velocidade, repetibilidade |

---

## 5. Posicionamento

### 5.1 Posicionamento recomendado

**Para o mercado:**
> AvaliaSolar ajuda pessoas e empresas a escolherem a melhor empresa solar com confianca, ranking e prova verificavel.

**Para empresas solares:**
> AvaliaSolar gera demanda mais qualificada, melhora reputacao e cria vantagem competitiva local com ranking e trust score.

### 5.2 Mensagem central

- Nao e so gerar lead.
- Nao e so aparecer no Google.
- Nao e so ter perfil.

E:

> **ser a empresa mais confiavel da sua regiao e converter essa confianca em demanda qualificada.**

### 5.3 Proposta de valor por lado do mercado

**Lado demanda**

- compara empresas com criterio;
- encontra prova social real;
- reduz risco de compra;
- entende ROI e faixa de preco.

**Lado oferta**

- ganha visibilidade local;
- recebe leads mais quentes;
- melhora reputacao publica;
- tem analytics e posicao competitiva;
- pode subir de faixa via trust score e performance.

---

## 6. Beachhead strategy

### 6.1 Sequencia de entrada

#### Fase 1 - Florianopolis e Grande Florianopolis

Objetivo:

- provar o playbook;
- gerar cases;
- criar densidade de oferta e demanda;
- estabelecer a marca como referencia local.

Target principal:

- integradores locais;
- empresas premium;
- instaladores com carteira residencial e comercial;
- players que valorizam reputacao.

#### Fase 2 - Santa Catarina

Objetivo:

- replicar o playbook em cidades de maior densidade economica;
- ganhar share of voice estadual;
- consolidar a marca como referencia catarinense.

#### Fase 3 - Brasil

Objetivo:

- padronizar o playbook;
- usar os cases catarinenses como prova;
- escalar por clusters com maior fit economico e solar.

### 6.2 Prioridade sugerida de cidades

| Prioridade | Territorio | Motivo |
|---|---|---|
| 1 | Florianopolis + Sao Jose + Palhoca | densidade, proximidade comercial e facilidade de execucao |
| 2 | Joinville + Blumenau + Itajai + Balneario Camboriu | poder economico, volume e potencial de premiumização |
| 3 | Criciuma + Jaragua do Sul + Chapeco | hubs regionais com chance de repeticao |
| 4 | PR / RS / SP / MG | expansao nacional com maior elasticidade de receita |

---

## 7. Oferta e monetizacao

### 7.1 Estrutura de oferta

**Free**

- claim de perfil;
- presenca basica;
- entrada de reviews;
- visibilidade inicial.

**Verified**

- trust score detalhado;
- selo verificavel;
- ranking regional;
- analytics basico;
- prioridade em algumas superficies.

**Growth**

- leads priorizados;
- performance dashboard;
- comparacao com concorrentes;
- city sponsorship;
- insights de intencao.

**Enterprise**

- portfólio multi-cidade;
- benchmarking avancado;
- roteamento de leads;
- parceria comercial;
- dados e relatorios executivos.

### 7.2 Monetizacao recomendada

1. assinatura de perfil premium;
2. taxa por lead qualificado;
3. destaque regional / sponsored placement;
4. dashboard executivo para empresas maiores;
5. relatórios e inteligencia de mercado.

### 7.3 Modelo de preco sugerido

O melhor modelo de preco para o beachhead nao e baseado em "lista de leads". Ele deve ser baseado em **valor, territorio e nivel de prova**.

#### Fences de preco

| Oferta | Faixa inicial sugerida | O que entrega | Quando usar |
|---|---:|---|---|
| Free / Claim | R$ 0 | perfil basico, claim da empresa, reviews, presenca minima | aquisicao de oferta e ativacao inicial |
| Verified Local | R$ 349 a R$ 499/mês | selo verificavel, trust score, ranking local, visibilidade prioritaria | empresas que querem reputacao e prova social |
| Growth Local | R$ 997 a R$ 1.497/mês | dashboard, leads priorizados, comparacao competitiva, prioridade em city pages | empresas que ja rodam volume e precisam converter melhor |
| Performance Lead Engine | R$ 497/mês + R$ 40 a R$ 90 por lead qualificado | lead monetizado por performance com SLA de qualidade | empresas maduras que aceitam custo por resultado |
| Sponsored Placement | R$ 1.500 a R$ 5.000/mês por cidade/categoria | destaque regional, top placement, cobertura de campanha | territorio com demanda forte e disputa de visibilidade |
| Enterprise / Multi-city | R$ 4.997 a R$ 12.000+/mês | portfolio multi-cidade, benchmarking, roteamento, relatorios executivos | distribuidores, redes e grupos com varias operacoes |

#### Regras de precificacao

- cobrar por cidade e categoria, nao por acesso abstrato;
- cobrar mais quando houver exclusividade regional ou prioridade de distribucao;
- cobrar mais quando houver SLA, dashboard e analise de performance;
- cobrar menos no piloto, mas nunca zerar o valor do compromisso;
- limite de desconto: 20% no maximo, apenas com contrato anual;
- contrato anual deve ter incentivo de 1 a 2 meses de economia, nao desconto agressivo.

#### Componentes adicionais

- taxa de onboarding/verificacao: R$ 750 a R$ 2.500;
- setup de campanha local: R$ 1.500 a R$ 4.000;
- pacote de migracao para multi-cidade: precificacao customizada;
- consultoria de posicao competitiva: opcional, empacotada no Enterprise.

#### Lógica de valor

O preco sobe quando sobe qualquer um destes fatores:

- quantidade de cidades cobertas;
- volume e exclusividade dos leads;
- prioridade no ranking;
- profundidade do dashboard;
- volume de reviews e provas sociais;
- suporte comercial e SLA.

### 7.4 Plano comercial por tiers

Para simplificar a venda, a narrativa comercial pode ser apresentada em três planos principais. Isso evita excesso de nomes e deixa o pitch mais claro para o mercado.

#### Free

**Para quem e**

- empresas que ainda nao estao prontas para comprar;
- empresas que querem testar presenca e entender o mercado;
- empresas que precisam reivindicar o perfil basico.

**Features**

- claim do perfil;
- presenca basica na plataforma;
- captura inicial de reviews;
- visibilidade limitada por cidade;
- acesso ao fluxo de entrada.

**Beneficios**

- entrar no ecossistema sem risco;
- validar interesse real da regiao;
- comecar a construir prova social;
- preparar a empresa para subir de plano.

#### Starter

**Para quem e**

- empresas que querem visibilidade local imediata;
- empresas que precisam de reputacao e ranking;
- empresas que querem receber leads melhores sem uma operacao complexa.

**Features**

- perfil verificado;
- trust score;
- ranking local por cidade e categoria;
- selo de verificacao;
- analytics basico;
- prioridade em superficies locais.

**Beneficios**

- melhora de reputacao publica;
- aumento de confianca na decisao do cliente;
- mais visibilidade nas buscas locais;
- base concreta para converter mais leads.

#### Pro

**Para quem e**

- empresas que ja operam volume;
- empresas que querem previsibilidade de pipeline;
- empresas que querem competir fortemente na regiao.

**Features**

- tudo do Starter;
- leads priorizados;
- performance dashboard;
- comparacao com concorrentes;
- city sponsorship;
- insights de intencao;
- suporte comercial e analitico mais forte;
- possibilidade de multi-cidade.

**Beneficios**

- mais leads qualificados;
- mais controle sobre a performance;
- vantagem competitiva real contra concorrentes locais;
- melhor justificativa de investimento;
- potencial de expansao para novas cidades e categorias.

#### Regra de upgrade

- Free vira Starter quando a empresa quer ser encontrada e comparada com mais confianca;
- Starter vira Pro quando a empresa quer previsibilidade comercial, mais leads e dominio regional;
- Pro pode evoluir para Enterprise quando entra multi-cidade ou necessidade de SLA executivo.

#### Posicionamento comercial final

| Plano | Promessa central | Resultado esperado |
|---|---|---|
| Free | "comece sua presenca" | entrar no ecossistema e captar prova |
| Starter | "apareca com confianca" | ganhar reputacao e visibilidade local |
| Pro | "domine sua regiao" | receber mais leads e competir com vantagem |

---

## 8. Go-to-market por fase

### 8.1 Fase 0 - Preparacao do beachhead

Antes de gastar pesado, precisa existir prova.

Checklist:

- ajustar pages de Floripa para categoria/cidade;
- garantir canonicals e schema;
- padronizar tracking por cidade, empresa e categoria;
- mapear 30 a 50 empresas-alvo em Floripa;
- criar 5 a 10 assets de prova social;
- preparar sequencia de outbound e follow-up.

### 8.2 Fase 1 - Florianopolis (0 a 90 dias)

#### Objetivo

- ativar a oferta local;
- capturar demanda de alta intencao;
- gerar 1 a 3 casos de sucesso fortes;
- provar o valor do trust score.

#### Canais prioritarios

**SEO local**

- pages por cidade e categoria;
- comparativos com foco em "empresa solar em Florianopolis";
- conteudo com ROI, preco e confianca;
- FAQ local com schema.

**Outbound consultivo**

- lista curta de integradores e EPCs;
- mensagem baseada em confianca, ranking e leads;
- demo curta com provas locais.

**Parcerias**

- entidades empresariais;
- fornecedores;
- integradores;
- condominios e administradoras;
- eventos locais do ecossistema.

**Paid search e remarketing**

- so depois de ter pagina local e prova;
- termo de alta intencao;
- remarketing para visitantes de cidade e categoria.

#### Metas sugeridas

- 10 a 20 empresas locais mapeadas e abordadas;
- 5 a 10 empresas ativadas;
- 2 a 3 cases de confianca com prova comercial;
- baseline de conversao por city page.

### 8.3 Fase 2 - Santa Catarina (90 a 180 dias)

#### Objetivo

- replicar o playbook nas principais cidades do estado;
- aumentar cobertura de mercado;
- transformar o estado em vitrine nacional.

#### Acoes

- criar clusters de city pages por regiao;
- escalar reviews e verificacao;
- ativar parceiros de canal;
- criar estudo de mercado catarinense;
- gerar ranking estadual por categoria.

#### Metas sugeridas

- cobertura das principais cidades do estado;
- aumento da taxa de leads qualificados;
- crescimento da marca em search local;
- reducao de CAC por efeito de prova.

### 8.4 Fase 3 - Brasil (180 a 365 dias)

#### Objetivo

- transformar o playbook regional em sistema de expansao nacional.

#### Ordem sugerida de expansao

1. Sul: PR e RS.
2. Sudeste: SP e MG.
3. Centro-Oeste: GO e DF.
4. Nordeste: BA e PE.

#### Regra de escala

Nao escalar por mapa. Escalar por:

- densidade economica;
- demanda de search;
- potencial de ticket;
- facilidade de prova local;
- disponibilidade de parceiros.

### 8.5 Growth engine recomendado

O growth engine precisa criar repeticao, nao somente aquisicao isolada.

#### Growth loops principais

1. **SEO loop**
   - city page publica;
   - o usuario encontra a empresa;
   - a empresa recebe lead;
   - a empresa converte e gera case;
   - o case alimenta novo conteudo;
   - o conteudo melhora a pagina e o ranking.

2. **Trust loop**
   - empresa melhora perfil e verifica dados;
   - trust score sobe;
   - ranking melhora;
   - mais visitas e leads chegam;
   - mais prova social entra;
   - o trust score ganha ainda mais forca.

3. **Review loop**
   - cliente satisfeito deixa review;
   - review melhora credibilidade;
   - melhor credibilidade aumenta conversao;
   - mais conversao gera mais clientes satisfeitos;
   - o ciclo de prova se retroalimenta.

4. **Partner loop**
   - parceiro indica empresa;
   - empresa entra na plataforma;
   - a plataforma gera lead e reputacao;
   - parceiro ve resultado;
   - parceiro volta a indicar mais empresas.

5. **Referral loop**
   - empresa ativa compartilha sua pagina;
   - a pagina gera visitas adicionais;
   - novas empresas veem o ranking e querem entrar;
   - o mercado passa a puxar a plataforma.

#### Prioridade de canais de growth

| Canal | Papel | Ordem |
|---|---|---|
| SEO local | captura de demanda de alta intencao | 1 |
| Outbound consultivo | ativacao da oferta e primeiras vendas | 2 |
| Parcerias locais | escala de oferta e prova | 3 |
| Paid search e remarketing | aceleracao com prova ja validada | 4 |
| Conteudo e PR local | autoridade e demanda passiva | 5 |

#### Cadencia de growth

- sprints quinzenais de experimento;
- uma hipotese por vez;
- uma metric primaria por teste;
- kill rápido do que nao performa;
- duplicar o que gera CAC payback curto.

---

## 9. SEO e conteudo

### 9.1 O que o repo ja permite

- paginas locais com metadata dinamica;
- JSON-LD para cidade e categoria;
- sitemap semantico;
- URLs canonicas por categoria;
- tracking regional.

### 9.2 Pilares de conteudo

1. **Local intent**
   - melhor empresa solar em Florianopolis;
   - instalador solar em Sao Jose;
   - energia solar em Palhoca.

2. **Decision intent**
   - quanto custa energia solar em SC;
   - como escolher empresa confiavel;
   - quais empresas tem melhor trust score.

3. **Commercial intent**
   - comparativo de empresas;
   - ranking por cidade;
   - orcamento e WhatsApp.

4. **Trust intent**
   - reviews;
   - verificacao;
   - certificacoes;
   - reputacao.

### 9.3 Estrategia editorial

- 1 hub por cidade prioritaria;
- 1 hub por categoria forte;
- 1 comparativo por cidade x categoria;
- 1 estudo de mercado por estado;
- 1 case study por parceiro ativado.

---

## 10. Sales motion

### 10.1 Motion recomendado

O motion ideal e **consultivo e local**, nao massivo e genérico.

Fluxo:

1. identificar empresa com fit;
2. mostrar pagina da cidade;
3. mostrar ranking / trust / lead intent;
4. mostrar gap competitivo;
5. propor piloto curto;
6. converter em plano premium.

### 10.2 Objeccoes comuns e resposta

**"Ja tenho trafego no meu site."**

Resposta:
- trafego sem prova e sem ranking vira custo;
- AvaliaSolar organiza reputacao e intenção.

**"Meu cliente vem pelo WhatsApp."**

Resposta:
- perfeito, o WhatsApp continua;
- o diferencial e chegar nele com melhor intencao e melhor confianca.

**"Nao quero pagar mais uma ferramenta."**

Resposta:
- o piloto precisa provar retorno rapido;
- o valor esta no lead mais qualificado e na reputacao publica.

### 10.3 Modelo de aquisicao de clientes

O cliente prioritario nao e qualquer empresa solar. E a empresa que consegue transformar reputacao em receita com rapidez.

#### ICP prioritario

| Faixa | Perfil | Sinal de fit |
|---|---|---|
| ICP 1 | empresa premium local | atende Florianopolis e regioes proximas, tem casos, quer reputacao |
| ICP 2 | integrador em crescimento | vende volume e precisa de previsibilidade de lead |
| ICP 3 | multi-cidade / distribuidor | quer padronizar presenca, benchmark e distribuicao |
| ICP 4 | empresa com forte WhatsApp | tem atendimento rapido e converte bem, mas ainda nao organiza prova |

#### Critérios de qualificacao

- atende uma regiao com potencial real de busca;
- tem capacidade operacional para responder leads rapido;
- possui ou aceita criar prova social;
- topa ser comparada publicamente;
- consegue pagar mensalidade ou performance sem depender de "teste gratis infinito".

#### Funil de aquisicao

1. lista de empresas por cidade e categoria;
2. enrich com sinais de reputacao, reviews e atividade digital;
3. outreach consultivo com tese de ranking e confianca;
4. demo curta com pagina local e gaps competitivos;
5. piloto de 30 dias com objetivo claro;
6. fechamento anual ou plano de crescimento;
7. expansion para novas cidades, categorias ou SLA.

#### Sequencia comercial recomendada

- mensagem 1: mostrar o gap competitivo local;
- mensagem 2: mostrar a pagina da cidade e a posicao atual;
- mensagem 3: mostrar como o trust score afeta o ranking;
- mensagem 4: oferecer piloto com meta de prova;
- mensagem 5: fechar com plano anual ou performance.

### 10.4 Oferta de entrada para aquisicao

O melhor "produto de entrada" e um pacote curto, objetivo e de baixo atrito.

#### Pacote de entrada

- diagnostico de presenca local;
- leitura de ranking e visibilidade;
- auditoria de reputacao e provas;
- recomendacao de melhoria da pagina;
- piloto de 30 dias com mensuracao.

#### Promessa do piloto

- aumentar visibilidade local;
- capturar leads mais alinhados;
- provar valor antes de migrar para contrato maior;
- criar base objetiva para upgrade.

#### Gatilhos de upgrade

- mais de uma cidade ativa;
- necessidade de mais leads;
- disputa regional acirrada;
- necessidade de relatorios executivos;
- interesse em exclusividade ou destaque.

---

## 11. Metricas e governanca

### 11.1 North star

> leads qualificados gerados por cidade ativa e empresa verificada

### 11.2 KPI tree

| Nivel | KPI |
|---|---|
| Aquisição | visitas orgânicas em city pages, CTR de SERP, custo por visita qualificada |
| Engajamento | view de empresa, tempo na pagina, scroll depth, FAQ expandida |
| Conversao | clique em CTA, WhatsApp click, formulario iniciado, wizard success |
| Monetizacao | empresas ativas pagas, ARPA, receita por cidade, receita por lead |
| Retencao | renovacao, uso do dashboard, respostas a leads, NPS |

### 11.3 Instrumentacao minima

Todo evento importante precisa carregar:

- `city`
- `state`
- `category`
- `company_id`
- `brand_id`
- `brand_slug`
- `app_key`
- `utm_source`
- `utm_campaign`

### 11.4 Lacuna atual de measurement

A documentacao de readiness ja indica gaps em contexto de brand. Para o GTM, isso significa:

- sem cidade e estado, nao existe analise regional boa;
- sem brand_id, nao existe separacao real por parceiro;
- sem padrao de naming, a leitura executiva fica fraca.

Prioridade: **brand-aware + geo-aware analytics**.

---

## 12. Roadmap de 90 dias

### Dias 1 a 15

- selecionar as primeiras cidades;
- revisar city pages e CTAs;
- definir oferta piloto;
- preparar lista de empresas alvo;
- fechar padrao de mensuracao.

### Dias 16 a 30

- ativar outbound local;
- publicar conteudos de alta intencao;
- iniciar contatos com parceiros;
- testar page variants e mensagens.

### Dias 31 a 60

- fechar os primeiros clientes / parceiros;
- coletar reviews e cases;
- medir funil real;
- ajustar oferta e precificacao.

### Dias 61 a 90

- consolidar prova;
- repetir na Grande Florianopolis;
- iniciar Santa Catarina com base em case local;
- preparar o playbook nacional.

---

## 13. Riscos e mitigacoes

| Risco | Impacto | Mitigacao |
|---|---|---|
| Posicionamento como commodity | alto | vender confianca, ranking e intent, nao so orcamento |
| Falta de supply local | alto | atacar primeiro empresas-chave e criar prova social |
| Tracking fraco por cidade | medio | padronizar geo + brand + company no analytics |
| Media paga cedo demais | medio | priorizar SEO local e prova comercial |
| Expansion sem repeticao | alto | usar playbook e nao improvisacao por estado |

---

## 14. Suposicoes explicitas

Este plano assume que:

1. o cliente principal do produto e a empresa solar, mas a descoberta e feita pelo usuario final;
2. o maior diferencial do produto e confianca verificavel, nao apenas lead gen;
3. Florianopolis e o melhor beachhead por densidade economica e facilidade de prova;
4. Santa Catarina e o melhor primeiro estado para consolidar share of voice;
5. o Brasil so deve entrar em pauta depois que o modelo regional estiver repetivel.

---

## 15. Conclusao

Se eu tivesse que resumir em uma frase:

> **A melhor estrategia para o AvaliaSolar e usar Florianopolis como laboratorio de confianca, Santa Catarina como prova de escala e o Brasil como replicacao do playbook.**

O ganho nao vem de tentar falar com todo mundo. Vem de:

- vencer uma regiao;
- construir reputacao verificavel;
- transformar confianca em lead;
- transformar lead em recorrencia;
- transformar recorrencia em plataforma nacional.

---

## 16. Referencias

- IBGE - Florianopolis: https://www.ibge.gov.br/cidades-e-estados/sc/florianopolis.html
- IBGE - Santa Catarina: https://www.ibge.gov.br/cidades-e-estados/sc.html
- ANEEL - MMGD no Brasil em 2025: https://www.gov.br/aneel/pt-br/assuntos/noticias/2025/quatro-milhoes-de-familias-recebem-creditos-da-micro-e-minigeracao-distribuida-no-brasil
- ANEEL - Crescimento da MMGD em 2024: https://www.gov.br/aneel/pt-br/assuntos/noticias/2025/micro-e-minigeracao-distribuida-de-energia-eletrica-cresceu-8-84-gw-em-2024
- ABSOLAR / Economia SC - Santa Catarina ultrapassa 113 mil conexoes e 1,4 GW: https://economiasc.com/2025/04/29/sc-chega-a-mais-de-113-mil-conexoes-operacionais-de-energia-solar/
- ABSOLAR / RCN - Santa Catarina lidera geracao solar no Brasil: https://www.rcnonline.com.br/economia/2025/07/2430340-santa-catarina-lidera-a-geracao-de-energia-solar-no-brasil-estado-ultrapassa-14-gw-de-potencia-instalada-e-busca-solucoes-para-crescimento-sustentavel.html
- GTM Tag Matrix: `docs/analytics/GTM_TAG_MATRIX.md`
- Measurement Readiness Index: `docs/analytics/MEASUREMENT_READINESS_INDEX.md`
- Geo SEO page template: `AB0-1-front/app/solucoes/[slug]/page.tsx`
- URL structure doc: `AB0-1-front/docs/seo-companies-url-structure.md`

---

## 17. Brand Memory Audit inspired by the image

The image says a strong brand is not built by noise. It is built by clarity, distinction, repetition, memory and availability.

### 17.1 What the image is really teaching

1. Category first: know the market before trying to stand out.
2. Buyer second: know who actually buys and how they talk.
3. Problem third: solve a real job, not a vague desire.
4. Position fourth: own one meaning in the market.
5. Assets fifth: create recognizable cues people can spot fast.
6. Memory sixth: be remembered in buying moments.
7. Consistency seventh: repeat the same signals long enough to stick.
8. Availability eighth: be easy to find, easy to understand and easy to buy.

### 17.2 Application to AvaliaSolar

#### Step 1 - Category

AvaliaSolar should not be framed as a generic marketplace.

The right category is:

> **Trust as a Service for solar companies**

That means the brand must own the idea of:

- confianca;
- ranking verificavel;
- prova social;
- demanda qualificada;
- reputacao por regiao.

#### Step 2 - Buyer

AvaliaSolar has a two-sided reality, but the commercial buyer is not the same as the end user.

**Primary paying buyer**

- solar companies;
- integrators;
- EPCs;
- distributors;
- premium installers.

**Demand-side user**

- homeowners;
- businesses;
- condominium managers;
- procurement teams;
- people comparing options in a city.

The brand must speak to both, but the promise should be optimized for the paying buyer.

#### Step 3 - Problem

The brand should solve one clear job:

> help the buyer choose and be chosen with less risk and more trust

In practice, that means:

- reduce selection risk;
- improve local visibility;
- increase lead quality;
- make the brand easier to compare;
- turn reputation into revenue.

#### Step 4 - Position

The brand should be known for one thing first:

> **the most trusted solar company network by city**

Supporting claims:

- ranking;
- reviews;
- verified profile;
- trust score;
- regional visibility;
- faster path to qualified leads.

#### Step 5 - Assets

AvaliaSolar needs distinctive assets that repeat everywhere.

Recommended cues:

- trust score badge;
- verified seal;
- city page card;
- ranking card;
- review star block;
- local map pin treatment;
- CTA language tied to trust and city;
- consistent visual system for score, proof and ranking.

These cues must appear in:

- city pages;
- company profiles;
- dashboards;
- sales decks;
- outbound messages;
- ads;
- remarketing;
- social proof assets.

#### Step 6 - Memory

People remember brands when the same idea shows up at the moment they decide.

For AvaliaSolar, the memory moments are:

- search result for a city;
- comparison page;
- company profile;
- trust score card;
- WhatsApp CTA;
- review snippet;
- dashboard screenshot;
- remarketing ad.

Each of those surfaces should repeat the same mental shortcut:

> confianca primeiro, lead depois

#### Step 7 - Consistency

AvaliaSolar must avoid fragmenting its story across channels.

The same promise should repeat in:

- SEO;
- product pages;
- pricing;
- outbound;
- sales;
- support;
- dashboard;
- social proof.

The rule is simple:

> if a message cannot be repeated in three different surfaces, it is probably too vague

#### Step 8 - Availability

The brand must be easy to find and easy to buy.

For AvaliaSolar, availability means:

- city pages are indexed and canonical;
- category filters are simple;
- CTA is visible above the fold;
- WhatsApp and form are frictionless;
- Free / Starter / Pro are easy to understand;
- pilot entry is fast;
- onboarding is short;
- the buyer can start without a long procurement cycle.

### 17.3 What changes in the GTM after this image

After applying the framework, the GTM becomes:

- less about generic traffic;
- more about category ownership;
- less about broad awareness;
- more about memory at decision time;
- less about feature noise;
- more about distinctive trust cues;
- less about "orcamentos";
- more about trusted local choice.

### 17.4 Brand scorecard for AvaliaSolar

| Dimension | Target |
|---|---|
| Category clarity | high |
| Buyer clarity | high |
| Problem clarity | high |
| Position clarity | high |
| Distinctive assets | high |
| Memory at buying moment | high |
| Consistency over time | high |
| Availability / ease to buy | high |

### 17.5 Final brand rule

AvaliaSolar should be remembered as:

> **the trusted local solar choice that is easy to find, easy to compare and easy to buy**
