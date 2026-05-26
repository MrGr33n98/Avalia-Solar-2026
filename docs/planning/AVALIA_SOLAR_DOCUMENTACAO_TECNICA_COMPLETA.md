# AVALIASOLAR - DOCUMENTAÇÃO TÉCNICA COMPLETA

| Campo | Valor |
|---|---|
| Plataforma | www.avaliasolar.com.br |
| Produto | Marketplace de energia solar e mobilidade elétrica |
| Versão | 1.0.0 |
| Data | 2026-05-19 |
| Autor | Codex + Equipe AvaliaSolar |
| Status | Draft para revisão |
| Formato principal | Markdown com Mermaid.js |
| Público-alvo | Produto, engenharia, growth, atendimento, operações e stakeholders |

## Sumário Executivo

Este documento consolida, em um único arquivo, os principais diagramas enterprise da plataforma AvaliaSolar. Ele descreve a jornada dos clientes finais, a jornada das empresas, os processos de negócio, a arquitetura de sistemas, os fluxos de dados, APIs, integrações, infraestrutura, segurança, compliance LGPD, monitoramento e analytics.

A documentação usa Mermaid.js sempre que possível. Para BPMN 2.0, Mermaid não possui notação BPMN nativa; portanto, os processos foram modelados em `flowchart` com pools, lanes, eventos, tarefas e gateways nomeados com convenções BPMN. Para Sankey, foi usado `sankey-beta`, disponível em renderizadores Mermaid recentes.

## Índice Remissivo

- [0. Padrões Visuais e Convenções](#0-padrões-visuais-e-convenções)
- [1. Jornada do Usuário](#1-jornada-do-usuário-uxcx)
- [1.1 Customer Journey Map - Cliente Final](#11-customer-journey-map---cliente-final)
- [1.2 User Flow Diagram - Fluxo Principal](#12-user-flow-diagram---fluxo-principal)
- [1.3 Sankey Diagram - Analytics de Conversão](#13-sankey-diagram---analytics-de-conversão)
- [2. Processos de Negócio](#2-processos-de-negócio)
- [2.1 BPMN - Solicitação de Orçamento](#21-bpmn---processo-de-solicitação-de-orçamento)
- [2.2 BPMN - Onboarding de Empresas](#22-bpmn---onboarding-de-empresas)
- [2.3 Decision Tree - Matchmaking](#23-decision-tree---sistema-de-matchmaking)
- [2.4 State Diagram - Ciclo de Vida do Projeto](#24-state-diagram---ciclo-de-vida-do-projeto)
- [3. Arquitetura de Sistemas](#3-arquitetura-de-sistemas)
- [3.1 C4 Context](#31-c4-model---nível-1-contexto)
- [3.2 C4 Containers](#32-c4-model---nível-2-containers)
- [3.3 C4 Components](#33-c4-model---nível-3-components)
- [3.4 Sequence - Busca e Orçamento](#34-sequence-diagram---fluxo-de-busca-e-orçamento)
- [3.5 Sequence - Pagamento](#35-sequence-diagram---processo-de-pagamento)
- [4. Modelagem de Dados](#4-modelagem-de-dados)
- [4.1 ERD - Entidades Principais](#41-erd---entidades-principais)
- [4.2 DFD - Processo de Lead](#42-data-flow-diagram-dfd---processo-de-lead)
- [5. API e Integrações](#5-api-e-integrações)
- [5.1 API Flow - Endpoints Principais](#51-api-flow-diagram---endpoints-principais)
- [5.2 Integration Diagram - Serviços Externos](#52-integration-diagram---serviços-externos)
- [6. Infraestrutura e Deploy](#6-infraestrutura-e-deploy)
- [6.1 Infrastructure Diagram](#61-infrastructure-diagram---cloud-e-produção)
- [6.2 Deployment Pipeline](#62-deployment-pipeline---cicd)
- [7. Segurança e Compliance](#7-segurança-e-compliance)
- [7.1 Security Flow](#71-security-flow-diagram---autenticação-e-autorização)
- [7.2 Compliance LGPD](#72-compliance-flow---lgpd)
- [8. Monitoramento e Analytics](#8-monitoramento-e-analytics)
- [8.1 Analytics Dashboard](#81-analytics-dashboard---métricas-principais)
- [8.2 Alerting Flow](#82-alerting-flow---monitoramento-proativo)
- [Apêndices](#apêndice-a-glossário)

---

## 0. Padrões Visuais e Convenções

### 0.1 Paleta Padronizada

| Tipo | Cor | Uso |
|---|---:|---|
| Cliente | `#3498DB` | Pessoa física/jurídica buscando solução |
| Empresa | `#2ECC71` | Instaladores, fabricantes, bancos e provedores |
| Admin | `#9B59B6` | Backoffice, moderação e operação |
| Sistema/Plataforma | `#E74C3C` | AvaliaSolar e serviços internos |
| Externo/API | `#F39C12` | Gateways, APIs e provedores terceiros |
| Processo/Ação | `#ECF0F1` | Tarefas e processos gerais |
| Decisão | `#FADBD8` | Gateways, escolhas e validações |
| Dados/DB | `#D6EAF8` | Bancos, caches e dados persistidos |
| Documento | `#FCF3CF` | Arquivos, certificados, propostas |
| Conector | `#82E0AA` | Filas, eventos, integrações assíncronas |

### 0.2 Convenções de Nomenclatura

| Item | Convenção | Exemplo |
|---|---|---|
| IDs | `snake_case` | `user_id`, `company_id` |
| Entidades | `PascalCase` | `User`, `Company`, `Lead` |
| Endpoints | `kebab-case` + versão | `/api/v1/company-profiles` |
| Variáveis JS/TS | `camelCase` | `createdAt`, `updatedAt` |
| Estados | `UPPERCASE` | `PUBLISHED`, `PENDING`, `APPROVED` |
| Eventos analytics | `snake_case` | `quote_request_submitted` |

### 0.3 Legenda Mermaid Base

```mermaid
flowchart LR
  cliente["Cliente"]:::cliente
  empresa["Empresa"]:::empresa
  admin["Admin"]:::admin
  sistema["Sistema/Plataforma"]:::sistema
  externo["Externo/API"]:::externo
  processo["Processo/Ação"]:::processo
  decisao{"Decisão"}:::decisao
  dados[("Dados/DB")]:::dados
  documento[["Documento"]]:::documento
  conector(("Conector/Eventos")):::conector

  classDef cliente fill:#3498DB,stroke:#1F618D,color:#fff;
  classDef empresa fill:#2ECC71,stroke:#1D8348,color:#0B2E13;
  classDef admin fill:#9B59B6,stroke:#6C3483,color:#fff;
  classDef sistema fill:#E74C3C,stroke:#922B21,color:#fff;
  classDef externo fill:#F39C12,stroke:#B9770E,color:#111;
  classDef processo fill:#ECF0F1,stroke:#95A5A6,color:#17202A;
  classDef decisao fill:#FADBD8,stroke:#C0392B,color:#641E16;
  classDef dados fill:#D6EAF8,stroke:#2E86C1,color:#154360;
  classDef documento fill:#FCF3CF,stroke:#B7950B,color:#7D6608;
  classDef conector fill:#82E0AA,stroke:#229954,color:#0B2E13;
```

### 0.4 Símbolos por Notação

| Notação | Símbolos usados | Observação |
|---|---|---|
| BPMN-like | Evento inicial/final, tarefa, gateway, timer, message, error | Mermaid não renderiza BPMN 2.0 nativo; pools/lanes foram simulados com `subgraph` |
| UML Sequence | Participantes, mensagens síncronas, `alt`, `opt`, ativações | Usado para busca/orçamento e pagamento |
| State Machine | Estados, transições, final state | Usado no ciclo de vida do projeto |
| ERD | Entidades, atributos, cardinalidade Crow's Foot | Usado na modelagem de dados |
| C4 | Person, System, Container, Component, Rel | Pode exigir renderizador Mermaid com suporte C4 |

---

## 1. Jornada do Usuário (UX/CX)

### 1.1 Customer Journey Map - Cliente Final

Descrição textual: este mapa organiza a experiência do cliente por fase, conectando ações, pensamentos, emoções, touchpoints, dores, oportunidades e métricas. Ele contempla clientes residenciais, comerciais/industriais, rurais e usuários interessados em carregadores veiculares.

Referências cruzadas: o envio de orçamento desta jornada detalha-se em [2.1](#21-bpmn---processo-de-solicitação-de-orçamento), o matching em [2.3](#23-decision-tree---sistema-de-matchmaking) e o fluxo técnico em [3.4](#34-sequence-diagram---fluxo-de-busca-e-orçamento).

```mermaid
flowchart LR
  subgraph fases["Fases da jornada"]
    F1["Descoberta"]:::processo
    F2["Consideração"]:::processo
    F3["Decisão"]:::processo
    F4["Contratação"]:::processo
    F5["Pós-venda"]:::processo
    F6["Advocacy"]:::processo
  end

  subgraph acoes["Ações do usuário"]
    A1["Pesquisa no Google, anúncio, indicação ou blog"]:::cliente
    A2["Seleciona categoria e aplica filtros"]:::cliente
    A3["Abre perfis, lê reviews e compara empresas"]:::cliente
    A4["Solicita orçamento único ou múltiplo"]:::cliente
    A5["Acompanha propostas, negocia e contrata"]:::cliente
    A6["Avalia empresa e recomenda plataforma"]:::cliente
  end

  subgraph pensamentos["Pensamentos"]
    P1["Quanto posso economizar?"]:::documento
    P2["Quem atende minha região?"]:::documento
    P3["Essa empresa é confiável?"]:::documento
    P4["Preciso falar com várias empresas?"]:::documento
    P5["Preço, prazo e garantia fazem sentido?"]:::documento
    P6["Minha experiência ajuda outros compradores?"]:::documento
  end

  subgraph emocoes["Emoções"]
    E1["Curiosidade"]:::cliente
    E2["Interesse"]:::cliente
    E3["Confiança ou dúvida"]:::decisao
    E4["Ansiedade por resposta"]:::decisao
    E5["Alívio ou frustração"]:::decisao
    E6["Satisfação e pertencimento"]:::cliente
  end

  subgraph touchpoints["Touchpoints"]
    T1["SEO, Ads, blog, home"]:::externo
    T2["Busca, filtros, calculadora"]:::sistema
    T3["Perfil, reviews, selos, comparação"]:::sistema
    T4["Wizard, WhatsApp, email, conta"]:::sistema
    T5["Dashboard, propostas, notificações"]:::sistema
    T6["Review, suporte, monitoramento"]:::sistema
  end

  subgraph dores["Dores"]
    D1["Não entende ROI solar/VE"]:::decisao
    D2["Poucas empresas na região"]:::decisao
    D3["Informação incompleta nos perfis"]:::decisao
    D4["Cadastro longo ou dados técnicos difíceis"]:::decisao
    D5["Demora na proposta ou propostas incomparáveis"]:::decisao
    D6["Esquecimento de avaliar"]:::decisao
  end

  subgraph oportunidades["Oportunidades"]
    O1["Calculadora e guias por categoria"]:::conector
    O2["Empty state com ampliação de raio"]:::conector
    O3["Score explicável e badges verificáveis"]:::conector
    O4["Wizard progressivo e rascunho salvo"]:::conector
    O5["SLA visível, lembretes e proposta padronizada"]:::conector
    O6["Review no marco certo + incentivo leve"]:::conector
  end

  subgraph metricas["Métricas por fase"]
    M1["NPS baseline, bounce rate"]:::dados
    M2["Search success rate, CES busca"]:::dados
    M3["Profile view rate, CSAT perfil"]:::dados
    M4["Quote start/submitted, CES formulário"]:::dados
    M5["Hire conversion, response SLA"]:::dados
    M6["Review rate, NPS pós-venda"]:::dados
  end

  F1 --> F2 --> F3 --> F4 --> F5 --> F6
  A1 --> A2 --> A3 --> A4 --> A5 --> A6
  P1 --> P2 --> P3 --> P4 --> P5 --> P6
  E1 --> E2 --> E3 --> E4 --> E5 --> E6
  T1 --> T2 --> T3 --> T4 --> T5 --> T6
  D1 --> D2 --> D3 --> D4 --> D5 --> D6
  O1 --> O2 --> O3 --> O4 --> O5 --> O6
  M1 --> M2 --> M3 --> M4 --> M5 --> M6

  F1 -.-> A1
  F2 -.-> A2
  F3 -.-> A3
  F4 -.-> A4
  F5 -.-> A5
  F6 -.-> A6

  classDef cliente fill:#3498DB,stroke:#1F618D,color:#fff;
  classDef sistema fill:#E74C3C,stroke:#922B21,color:#fff;
  classDef externo fill:#F39C12,stroke:#B9770E,color:#111;
  classDef processo fill:#ECF0F1,stroke:#95A5A6,color:#17202A;
  classDef decisao fill:#FADBD8,stroke:#C0392B,color:#641E16;
  classDef documento fill:#FCF3CF,stroke:#B7950B,color:#7D6608;
  classDef conector fill:#82E0AA,stroke:#229954,color:#0B2E13;
  classDef dados fill:#D6EAF8,stroke:#2E86C1,color:#154360;
```

### 1.2 User Flow Diagram - Fluxo Principal

Descrição textual: o fluxo principal cobre entradas orgânicas, diretas, pagas e por conteúdo. Ele mapeia decisões críticas como login vs convidado, orçamento único vs múltiplo, continuar buscando vs escolher empresa e formulário completo vs parcial.

```mermaid
flowchart TD
  START((Entrada do usuário)):::cliente
  EP{Entry point?}:::decisao
  SEO["Busca orgânica Google"]:::externo
  DIRECT["Acesso direto"]:::externo
  REF["Indicação"]:::externo
  ADS["Google Ads / redes sociais"]:::externo
  BLOG["Blog / conteúdo educativo"]:::externo

  HOME["Home AvaliaSolar"]:::sistema
  INTENT{Intenção inicial?}:::decisao
  SEARCH["Busca por categoria e localização"]:::cliente
  CALC["Calculadora de economia"]:::cliente
  PROFILE_ENTRY["Acesso direto ao perfil da empresa"]:::cliente
  CONTENT["Consumo de guia comparativo"]:::cliente

  FILTERS["Aplicar filtros: cidade, estado, solução, score, selo"]:::cliente
  HAS_RESULTS{Há resultados?}:::decisao
  EMPTY["Sem resultado: ampliar raio, capturar demanda, suporte WhatsApp"]:::decisao
  LIST["Listagem ranqueada de empresas"]:::sistema
  CARD["Card de empresa: nota, cidade, selo, CTA"]:::sistema
  PROFILE["Perfil completo: cases, reviews, selos, CTAs"]:::sistema
  TRUST{Confiança suficiente?}:::decisao
  FAV["Salvar favorito"]:::cliente
  COMPARE_DECISION{Comparar empresas?}:::decisao
  COMPARE["Comparação 2-4 empresas"]:::cliente
  CONTINUE["Continuar pesquisando"]:::cliente

  QUOTE_DECISION{Solicitar orçamento?}:::decisao
  AUTH{Está autenticado?}:::decisao
  GATE["Gate de conta: email, Google, LinkedIn, Facebook"]:::sistema
  ACCOUNT_DECISION{Conta completa ou convidado?}:::decisao
  FULL_ACCOUNT["Conta completa: favoritos, histórico, projetos"]:::cliente
  GUEST["Convidado: contato + consentimento LGPD"]:::cliente
  FORM["Wizard de orçamento: categoria, imóvel, consumo, prazo, endereço"]:::cliente
  COMPLETE{Dados mínimos completos?}:::decisao
  DRAFT["Salvar rascunho + recuperação por email/WhatsApp"]:::conector
  SINGLE_MULTI{1 ou múltiplos orçamentos?}:::decisao
  SINGLE["Enviar para 1 empresa"]:::cliente
  MULTI["Enviar para múltiplas empresas"]:::cliente
  LEAD["Criar lead e projeto"]:::sistema
  MATCH["Matchmaking e distribuição"]:::sistema
  CONFIRM["Confirmação + dashboard do cliente"]:::cliente
  COMPANY_NOTIFY["Notificar empresas elegíveis"]:::empresa
  PROPOSALS["Receber propostas"]:::cliente
  HIRE_DECISION{Contratar?}:::decisao
  HIRE["Contrato fechado"]:::cliente
  ABANDON["Abandono: preço, timing, confiança ou demora"]:::decisao
  RECOVERY["Recuperação: novo matching, financiamento, consultoria"]:::conector
  REVIEW_DECISION{Avaliar empresa?}:::decisao
  REVIEW["Review público + score atualizado"]:::cliente
  END((Retenção / advocacy)):::cliente

  START --> EP
  EP --> SEO --> HOME
  EP --> DIRECT --> HOME
  EP --> REF --> HOME
  EP --> ADS --> HOME
  EP --> BLOG --> CONTENT
  CONTENT --> HOME

  HOME --> INTENT
  INTENT -- "buscar" --> SEARCH
  INTENT -- "calcular" --> CALC
  INTENT -- "perfil" --> PROFILE_ENTRY
  INTENT -- "educar" --> CONTENT
  CALC --> FORM
  PROFILE_ENTRY --> PROFILE
  SEARCH --> FILTERS --> HAS_RESULTS
  HAS_RESULTS -- "sim" --> LIST --> CARD --> PROFILE
  HAS_RESULTS -- "não" --> EMPTY --> SEARCH
  PROFILE --> TRUST
  TRUST -- "sim" --> QUOTE_DECISION
  TRUST -- "não" --> FAV --> COMPARE_DECISION
  COMPARE_DECISION -- "sim" --> COMPARE --> QUOTE_DECISION
  COMPARE_DECISION -- "não" --> CONTINUE --> SEARCH
  QUOTE_DECISION -- "sim" --> AUTH
  QUOTE_DECISION -- "não" --> FAV
  AUTH -- "sim" --> FORM
  AUTH -- "não" --> GATE --> ACCOUNT_DECISION
  ACCOUNT_DECISION -- "conta" --> FULL_ACCOUNT --> FORM
  ACCOUNT_DECISION -- "convidado" --> GUEST --> FORM
  FORM --> COMPLETE
  COMPLETE -- "sim" --> SINGLE_MULTI
  COMPLETE -- "não" --> DRAFT --> FORM
  SINGLE_MULTI -- "1 empresa" --> SINGLE --> LEAD
  SINGLE_MULTI -- "múltiplas" --> MULTI --> LEAD
  LEAD --> MATCH --> CONFIRM
  MATCH --> COMPANY_NOTIFY
  COMPANY_NOTIFY --> PROPOSALS
  CONFIRM --> PROPOSALS --> HIRE_DECISION
  HIRE_DECISION -- "sim" --> HIRE --> REVIEW_DECISION
  HIRE_DECISION -- "não" --> ABANDON --> RECOVERY --> SEARCH
  REVIEW_DECISION -- "sim" --> REVIEW --> END
  REVIEW_DECISION -- "não" --> END

  classDef cliente fill:#3498DB,stroke:#1F618D,color:#fff;
  classDef empresa fill:#2ECC71,stroke:#1D8348,color:#0B2E13;
  classDef sistema fill:#E74C3C,stroke:#922B21,color:#fff;
  classDef externo fill:#F39C12,stroke:#B9770E,color:#111;
  classDef decisao fill:#FADBD8,stroke:#C0392B,color:#641E16;
  classDef conector fill:#82E0AA,stroke:#229954,color:#0B2E13;
```

### 1.3 Sankey Diagram - Analytics de Conversão

Descrição textual: este Sankey usa volumes ilustrativos para orientar o desenho do funil. Os valores devem ser substituídos por dados reais do PostHog/GA4/analytics interno. Ele diferencia caminhos diretos e indiretos, além de abandono por etapa.

```mermaid
sankey-beta
  Página inicial,Busca/filtros,620
  Página inicial,Calculadora,180
  Página inicial,Blog/conteúdo,120
  Página inicial,Rejeição home,80
  Blog/conteúdo,Busca/filtros,70
  Blog/conteúdo,Calculadora,35
  Blog/conteúdo,Abandono conteúdo,15
  Calculadora,Formulário orçamento,115
  Calculadora,Abandono calculadora,100
  Busca/filtros,Perfil de empresa,420
  Busca/filtros,Abandono busca,270
  Perfil de empresa,Comparação,145
  Perfil de empresa,Formulário orçamento,160
  Perfil de empresa,Abandono perfil,185
  Comparação,Formulário orçamento,95
  Comparação,Continuar buscando,35
  Comparação,Abandono comparação,15
  Formulário orçamento,Confirmação,245
  Formulário orçamento,Abandono formulário,125
  Confirmação,Propostas recebidas,210
  Confirmação,Sem resposta empresa,35
  Propostas recebidas,Contratação,58
  Propostas recebidas,Abandono decisão,152
  Contratação,Avaliação pós-serviço,24
  Contratação,Sem avaliação,34
```

---

## 2. Processos de Negócio

### 2.1 BPMN - Processo de Solicitação de Orçamento

Descrição textual: processo completo de geração e tratamento de lead, com pools para cliente, plataforma, empresa e eventos de erro/timer. Os gateways representam decisões binárias ou múltiplas. O fluxo de dados relacionado está em [4.2](#42-data-flow-diagram-dfd---processo-de-lead).

```mermaid
flowchart LR
  subgraph pool_cliente["Pool Cliente"]
    C_START((Start: acessa plataforma)):::cliente
    C_BUSCA["Task: buscar solução"]:::cliente
    C_EMPRESAS["Task: visualizar empresas"]:::cliente
    C_FORM["Task: preencher formulário"]:::cliente
    C_ENVIA["Message: enviar solicitação"]:::cliente
    C_RECEBE["Message: receber propostas"]:::cliente
    C_DECIDE{Gateway: proposta aceita?}:::decisao
    C_CONTRATA["Task: contratar"]:::cliente
    C_ABANDONA["End: abandono/retorno futuro"]:::decisao
  end

  subgraph pool_plataforma["Pool Plataforma AvaliaSolar"]
    P_VALIDA["Task: validar dados"]:::sistema
    P_VALIDO{Gateway: lead qualificado?}:::decisao
    P_ENRIQUECE["Task: enriquecer com geo/categoria"]:::sistema
    P_MATCH["Task: executar matchmaking"]:::sistema
    P_EMPRESA{Gateway: empresa disponível?}:::decisao
    P_DISTRIBUI["Task: distribuir lead"]:::sistema
    P_NOTIFICA["Message: notificar partes"]:::conector
    P_TIMER(("Timer: timeout resposta")):::conector
    P_FOLLOW["Task: follow-up e redistribuição"]:::sistema
    P_MEDIA["Task: mediação/suporte"]:::sistema
    P_ERROR(("Error: falha envio/notificação")):::decisao
  end

  subgraph pool_empresa["Pool Empresa"]
    E_RECEBE["Message: receber notificação"]:::empresa
    E_QUALIFICA["Task: qualificar lead"]:::empresa
    E_QUALIFICADO{Gateway: atende critérios?}:::decisao
    E_PREPARA["Task: preparar proposta"]:::empresa
    E_ENVIA["Message: enviar orçamento"]:::empresa
    E_NEGOCIA["Task: negociar"]:::empresa
    E_FECHA{Gateway: fechamento?}:::decisao
    E_GANHO["End: ganho"]:::empresa
    E_PERDIDO["End: perdido"]:::decisao
  end

  C_START --> C_BUSCA --> C_EMPRESAS --> C_FORM --> C_ENVIA
  C_ENVIA --> P_VALIDA --> P_VALIDO
  P_VALIDO -- "não" --> P_MEDIA --> C_FORM
  P_VALIDO -- "sim" --> P_ENRIQUECE --> P_MATCH --> P_EMPRESA
  P_EMPRESA -- "não" --> P_FOLLOW --> P_MATCH
  P_EMPRESA -- "sim" --> P_DISTRIBUI --> P_NOTIFICA
  P_NOTIFICA --> E_RECEBE
  P_NOTIFICA --> C_RECEBE
  E_RECEBE --> E_QUALIFICA --> E_QUALIFICADO
  E_QUALIFICADO -- "não" --> E_PERDIDO --> P_FOLLOW
  E_QUALIFICADO -- "sim" --> E_PREPARA --> E_ENVIA --> C_RECEBE
  E_ENVIA --> E_NEGOCIA
  C_RECEBE --> C_DECIDE
  C_DECIDE -- "sim" --> C_CONTRATA --> E_FECHA
  C_DECIDE -- "não" --> C_ABANDONA
  E_FECHA -- "sim" --> E_GANHO
  E_FECHA -- "não" --> E_PERDIDO
  P_TIMER --> P_FOLLOW
  P_ERROR --> P_NOTIFICA

  classDef cliente fill:#3498DB,stroke:#1F618D,color:#fff;
  classDef empresa fill:#2ECC71,stroke:#1D8348,color:#0B2E13;
  classDef sistema fill:#E74C3C,stroke:#922B21,color:#fff;
  classDef decisao fill:#FADBD8,stroke:#C0392B,color:#641E16;
  classDef conector fill:#82E0AA,stroke:#229954,color:#0B2E13;
```

### 2.2 BPMN - Onboarding de Empresas

Descrição textual: processo de cadastro, validação e ativação das empresas prestadoras. O fluxo contempla reivindicação de perfil existente, pendências documentais, aprovação/rejeição, configuração de perfil e treinamento.

```mermaid
flowchart TD
  subgraph empresa["Pool Empresa"]
    E_START((Start: solicitar cadastro)):::empresa
    E_DADOS["Task: preencher dados cadastrais"]:::empresa
    E_EXISTE{Gateway: empresa já existe?}:::decisao
    E_REIVINDICA["Task: reivindicar perfil existente"]:::empresa
    E_NOVO["Task: criar perfil pendente"]:::empresa
    E_DOCS["Task: upload documentos e certificações"]:::empresa
    E_CATS["Task: definir categorias e área de atendimento"]:::empresa
    E_PERFIL["Task: configurar perfil, portfólio, CTAs"]:::empresa
    E_COMPLETO{Gateway: perfil completo?}:::decisao
    E_PEND["Task: corrigir pendências"]:::empresa
    E_TREINO["Subprocesso: treinamento/onboarding"]:::empresa
    E_ATIVO((End: empresa ativa)):::empresa
  end

  subgraph admin["Pool Admin AvaliaSolar"]
    A_FILA["Task: receber solicitação"]:::admin
    A_DOCS["Task: verificar documentos"]:::admin
    A_CERT["Task: validar certificações"]:::admin
    A_REP["Task: análise reputação/crédito"]:::admin
    A_DECIDE{Gateway: aprovar?}:::decisao
    A_APROVA["Task: aprovar, plano e selos"]:::admin
    A_REJEITA["Task: rejeitar com motivo"]:::admin
  end

  subgraph sistema["Pool Sistema"]
    S_EMAIL["Message: email de status"]:::conector
    S_CHECK["Task: checklist automático"]:::sistema
    S_LIVE["Task: publicar no marketplace"]:::sistema
    S_ANALYTICS["Task: registrar eventos onboarding"]:::dados
  end

  E_START --> E_DADOS --> E_EXISTE
  E_EXISTE -- "sim" --> E_REIVINDICA --> A_FILA
  E_EXISTE -- "não" --> E_NOVO --> E_DOCS
  E_DOCS --> E_CATS --> E_PERFIL --> E_COMPLETO
  E_COMPLETO -- "não" --> S_CHECK --> E_PEND --> E_PERFIL
  E_COMPLETO -- "sim" --> A_FILA
  A_FILA --> A_DOCS --> A_CERT --> A_REP --> A_DECIDE
  A_DECIDE -- "não" --> A_REJEITA --> S_EMAIL --> E_PEND
  A_DECIDE -- "sim" --> A_APROVA --> E_TREINO --> S_LIVE --> E_ATIVO
  S_LIVE --> S_ANALYTICS

  classDef empresa fill:#2ECC71,stroke:#1D8348,color:#0B2E13;
  classDef admin fill:#9B59B6,stroke:#6C3483,color:#fff;
  classDef sistema fill:#E74C3C,stroke:#922B21,color:#fff;
  classDef decisao fill:#FADBD8,stroke:#C0392B,color:#641E16;
  classDef conector fill:#82E0AA,stroke:#229954,color:#0B2E13;
  classDef dados fill:#D6EAF8,stroke:#2E86C1,color:#154360;
```

### 2.3 Decision Tree - Sistema de Matchmaking

Descrição textual: árvore de decisão para selecionar empresas elegíveis e ranquear matches por proximidade, categoria, reputação, disponibilidade, plano e resposta histórica.

```mermaid
flowchart TD
  ROOT{Lead recebido}:::decisao
  GEO{Localização dentro da área de atendimento?}:::decisao
  NO_GEO["Excluir: fora de área"]:::decisao
  CAT{Categoria compatível?}:::decisao
  NO_CAT["Excluir: categoria divergente"]:::decisao
  SOL{Tipo de solução compatível?}:::decisao
  NO_SOL["Excluir: solar/VE/bateria não compatível"]:::decisao
  TECH{Capacidade técnica suficiente?}:::decisao
  NO_TECH["Excluir ou enviar para fila consultiva"]:::decisao
  SCORE{Score/reputação acima do mínimo?}:::decisao
  NO_SCORE["Excluir temporariamente / pedir melhoria de perfil"]:::decisao
  DISP{Empresa disponível e SLA ativo?}:::decisao
  NO_DISP["Excluir neste ciclo / reduzir prioridade"]:::decisao
  PLAN{Plano permite receber este tipo de lead?}:::decisao
  NO_PLAN["Não distribuir / sugerir upgrade"]:::decisao
  MULTI{Há múltiplos matches?}:::decisao
  RANK["Ranking ponderado: score + proximidade + resposta + plano"]:::sistema
  TOP3["Selecionar top 3 ou regra de exclusividade"]:::sistema
  SINGLE["Match único"]:::sistema
  DIST["Distribuir lead e notificar"]:::conector
  FALLBACK{Sem match?}:::decisao
  RECOVERY["Ampliar raio, capturar demanda ou atendimento humano"]:::cliente

  ROOT --> GEO
  GEO -- "não" --> NO_GEO --> FALLBACK
  GEO -- "sim" --> CAT
  CAT -- "não" --> NO_CAT --> FALLBACK
  CAT -- "sim" --> SOL
  SOL -- "não" --> NO_SOL --> FALLBACK
  SOL -- "sim" --> TECH
  TECH -- "não" --> NO_TECH --> FALLBACK
  TECH -- "sim" --> SCORE
  SCORE -- "não" --> NO_SCORE --> FALLBACK
  SCORE -- "sim" --> DISP
  DISP -- "não" --> NO_DISP --> FALLBACK
  DISP -- "sim" --> PLAN
  PLAN -- "não" --> NO_PLAN --> FALLBACK
  PLAN -- "sim" --> MULTI
  MULTI -- "sim" --> RANK --> TOP3 --> DIST
  MULTI -- "não" --> SINGLE --> DIST
  FALLBACK -- "sim" --> RECOVERY
  FALLBACK -- "não" --> DIST

  classDef cliente fill:#3498DB,stroke:#1F618D,color:#fff;
  classDef sistema fill:#E74C3C,stroke:#922B21,color:#fff;
  classDef decisao fill:#FADBD8,stroke:#C0392B,color:#641E16;
  classDef conector fill:#82E0AA,stroke:#229954,color:#0B2E13;
```

### 2.4 State Diagram - Ciclo de Vida do Projeto

Descrição textual: estados de um projeto/orçamento desde rascunho até conclusão, cancelamento ou abandono. O modelo também cobre timeout e reabertura.

```mermaid
stateDiagram-v2
  [*] --> RASCUNHO: cliente inicia wizard
  RASCUNHO --> PUBLICADO: cliente envia solicitação
  RASCUNHO --> ABANDONADO: timeout ou saída
  ABANDONADO --> RASCUNHO: recuperação por email/WhatsApp
  PUBLICADO --> EM_ANALISE: empresas recebem lead
  EM_ANALISE --> PROPOSTAS_RECEBIDAS: empresa envia proposta
  EM_ANALISE --> CANCELADO: sem empresa elegível ou lead inválido
  PROPOSTAS_RECEBIDAS --> EM_NEGOCIACAO: cliente seleciona proposta
  PROPOSTAS_RECEBIDAS --> ABANDONADO: cliente não responde
  EM_NEGOCIACAO --> CONTRATO_FECHADO: aceite comercial
  EM_NEGOCIACAO --> PROPOSTAS_RECEBIDAS: cliente pede ajustes
  EM_NEGOCIACAO --> CANCELADO: negociação perdida
  CONTRATO_FECHADO --> EM_EXECUCAO: início do serviço/obra
  EM_EXECUCAO --> CONCLUIDO: entrega final
  EM_EXECUCAO --> CANCELADO: cancelamento operacional
  CONCLUIDO --> AVALIADO: cliente envia review
  CONCLUIDO --> [*]: sem avaliação
  AVALIADO --> [*]
  CANCELADO --> [*]
```

---

## 3. Arquitetura de Sistemas

### 3.1 C4 Model - Nível 1: Contexto

Descrição textual: visão macro da plataforma e atores externos. A arquitetura reflete o contexto atual do repositório: frontend Next.js, backend Rails/API, ActiveAdmin, Sidekiq, PostgreSQL, Redis e integrações de analytics/notificações/pagamento.

```mermaid
C4Context
title AvaliaSolar - C4 Nível 1 - Contexto

Person(cliente, "Cliente", "Pessoa física ou jurídica buscando energia solar, VE, baterias ou financiamento")
Person(empresa, "Empresa", "Instalador, fabricante, banco, integrador ou provedor de solução")
Person(admin, "Administrador", "Equipe de operação, moderação e suporte")

System(platform, "AvaliaSolar Platform", "Marketplace, busca, reviews, leads, dashboards e backoffice")
System_Ext(payment, "Gateway de Pagamento", "Stripe/Pagar.me ou provedor equivalente")
System_Ext(email, "Email/SMS/WhatsApp", "Serviços transacionais e notificações")
System_Ext(analytics, "Analytics", "PostHog, GA4, eventos internos")
System_Ext(geo, "APIs de CEP/Geolocalização", "Endereço, coordenadas e distância")
System_Ext(doccheck, "Verificação de documentos", "CNPJ, certificações e reputação")

Rel(cliente, platform, "Busca empresas, compara, solicita orçamento, avalia")
Rel(empresa, platform, "Gerencia perfil, recebe leads, envia propostas")
Rel(admin, platform, "Aprova empresas, modera reviews, configura planos")
Rel(platform, payment, "Processa pagamentos e recebe webhooks")
Rel(platform, email, "Dispara notificações e confirmações")
Rel(platform, analytics, "Envia eventos e métricas")
Rel(platform, geo, "Consulta CEP, cidade, raio e distância")
Rel(platform, doccheck, "Valida documentos e certificações")
```

### 3.2 C4 Model - Nível 2: Containers

Descrição textual: containers principais da plataforma. Onde a solicitação menciona serviços como API Gateway, Search Service e Lead Service, eles são representados como módulos/containers lógicos dentro do backend Rails/API, alinhados à implementação atual.

```mermaid
C4Container
title AvaliaSolar - C4 Nível 2 - Containers

Person(cliente, "Cliente", "Usuário comprador")
Person(empresa, "Empresa", "Prestador ou fornecedor")
Person(admin, "Admin", "Backoffice")

System_Boundary(as, "AvaliaSolar Platform") {
  Container(web, "Web App", "Next.js/React", "Home, busca, perfis, comparação, formulários e dashboards")
  Container(api, "Backend API", "Ruby on Rails", "Autenticação, empresas, leads, reviews, planos, analytics")
  Container(adminapp, "ActiveAdmin", "Rails/Admin", "Backoffice operacional e moderação")
  Container(worker, "Workers", "Sidekiq", "Jobs assíncronos, emails, analytics, digest, notificações")
  ContainerDb(db, "PostgreSQL", "RDBMS", "Dados principais, leads, reviews, analytics_events, platform_events")
  ContainerDb(redis, "Redis", "Cache/Queue", "Cache, sessões, Sidekiq e locks")
  Container(storage, "File Storage", "S3/ActiveStorage", "Logos, banners, documentos, portfólio")
}

System_Ext(email, "Email/WhatsApp/SMS", "SendGrid/SES/Twilio/Z-API")
System_Ext(payment, "Pagamento", "Stripe/Pagar.me")
System_Ext(analytics, "Analytics", "PostHog/GA4")
System_Ext(cdn, "CDN/WAF", "Cloudflare")

Rel(cliente, cdn, "Acessa site")
Rel(cdn, web, "Entrega frontend")
Rel(web, api, "REST/JSON, cookies/JWT")
Rel(empresa, web, "Dashboard empresa")
Rel(admin, adminapp, "Backoffice")
Rel(api, db, "SQL")
Rel(api, redis, "Cache/queue")
Rel(api, storage, "Uploads/downloads")
Rel(api, worker, "Enfileira jobs")
Rel(worker, db, "Processa dados")
Rel(worker, email, "Envia notificações")
Rel(api, payment, "Checkout/webhooks")
Rel(api, analytics, "Eventos")
Rel(web, analytics, "Client-side tracking")
```

### 3.3 C4 Model - Nível 3: Components

#### 3.3.1 Components - Search Service

```mermaid
C4Component
title AvaliaSolar - C4 Nível 3 - Componentes de Busca

Container_Boundary(search, "Search Service / Módulo de Busca") {
  Component(query_parser, "Query Parser", "Ruby/SQL", "Normaliza termos, slug, categoria e intenção")
  Component(filter_engine, "Filter Engine", "Rails scopes", "Aplica filtros de localização, categoria, plano e status")
  Component(ranking, "Ranking Algorithm", "Service Object", "Ordena por score, reputação, proximidade e destaque")
  Component(geo, "Geo Location Service", "Service Object", "Calcula cidade, estado, raio e distância")
  Component(index_manager, "Index Manager", "DB/Search", "Mantém índices, cache e eventual full-text search")
}

ContainerDb(db, "PostgreSQL", "Empresas, categorias, reviews")
ContainerDb(redis, "Redis", "Cache de queries")
Container(api, "Backend API", "Rails")
Container(web, "Web App", "Next.js")

Rel(web, api, "GET /api/v1/companies")
Rel(api, query_parser, "parse params")
Rel(query_parser, filter_engine, "filtros normalizados")
Rel(filter_engine, geo, "filtro geográfico")
Rel(filter_engine, ranking, "candidatas")
Rel(ranking, index_manager, "cache/index")
Rel(index_manager, db, "consulta")
Rel(index_manager, redis, "cache")
```

#### 3.3.2 Components - Lead Service

```mermaid
C4Component
title AvaliaSolar - C4 Nível 3 - Componentes de Lead

Container_Boundary(lead, "Lead Service / Módulo de Orçamentos") {
  Component(validator, "Lead Validator", "Rails model/service", "Valida dados mínimos, contato, LGPD e categoria")
  Component(enricher, "Lead Enricher", "Service Object", "Geolocalização, categoria, ticket e intenção")
  Component(matching, "Matching Algorithm", "Service Object", "Seleciona empresas elegíveis")
  Component(distribution, "Distribution Engine", "Service Object", "Distribui por ranking, plano e disponibilidade")
  Component(proposal, "Proposal Manager", "Model/Service", "Controla propostas e status")
  Component(trigger, "Notification Trigger", "Sidekiq job", "Dispara email, WhatsApp e alertas")
}

ContainerDb(db, "PostgreSQL", "Leads, empresas, propostas")
Container(queue, "Sidekiq/Redis", "Fila assíncrona")
System_Ext(email, "Email/WhatsApp", "Notificações")

Rel(validator, enricher, "lead validado")
Rel(enricher, matching, "lead qualificado")
Rel(matching, distribution, "empresas elegíveis")
Rel(distribution, proposal, "cria oportunidades")
Rel(distribution, trigger, "notificar")
Rel(trigger, queue, "enqueue")
Rel(queue, email, "deliver")
Rel(proposal, db, "persistir")
```

### 3.4 Sequence Diagram - Fluxo de Busca e Orçamento

Descrição textual: sequência principal quando um cliente busca empresas, seleciona uma ou mais e solicita orçamento.

```mermaid
sequenceDiagram
  autonumber
  actor Cliente
  participant Frontend as Frontend Next.js
  participant API as Backend API Rails
  participant Auth as Auth/JWT
  participant Search as Search Module
  participant Company as Company Module
  participant Lead as Lead Module
  participant Notify as Notification Service
  participant DB as PostgreSQL
  participant Email as Email/WhatsApp

  Cliente->>Frontend: Acessa página de busca
  Frontend-->>Cliente: Renderiza interface
  Cliente->>Frontend: Aplica filtros
  Frontend->>API: GET /api/v1/companies?filters
  API->>Auth: Validar sessão/token se existir
  Auth->>DB: Consultar usuário/sessão
  DB-->>Auth: Usuário válido ou anônimo
  API->>Search: Query com filtros
  Search->>DB: Buscar empresas e categorias
  DB-->>Search: Empresas candidatas
  Search->>Company: Enriquecer dados, score, selos
  Company->>DB: Consultar reviews, planos, badges
  DB-->>Company: Dados enriquecidos
  Company-->>Search: Resultado enriquecido
  Search-->>API: JSON resultados
  API-->>Frontend: 200 OK resultados
  Frontend-->>Cliente: Renderiza lista
  Cliente->>Frontend: Seleciona empresa/comparação
  Cliente->>Frontend: Preenche formulário orçamento
  Frontend->>API: POST /api/v1/leads
  API->>Auth: Exigir login ou validar convidado
  API->>Lead: Criar lead
  Lead->>DB: Salvar lead/projeto
  DB-->>Lead: Lead criado
  Lead->>Notify: Disparar notificações
  Notify->>Email: Email/WhatsApp para empresa
  Notify->>Email: Confirmação para cliente
  Lead-->>API: Lead criado
  API-->>Frontend: 201 Created
  Frontend-->>Cliente: Tela de confirmação
```

### 3.5 Sequence Diagram - Processo de Pagamento

Descrição textual: fluxo para assinatura, destaque premium ou serviço pago por empresa. O pagamento final de instalação pode ocorrer fora da plataforma, mas o modelo suporta gateway e webhooks.

```mermaid
sequenceDiagram
  autonumber
  actor Empresa
  participant Frontend as Frontend Next.js
  participant API as Backend API
  participant Payment as Payment Service
  participant Gateway as Stripe/Pagar.me
  participant DB as PostgreSQL
  participant Notify as Notification Service

  Empresa->>Frontend: Escolhe plano/destaque
  Frontend->>API: POST /api/v1/payments
  API->>Payment: Criar intenção de pagamento
  Payment->>DB: Registrar Payment=PENDING
  Payment->>Gateway: Init checkout/payment intent
  Gateway-->>Payment: checkout_url/client_secret
  Payment-->>API: Dados de checkout
  API-->>Frontend: 200 OK
  Frontend-->>Empresa: Redireciona/abre checkout
  Empresa->>Gateway: Finaliza pagamento
  Gateway-->>API: Webhook payment_succeeded/payment_failed
  API->>Payment: Validar assinatura HMAC
  alt pagamento aprovado
    Payment->>DB: Payment=PAID, Subscription=ACTIVE
    Payment->>Notify: Enviar confirmação
    Notify-->>Empresa: Email/WhatsApp sucesso
  else pagamento recusado
    Payment->>DB: Payment=FAILED
    Payment->>Notify: Enviar instrução de retry
    Notify-->>Empresa: Falha no pagamento
  end
```

---

## 4. Modelagem de Dados

### 4.1 ERD - Entidades Principais

Descrição textual: modelo conceitual principal. Alguns nomes podem ser adaptados aos modelos reais do backend, mas a estrutura representa o domínio funcional da plataforma.

```mermaid
erDiagram
  USER {
    bigint id PK
    string email
    string password_hash
    string role
    datetime created_at
    datetime updated_at
  }

  CUSTOMER {
    bigint id PK
    bigint user_id FK
    string name
    string phone
    string cpf_cnpj
    date birth_date
  }

  COMPANY {
    bigint id PK
    bigint user_id FK
    string business_name
    string trade_name
    string cnpj
    string phone
    string email
    text description
    string logo
    string cover_image
    decimal score
    boolean is_verified
    boolean is_premium
    datetime created_at
  }

  CATEGORY {
    bigint id PK
    string name
    string slug
    text description
    string icon
  }

  COMPANY_CATEGORY {
    bigint company_id FK
    bigint category_id FK
  }

  ADDRESS {
    bigint id PK
    string street
    string number
    string complement
    string neighborhood
    string city
    string state
    string zip_code
    decimal latitude
    decimal longitude
  }

  COMPANY_ADDRESS {
    bigint company_id FK
    bigint address_id FK
    boolean is_primary
  }

  SERVICE_AREA {
    bigint id PK
    bigint company_id FK
    string city
    string state
    integer radius_km
  }

  LEAD {
    bigint id PK
    bigint customer_id FK
    bigint category_id FK
    text description
    decimal budget
    date deadline
    string status
    datetime created_at
    datetime updated_at
  }

  LEAD_ADDRESS {
    bigint lead_id FK
    bigint address_id FK
  }

  PROPOSAL {
    bigint id PK
    bigint lead_id FK
    bigint company_id FK
    text message
    decimal price
    integer deadline_execution
    integer validity_days
    string status
    datetime sent_at
    datetime viewed_at
  }

  REVIEW {
    bigint id PK
    bigint customer_id FK
    bigint company_id FK
    bigint lead_id FK
    integer rating
    text comment
    boolean is_approved
    datetime created_at
  }

  FAVORITE {
    bigint customer_id FK
    bigint company_id FK
    datetime created_at
  }

  CERTIFICATE {
    bigint id PK
    bigint company_id FK
    string name
    string number
    string issuer
    date issue_date
    date expiry_date
    string file_url
    boolean is_verified
  }

  PORTFOLIO {
    bigint id PK
    bigint company_id FK
    string title
    text description
    string images
    date completed_at
  }

  NOTIFICATION {
    bigint id PK
    bigint user_id FK
    string type
    string title
    text message
    boolean is_read
    datetime created_at
  }

  PAYMENT {
    bigint id PK
    bigint user_id FK
    string type
    decimal amount
    string status
    string gateway
    string transaction_id
    datetime paid_at
  }

  SUBSCRIPTION {
    bigint id PK
    bigint company_id FK
    string plan
    string status
    date start_date
    date end_date
    boolean auto_renew
  }

  USER ||--o| CUSTOMER : possui
  USER ||--o| COMPANY : administra
  COMPANY ||--o{ COMPANY_CATEGORY : possui
  CATEGORY ||--o{ COMPANY_CATEGORY : classifica
  COMPANY ||--o{ COMPANY_ADDRESS : possui
  ADDRESS ||--o{ COMPANY_ADDRESS : referencia
  COMPANY ||--o{ SERVICE_AREA : atende
  CUSTOMER ||--o{ LEAD : cria
  CATEGORY ||--o{ LEAD : categoriza
  LEAD ||--o| LEAD_ADDRESS : localiza
  ADDRESS ||--o| LEAD_ADDRESS : referencia
  LEAD ||--o{ PROPOSAL : recebe
  COMPANY ||--o{ PROPOSAL : envia
  CUSTOMER ||--o{ REVIEW : escreve
  COMPANY ||--o{ REVIEW : recebe
  LEAD ||--o{ REVIEW : origina
  CUSTOMER ||--o{ FAVORITE : salva
  COMPANY ||--o{ FAVORITE : favoritada
  COMPANY ||--o{ CERTIFICATE : comprova
  COMPANY ||--o{ PORTFOLIO : exibe
  USER ||--o{ NOTIFICATION : recebe
  USER ||--o{ PAYMENT : realiza
  COMPANY ||--o{ SUBSCRIPTION : assina
```

### 4.2 Data Flow Diagram (DFD) - Processo de Lead

Descrição textual: fluxo de dados da captura ao matching e notificações.

```mermaid
flowchart LR
  E1["E1 Cliente"]:::cliente
  E2["E2 Empresa"]:::empresa
  E3["E3 Email Service"]:::externo
  E4["E4 SMS/WhatsApp Service"]:::externo
  E5["E5 Analytics Platform"]:::externo

  P1["P1 Capturar dados lead"]:::sistema
  P2["P2 Validar informações"]:::sistema
  P3["P3 Enriquecer dados: geo/categoria"]:::sistema
  P4["P4 Matching com empresas"]:::sistema
  P5["P5 Distribuir leads"]:::sistema
  P6["P6 Notificar partes"]:::sistema
  P7["P7 Armazenar analytics"]:::sistema

  D1[("D1 Leads DB")]:::dados
  D2[("D2 Companies DB")]:::dados
  D3[("D3 Categories DB")]:::dados
  D4[("D4 Analytics DB")]:::dados

  E1 -- "dados formulário" --> P1
  P1 -- "lead bruto" --> P2
  P2 -- "lead validado" --> P3
  P3 -- "lead enriquecido" --> D1
  P3 -- "categoria" --> D3
  P3 -- "lead qualificado" --> P4
  P4 -- "query empresas" --> D2
  D2 -- "empresas match" --> P4
  P4 -- "matches ranqueados" --> P5
  P5 -- "notificação lead" --> E2
  P5 -- "dados notificação" --> P6
  P6 -- "email confirmação" --> E1
  P6 -- "email transacional" --> E3
  P6 -- "WhatsApp/SMS" --> E4
  P1 -- "evento lead_started" --> P7
  P5 -- "evento lead_distributed" --> P7
  P7 -- "eventos tracking" --> D4
  P7 -- "eventos produto" --> E5

  classDef cliente fill:#3498DB,stroke:#1F618D,color:#fff;
  classDef empresa fill:#2ECC71,stroke:#1D8348,color:#0B2E13;
  classDef sistema fill:#E74C3C,stroke:#922B21,color:#fff;
  classDef externo fill:#F39C12,stroke:#B9770E,color:#111;
  classDef dados fill:#D6EAF8,stroke:#2E86C1,color:#154360;
```

---

## 5. API e Integrações

### 5.1 API Flow Diagram - Endpoints Principais

Descrição textual: visão dos recursos API, autenticação JWT/cookies, rate limiting e principais status codes.

```mermaid
flowchart TD
  CLIENT["Cliente/Empresa/Admin"]:::cliente
  EDGE["CDN/WAF + Rate limiting"]:::externo
  API["/api/v1 Backend API"]:::sistema
  AUTH{"JWT/cookie válido?"}:::decisao
  RBAC{"Role autorizado?"}:::decisao
  PUBLIC["Rotas públicas: GET /companies, GET /companies/:id, GET /reviews"]:::sistema
  AUTH_API["Auth: POST /auth/register, /auth/login, /auth/forgot-password"]:::sistema
  LEADS["Leads: POST /leads, GET /leads/:id, PUT /leads/:id"]:::sistema
  PROPOSALS["Proposals: POST /proposals, GET /proposals/:id, PUT /proposals/:id/status"]:::sistema
  REVIEWS["Reviews: POST /reviews, GET /companies/:id/reviews"]:::sistema
  FAVS["Favorites: POST /favorites, DELETE /favorites/:id, GET /favorites"]:::sistema
  NOTIF["Notifications: GET /notifications, PUT /notifications/:id/read"]:::sistema
  PAY["Payments: POST /payments, POST /payments/webhook"]:::sistema
  OK["200/201 OK"]:::conector
  BAD["400 validação / 401 auth / 403 permissão / 429 rate limit / 500 erro"]:::decisao
  DB[("PostgreSQL/Redis")]:::dados

  CLIENT --> EDGE --> API
  API --> PUBLIC --> OK
  API --> AUTH_API --> OK
  API --> AUTH
  AUTH -- "não" --> BAD
  AUTH -- "sim" --> RBAC
  RBAC -- "não" --> BAD
  RBAC -- "sim" --> LEADS
  RBAC -- "sim" --> PROPOSALS
  RBAC -- "sim" --> REVIEWS
  RBAC -- "sim" --> FAVS
  RBAC -- "sim" --> NOTIF
  API --> PAY
  LEADS --> DB --> OK
  PROPOSALS --> DB --> OK
  REVIEWS --> DB --> OK
  FAVS --> DB --> OK
  NOTIF --> DB --> OK
  PAY --> DB --> OK

  classDef cliente fill:#3498DB,stroke:#1F618D,color:#fff;
  classDef sistema fill:#E74C3C,stroke:#922B21,color:#fff;
  classDef externo fill:#F39C12,stroke:#B9770E,color:#111;
  classDef decisao fill:#FADBD8,stroke:#C0392B,color:#641E16;
  classDef dados fill:#D6EAF8,stroke:#2E86C1,color:#154360;
  classDef conector fill:#82E0AA,stroke:#229954,color:#0B2E13;
```

### 5.2 Integration Diagram - Serviços Externos

Descrição textual: integrações previstas/atuais e protocolos.

```mermaid
flowchart LR
  PLATFORM["AvaliaSolar Platform"]:::sistema
  PAY["Stripe/Pagar.me<br/>REST + Webhooks"]:::externo
  EMAIL["SendGrid/Amazon SES<br/>SMTP/API"]:::externo
  WHATS["Twilio/Z-API<br/>REST/Webhook"]:::externo
  MAPS["Google Maps/CEP<br/>REST"]:::externo
  ANALYTICS["GA4/PostHog/Mixpanel<br/>SDK/API"]:::externo
  S3["AWS S3/ActiveStorage<br/>SDK"]:::externo
  CDN["Cloudflare<br/>DNS/CDN/WAF"]:::externo
  MON["Sentry/New Relic/CloudWatch<br/>SDK/Agent"]:::externo
  DOC["Receita WS/Serasa<br/>REST"]:::externo

  PLATFORM -- "pagamento, assinatura, webhook HMAC" --> PAY
  PLATFORM -- "emails transacionais e templates" --> EMAIL
  PLATFORM -- "OTP, avisos, suporte e follow-up" --> WHATS
  PLATFORM -- "geocoding, distância, places" --> MAPS
  PLATFORM -- "eventos, funil, coortes" --> ANALYTICS
  PLATFORM -- "logos, documentos, portfólio" --> S3
  CDN -- "cache, TLS, WAF" --> PLATFORM
  PLATFORM -- "erros, traces, alertas" --> MON
  PLATFORM -- "validação CNPJ/CPF/certificações" --> DOC

  classDef sistema fill:#E74C3C,stroke:#922B21,color:#fff;
  classDef externo fill:#F39C12,stroke:#B9770E,color:#111;
```

---

## 6. Infraestrutura e Deploy

### 6.1 Infrastructure Diagram - Cloud e Produção

Descrição textual: arquitetura de referência para produção. O repositório atual usa containers Docker; o diagrama abaixo apresenta equivalentes cloud e responsabilidades.

```mermaid
flowchart TD
  USER["Usuários web/mobile"]:::cliente
  CF["Cloudflare<br/>DNS, CDN, WAF, TLS"]:::externo
  LB["Load Balancer<br/>ALB/Nginx"]:::externo

  subgraph vpc["VPC / Rede privada"]
    subgraph public["Subnets públicas"]
      FRONT["Frontend Next.js<br/>ECS/EC2/Container"]:::sistema
      API["Backend Rails API<br/>ECS/EC2/Container"]:::sistema
    end
    subgraph private["Subnets privadas"]
      WORKER["Sidekiq Workers"]:::sistema
      DB[("RDS/PostgreSQL<br/>Multi-AZ + backups")]:::dados
      REDIS[("ElastiCache Redis<br/>cache + filas")]:::dados
      SEARCH[("Search Engine opcional<br/>OpenSearch/Elasticsearch")]:::dados
    end
  end

  S3["S3 Storage<br/>imagens, documentos, backups"]:::externo
  SQS["SQS opcional<br/>filas assíncronas"]:::externo
  CW["CloudWatch/Sentry<br/>logs, métricas, alertas"]:::externo
  NAT["NAT Gateway<br/>saída segura"]:::externo

  USER --> CF --> LB
  LB --> FRONT
  LB --> API
  FRONT --> API
  API --> DB
  API --> REDIS
  API --> S3
  API --> SEARCH
  API --> WORKER
  WORKER --> DB
  WORKER --> REDIS
  WORKER --> SQS
  API --> CW
  FRONT --> CW
  WORKER --> CW
  private --> NAT

  classDef cliente fill:#3498DB,stroke:#1F618D,color:#fff;
  classDef sistema fill:#E74C3C,stroke:#922B21,color:#fff;
  classDef externo fill:#F39C12,stroke:#B9770E,color:#111;
  classDef dados fill:#D6EAF8,stroke:#2E86C1,color:#154360;
```

### 6.2 Deployment Pipeline - CI/CD

Descrição textual: fluxo de deploy com gates de qualidade, staging e produção blue-green.

```mermaid
flowchart LR
  DEV["Development<br/>branch/feature"]:::processo
  COMMIT["Commit + Push GitHub"]:::processo
  CI["GitHub Actions<br/>lint, typecheck, tests"]:::sistema
  BUILD["Build Docker images"]:::sistema
  REG["Push image registry/ECR"]:::externo
  DEV_DEPLOY["Deploy Dev"]:::sistema
  DEV_SMOKE["Smoke tests Dev"]:::processo
  MERGE_DEV{Merge develop?}:::decisao
  STAGE["Deploy Staging"]:::sistema
  INT["Integration + performance tests"]:::processo
  UAT{UAT aprovado?}:::decisao
  MERGE_MAIN{Merge main?}:::decisao
  PROD_BUILD["Build produção"]:::sistema
  MIG["Run migrations"]:::sistema
  BLUE_GREEN["Blue-green deploy"]:::sistema
  HEALTH{Health checks OK?}:::decisao
  PROMOTE["Promote green"]:::conector
  ROLLBACK["Rollback automático/manual"]:::decisao
  MON["Monitoramento pós-deploy"]:::externo

  DEV --> COMMIT --> CI --> BUILD --> REG --> DEV_DEPLOY --> DEV_SMOKE --> MERGE_DEV
  MERGE_DEV -- "sim" --> STAGE --> INT --> UAT
  UAT -- "sim" --> MERGE_MAIN --> PROD_BUILD --> MIG --> BLUE_GREEN --> HEALTH
  HEALTH -- "sim" --> PROMOTE --> MON
  HEALTH -- "não" --> ROLLBACK --> MON
  MERGE_DEV -- "não" --> DEV
  UAT -- "não" --> DEV

  classDef sistema fill:#E74C3C,stroke:#922B21,color:#fff;
  classDef externo fill:#F39C12,stroke:#B9770E,color:#111;
  classDef processo fill:#ECF0F1,stroke:#95A5A6,color:#17202A;
  classDef decisao fill:#FADBD8,stroke:#C0392B,color:#641E16;
  classDef conector fill:#82E0AA,stroke:#229954,color:#0B2E13;
```

---

## 7. Segurança e Compliance

### 7.1 Security Flow Diagram - Autenticação e Autorização

Descrição textual: camadas de segurança para registro, login, recuperação, 2FA opcional, autorização RBAC e proteção de dados.

```mermaid
flowchart TD
  USER["Usuário"]:::cliente
  TLS["HTTPS / TLS 1.3"]:::externo
  REGISTER["Registro: email/social login"]:::sistema
  VALIDATE["Validação input + anti-abuso"]:::sistema
  HASH["Hash de senha / OAuth identity"]:::dados
  JWT["Emitir JWT/cookie seguro + refresh"]:::sistema
  LOGIN["Login: credentials/OAuth"]:::sistema
  RECOVERY["Password recovery: token + email"]:::sistema
  TWOFA{"2FA habilitado?"}:::decisao
  TOTP["TOTP/QR Code/Verify"]:::sistema
  RBAC{"RBAC permite acesso?"}:::decisao
  RESOURCE["Recurso protegido"]:::sistema
  DENY["403/401 + auditoria"]:::decisao
  AUDIT["Audit log + analytics segurança"]:::dados
  ENCRYPT["Criptografia em trânsito e repouso"]:::dados

  USER --> TLS
  TLS --> REGISTER --> VALIDATE --> HASH --> JWT
  TLS --> LOGIN --> VALIDATE --> TWOFA
  TLS --> RECOVERY --> VALIDATE --> JWT
  TWOFA -- "sim" --> TOTP --> JWT
  TWOFA -- "não" --> JWT
  JWT --> RBAC
  RBAC -- "sim" --> RESOURCE --> AUDIT
  RBAC -- "não" --> DENY --> AUDIT
  HASH --> ENCRYPT
  RESOURCE --> ENCRYPT

  classDef cliente fill:#3498DB,stroke:#1F618D,color:#fff;
  classDef sistema fill:#E74C3C,stroke:#922B21,color:#fff;
  classDef externo fill:#F39C12,stroke:#B9770E,color:#111;
  classDef decisao fill:#FADBD8,stroke:#C0392B,color:#641E16;
  classDef dados fill:#D6EAF8,stroke:#2E86C1,color:#154360;
```

### 7.2 Compliance Flow - LGPD

Descrição textual: fluxo de consentimento, direitos do titular, retenção e resposta a incidentes.

```mermaid
flowchart TD
  DATA_START((Dado pessoal coletado)):::dados
  CONSENT{Base legal/consentimento registrado?}:::decisao
  BLOCK["Bloquear uso não essencial"]:::decisao
  STORE["Armazenar com finalidade, timestamp, IP/user agent"]:::dados
  USE["Uso limitado à finalidade: lead, conta, suporte, analytics permitido"]:::sistema
  RIGHTS{Titular solicita direito?}:::decisao
  ACCESS["Acesso/portabilidade"]:::cliente
  RECTIFY["Retificação"]:::cliente
  DELETE["Exclusão/anomização"]:::cliente
  RETENTION["Política de retenção e cleanup automático"]:::sistema
  DPIA["DPIA para fluxos sensíveis"]:::admin
  BREACH{Incidente de segurança?}:::decisao
  NOTIFY["Notificar responsáveis/ANPD/titulares conforme severidade"]:::admin
  AUDIT["Registro de auditoria LGPD"]:::dados

  DATA_START --> CONSENT
  CONSENT -- "não" --> BLOCK --> AUDIT
  CONSENT -- "sim" --> STORE --> USE --> RIGHTS
  RIGHTS -- "acesso" --> ACCESS --> AUDIT
  RIGHTS -- "retificação" --> RECTIFY --> AUDIT
  RIGHTS -- "exclusão" --> DELETE --> AUDIT
  USE --> RETENTION --> AUDIT
  USE --> DPIA
  USE --> BREACH
  BREACH -- "sim" --> NOTIFY --> AUDIT
  BREACH -- "não" --> AUDIT

  classDef cliente fill:#3498DB,stroke:#1F618D,color:#fff;
  classDef admin fill:#9B59B6,stroke:#6C3483,color:#fff;
  classDef sistema fill:#E74C3C,stroke:#922B21,color:#fff;
  classDef decisao fill:#FADBD8,stroke:#C0392B,color:#641E16;
  classDef dados fill:#D6EAF8,stroke:#2E86C1,color:#154360;
```

---

## 8. Monitoramento e Analytics

### 8.1 Analytics Dashboard - Métricas Principais

Descrição textual: mockup lógico de dashboard com métricas de negócio, produto e tecnologia.

```mermaid
flowchart TD
  DASH["Analytics Dashboard AvaliaSolar"]:::sistema
  BIZ["Métricas de negócio"]:::processo
  PROD["Métricas de produto"]:::processo
  TECH["Métricas técnicas"]:::processo
  FUNNEL["Funil: busca → perfil → orçamento → proposta → contratação"]:::dados
  LEADS["Leads gerados dia/mês/ano"]:::dados
  CONV["Conversão lead → proposta → fechamento"]:::dados
  TICKET["Ticket médio, CAC, LTV, churn"]:::dados
  NPS["NPS, CSAT, CES"]:::dados
  DAU["DAU/MAU, sessão, bounce"]:::dados
  FEATURE["Feature adoption: calculadora, comparação, favoritos"]:::dados
  PERF["API p50/p95/p99, uptime, error rate"]:::dados
  DB["DB query performance, cache hit rate, filas"]:::dados
  ALERT["Alertas e anomalias"]:::decisao

  DASH --> BIZ
  DASH --> PROD
  DASH --> TECH
  BIZ --> LEADS
  BIZ --> CONV
  BIZ --> TICKET
  BIZ --> NPS
  PROD --> FUNNEL
  PROD --> DAU
  PROD --> FEATURE
  TECH --> PERF
  TECH --> DB
  PERF --> ALERT
  CONV --> ALERT
  DB --> ALERT

  classDef sistema fill:#E74C3C,stroke:#922B21,color:#fff;
  classDef processo fill:#ECF0F1,stroke:#95A5A6,color:#17202A;
  classDef dados fill:#D6EAF8,stroke:#2E86C1,color:#154360;
  classDef decisao fill:#FADBD8,stroke:#C0392B,color:#641E16;
```

### 8.2 Alerting Flow - Monitoramento Proativo

Descrição textual: árvore de decisão para alertas técnicos e de negócio, com escalonamento.

```mermaid
flowchart TD
  METRIC["Métrica recebida"]:::dados
  TYPE{Tipo de alerta?}:::decisao
  INFRA["Infra: CPU > 80%, memória > 85%, disco > 90%"]:::externo
  APP["Aplicação: error rate > 5%, response time > 2s"]:::sistema
  BIZ["Negócio: leads drop > 50%, conversão abaixo do limite"]:::processo
  SEV{Severidade?}:::decisao
  L1["Level 1: Email/Slack para dev team"]:::conector
  L2["Level 2: SMS/Phone para tech lead"]:::conector
  L3["Level 3: War room CTO + time"]:::admin
  RUNBOOK["Executar runbook"]:::processo
  FIXED{Resolvido?}:::decisao
  POST["Postmortem + ação preventiva"]:::documento
  ESCALATE["Escalar próximo nível"]:::decisao

  METRIC --> TYPE
  TYPE -- "infra" --> INFRA --> SEV
  TYPE -- "app" --> APP --> SEV
  TYPE -- "business" --> BIZ --> SEV
  SEV -- "baixa" --> L1
  SEV -- "média" --> L2
  SEV -- "crítica" --> L3
  L1 --> RUNBOOK
  L2 --> RUNBOOK
  L3 --> RUNBOOK
  RUNBOOK --> FIXED
  FIXED -- "sim" --> POST
  FIXED -- "não" --> ESCALATE --> SEV

  classDef admin fill:#9B59B6,stroke:#6C3483,color:#fff;
  classDef sistema fill:#E74C3C,stroke:#922B21,color:#fff;
  classDef externo fill:#F39C12,stroke:#B9770E,color:#111;
  classDef processo fill:#ECF0F1,stroke:#95A5A6,color:#17202A;
  classDef decisao fill:#FADBD8,stroke:#C0392B,color:#641E16;
  classDef dados fill:#D6EAF8,stroke:#2E86C1,color:#154360;
  classDef conector fill:#82E0AA,stroke:#229954,color:#0B2E13;
  classDef documento fill:#FCF3CF,stroke:#B7950B,color:#7D6608;
```

---

## Apêndice A: Glossário

| Termo | Definição |
|---|---|
| Cliente | Usuário final que busca soluções solares, VE, baterias ou financiamento |
| Empresa | Prestador, fabricante, banco, integrador ou fornecedor cadastrado na plataforma |
| Lead | Solicitação de orçamento/projeto criada por um cliente |
| Proposal/Proposta | Resposta comercial enviada por uma empresa para um lead |
| Matchmaking | Processo de seleção e ranqueamento de empresas elegíveis para um lead |
| Score | Métrica composta de reputação, avaliações, resposta, completude e regras de negócio |
| Premium | Plano/condição comercial que pode habilitar destaque, CTAs e recursos avançados |
| LGPD | Lei Geral de Proteção de Dados |
| NPS | Net Promoter Score |
| CSAT | Customer Satisfaction Score |
| CES | Customer Effort Score |
| SLA | Service Level Agreement |

## Apêndice B: Referências

| Padrão | Uso |
|---|---|
| Mermaid.js | Diagramas renderizáveis em Markdown |
| C4 Model | Contexto, containers e componentes |
| BPMN 2.0 | Referência conceitual de processo, simulada em flowchart |
| UML Sequence | Interações temporais entre atores e sistemas |
| ERD Crow's Foot | Cardinalidade e modelagem relacional |
| DFD | Fluxo de dados entre processos e stores |
| LGPD | Conformidade com dados pessoais no Brasil |

## Apêndice C: Checklist de Validação

| Item | Status |
|---|---|
| Todos os 8 grupos de diagramas estão presentes | OK |
| Mínimo de 50 nós/etapas no total | OK |
| Cores padronizadas aplicadas nos flowcharts | OK |
| Legendas completas incluídas | OK |
| Cross-references entre diagramas | OK |
| Nomenclatura consistente | OK |
| Descrições textuais para cada diagrama | OK |
| Metadados de versão, data, autor e status | OK |
| Índice/sumário funcional em Markdown | OK |
| Mermaid validável em renderizadores compatíveis | OK estrutural; validar render visual no ambiente alvo para C4 e Sankey |

## Apêndice D: Changelog

| Versão | Data | Autor | Alteração |
|---|---|---|---|
| 1.0.0 | 2026-05-19 | Codex + Equipe AvaliaSolar | Criação inicial da documentação técnica completa |
