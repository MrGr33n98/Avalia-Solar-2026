# Compare Page System Blueprint

Status: `draft`  
Owner sugerido: `PO + Frontend + Backend + Growth + Analytics`  
Última atualização: `2026-03-13`

## Objetivo

Mapear a página `/compare` do Avalia Solar ponta a ponta, cobrindo:

- arquitetura frontend
- origem e qualidade dos dados
- fluxo de informação entre páginas e local storage
- UX e modelo mental da comparação
- analytics e intent signals
- quais informações estão sendo comparadas hoje
- quais informações deveriam ser comparadas
- quais sinais são mais relevantes para decisão do usuário
- blueprint de evolução do sistema

---

## 1. Executive Summary

A página `/compare` hoje funciona como uma camada de decisão assistida no marketplace.

Ela não é só uma tabela visual. Na prática, ela cumpre quatro funções:

- consolidar shortlist de empresas
- reduzir custo cognitivo da escolha
- destacar empresas premium dentro da comparação
- gerar sinais fortes de intenção comercial

O sistema atual é funcional, mas ainda está em estágio `UI-first`, não `decision-system-first`.

Isso significa:

- a interface já parece uma ferramenta de comparação
- a telemetria de intenção já existe
- a lógica de shortlist já existe
- mas o modelo de dados comparados ainda é superficial para uma decisão de compra complexa

Hoje a página compara mais atributos de perfil do que atributos reais de compra.

Essa é a principal lacuna estratégica.

---

## 2. Fontes Estruturais

### Frontend principal

- [page.tsx](/Users/felipemorais/Avalia-Solar-2026/AB0-1-front/app/compare/page.tsx)
- [useComparison.ts](/Users/felipemorais/Avalia-Solar-2026/AB0-1-front/hooks/useComparison.ts)

### Componentes da página

- [ComparePageHeader.tsx](/Users/felipemorais/Avalia-Solar-2026/AB0-1-front/components/compare/ComparePageHeader.tsx)
- [ComparisonSummary.tsx](/Users/felipemorais/Avalia-Solar-2026/AB0-1-front/components/compare/ComparisonSummary.tsx)
- [CompanyComparisonCard.tsx](/Users/felipemorais/Avalia-Solar-2026/AB0-1-front/components/compare/CompanyComparisonCard.tsx)
- [ComparisonFooterCTA.tsx](/Users/felipemorais/Avalia-Solar-2026/AB0-1-front/components/compare/ComparisonFooterCTA.tsx)
- [PremiumBannerSection/index.tsx](/Users/felipemorais/Avalia-Solar-2026/AB0-1-front/components/compare/PremiumBannerSection/index.tsx)
- [ComparisonToggleButton.tsx](/Users/felipemorais/Avalia-Solar-2026/AB0-1-front/components/ComparisonToggleButton.tsx)

### Tipos e payloads

- [api.ts](/Users/felipemorais/Avalia-Solar-2026/AB0-1-front/lib/api.ts)

### Analytics e intent

- [useIntentTracking.ts](/Users/felipemorais/Avalia-Solar-2026/AB0-1-front/lib/analytics/hooks/useIntentTracking.ts)
- [BuyerIntentActivity](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/models/buyer_intent_activity.rb)

### Backend relacionado

- [routes.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/config/routes.rb)
- [companies_controller.rb](/Users/felipemorais/Avalia-Solar-2026/AB0-1-back/app/controllers/api/v1/companies_controller.rb)

---

## 3. Arquitetura Geral

## 3.1 Como o sistema funciona hoje

O `/compare` é um sistema majoritariamente client-side.

O fluxo base é:

1. o usuário adiciona empresas à comparação em outras superfícies
2. essas empresas são persistidas em `localStorage`
3. o hook `useComparison()` hidrata a shortlist local
4. a página `/compare` lê essa shortlist e renderiza a comparação
5. a página dispara eventos analíticos e intent signals
6. CTAs abrem lead modal para empresa preferida

## 3.2 Camadas do sistema

### Camada 1: Captura da shortlist

Feita por:

- `ComparisonToggleButton`
- `CompanyComparisonSection`
- `ComparisonFloatingBar`

### Camada 2: Persistência local

Feita em:

- `localStorage`
- chave: `ab01_comparison_list`

### Camada 3: Apresentação da comparação

Feita em:

- `/app/compare/page.tsx`

### Camada 4: Geração de intenção

Feita por:

- `track('comparison_add')`
- `track('comparison_remove')`
- `track('comparison_quote_click')`
- `sendIntentSignal(...comparison_usage...)`

### Camada 5: Monetização indireta

Feita por:

- destaque premium
- premium banner section
- footer CTA
- priorização visual de empresas pagas/premium

---

## 4. Modelo De Informação

## 4.1 Fonte dos dados comparados

A comparação usa o objeto `Company` que já chega ao frontend via APIs gerais de empresa.

Ou seja:

- não existe hoje um endpoint dedicado de `company comparison payload`
- o compare reutiliza payloads genéricos do marketplace
- isso acelera implementação
- mas enfraquece consistência e profundidade analítica

## 4.2 O que está sendo comparado hoje

Na prática, a comparação mostra hoje, mas de forma não uniforme entre superfícies:

- nome
- logo
- rating médio
- quantidade de avaliações
- cidade e estado
- verificação
- anos de mercado
- badges
- financiamento disponível
- serviços
- parceiros financeiros
- premium/featured/paid state

Observação importante:

- no `/compare` desktop atual, a tabela principal mostra de forma explícita apenas `nome`, `logo`, `rating`, `cidade/estado`, `verified`, `founded_year` e estado premium
- no `/compare` mobile, os cards expandidos acrescentam `badges`, `financing_enabled`, `services` e `financing_partners`
- no `CompanyComparisonModal`, aberto pela barra flutuante, aparecem ainda `awards`, `minimum_ticket`, `whatsapp` e `phone`

Portanto, hoje não existe uma única “verdade visual” do compare. Existe um ecossistema de comparação com profundidades diferentes dependendo do ponto de entrada e do device.

## 4.3 O que é inferido como premium

Uma empresa é tratada como premium quando qualquer condição é verdadeira:

- `featured`
- `plan_status === 'active'`
- `has_paid_plan`

Isso não é só visual. Essa inferência afeta:

- badge premium
- premium banner
- narrativa do footer
- percepção de recomendação

## 4.4 Realidade do contrato de dados no código

O principal achado técnico é que o compare hoje trabalha com `Company snapshots`, não com um payload canônico de comparação.

Isso acontece porque:

- `useComparison()` salva no `localStorage` o objeto `Company` recebido na superfície onde o usuário clicou em comparar
- no marketplace principal (`/companies`), as listagens usam `fields='card'`
- o payload `card` do backend retorna um subconjunto de campos
- esse subconjunto é suficiente para cards, mas insuficiente para uma comparação decisória rica

Consequência prática:

- se o usuário adiciona uma empresa pela listagem, o snapshot salvo tende a conter apenas `id`, `slug`, `name`, `city`, `state`, `rating_avg`, `rating_count`, `featured`, `verified`, `logo_url`, `banner_url`, `primary_category`, `category_ids` e `feature_access`
- campos como `founded_year`, `plan_status`, `has_paid_plan`, `badges`, `services_offered`, `project_types`, `minimum_ticket`, `maximum_ticket`, `response_time_sla`, `coverage_states`, `coverage_cities`, `whatsapp`, `phone`, `financing_partners` e `awards` podem não estar presentes no snapshot salvo
- por isso, a qualidade do compare depende da origem da shortlist, e não apenas do que o backend sabe sobre a empresa

Em termos de data engineering, isso cria um problema clássico de `schema drift no edge state`:

- o contrato exibido na UI depende da rota de origem
- o contrato persistido no browser não é versionado
- a mesma empresa pode ser comparada com mais ou menos atributos conforme o lugar onde foi adicionada

Esse é o maior risco estrutural do sistema atual.

---

## 5. Fluxo De Informação

## 5.1 Fluxo A: Usuário adiciona empresa à comparação

### Origem

Botões e componentes de empresa no marketplace.

### Lógica

`ComparisonToggleButton` chama `useComparison()`.

### Gate

- máximo de 3 empresas
- deduplicação por `company.id`

### Persistência

Lista salva em `localStorage`.

### Saída

- toast
- evento local de atualização
- tracking de `comparison_add`
- intent signal `comparison_usage`

## 5.2 Fluxo B: Sincronização entre componentes

O hook usa um `EventTarget` local (`comparisonEvents`) para sincronizar múltiplas instâncias no mesmo browser.

Isso resolve:

- barra flutuante
- seção de comparação em página de empresa
- página `/compare`

## 5.3 Fluxo C: Render da página `/compare`

Quando o usuário abre `/compare`:

- o hook carrega a lista local
- se a lista está vazia, mostra empty state
- se há empresas, renderiza:
  - header
  - summary
  - premium banner opcional
  - cards mobile
  - table desktop
  - footer CTA

## 5.4 Fluxo D: Geração de lead a partir da comparação

`handleQuoteClick(companyId)`:

- dispara `comparison_quote_click`
- dispara intent signal `comparison_usage` com `action: quote_click`
- abre lead modal com `preferredCompanyId`

Esse é o principal ponto de conversão da página.

---

## 6. UX / UI Diagnosis

## 6.1 O que a UX faz bem

### Shortlist clara

O limite de até 3 empresas é bom.

Evita:

- overload de comparação
- grid inviável
- decisão caótica

### Boa hierarquia visual

A página usa:

- summary no topo
- comparação em tabela no desktop
- cards expansíveis no mobile

Isso é correto para responsividade.

### Boa continuidade de navegação

O fluxo:

- empresa -> adicionar à comparação -> barra flutuante -> `/compare`

é consistente com comportamento real de marketplace.

### Boa base de acessibilidade sem ser perfeita

Há vários `aria-label`, `aria-expanded`, textos claros e controles explicitamente rotulados.

## 6.2 Onde a UX ainda é fraca

### Falta de framing decisório

A página compara atributos, mas não orienta a decisão.

Ela deveria responder mais claramente:

- qual empresa é melhor para qual contexto
- qual atende melhor residencial, comercial, industrial
- qual oferece menor risco
- qual oferece maior confiança
- qual é melhor para orçamento rápido

Hoje isso fica implícito demais.

### Comparação ainda é muito perfil-estática

O usuário quer comparar:

- preço/fit
- qualidade percebida
- confiança
- cobertura
- velocidade de resposta
- financiamento
- adequação ao projeto

Mas a página ainda mostra mais “cadastro enriquecido” do que “decisão de compra”.

### Premium pode parecer recomendação editorial forte demais

O premium banner dentro da comparação é bom para monetização, mas pode enviesar a leitura do usuário.

Se não houver transparência suficiente, isso pode gerar:

- perda de confiança
- sensação de ranking pago
- confusão entre destaque comercial e mérito comparativo

### Falta score de comparação orientado a caso de uso

Hoje a comparação não gera síntese como:

- melhor para projetos industriais
- melhor para financiamento
- melhor reputação
- melhor cobertura regional

Isso deveria existir.

---

## 7. Dados Comparados Hoje

## 7.1 Relevância dos dados atuais

### Muito relevantes

- `rating_avg`
- `rating_count`
- `verified`
- `city/state`
- `founded_year`
- `financing_enabled`
- `services_offered`
- `project_types`

### Relevância média

- `badges`
- `financing_partners`
- `featured`
- `has_paid_plan`

### Baixa relevância para decisão direta

- presença de banner premium
- narrativa genérica de premium
- elementos cosméticos não ligados a fit

## 7.2 O que está faltando hoje

Para uma comparação realmente útil, faltam:

- faixa de ticket mínimo e máximo exibida explicitamente
- tempo médio de resposta real
- cobertura geográfica em formato legível
- especializações prioritárias por segmento
- tipo de projeto atendido com destaque
- provas sociais resumidas
- CTAs e canais disponíveis por empresa
- disponibilidade de WhatsApp / telefone / financiamento
- ranking de aderência ao caso de uso

## 7.3 O que deveria virar campos comparáveis de primeira classe

Sugestão de colunas mais decisórias:

- `Especialização principal`
- `Segmentos atendidos`
- `Faixa de ticket`
- `Cobertura regional`
- `Tempo de resposta`
- `Financiamento`
- `Avaliação média`
- `Volume de avaliações`
- `Verificação`
- `Anos de mercado`
- `Diferenciais`
- `Melhor para`

## 7.4 Inventário canônico dos dados relevantes para o consumidor

### Tier A: dados decisórios já existentes no banco e altamente relevantes

Esses campos já existem na base e deveriam ser tratados como `first-class compare dimensions`:

| Campo | Existe no model/schema | Vai no payload detail hoje | Vai no payload `fields=card` | Exposição atual no compare | Valor para decisão |
| --- | --- | --- | --- | --- | --- |
| `rating_avg` | sim | sim | sim | alto | confiança inicial |
| `rating_count` | sim | sim | sim | alto | robustez da reputação |
| `verified` | sim | sim | sim | alto | redução de risco |
| `city` / `state` | sim | sim | sim | alto | aderência geográfica |
| `founded_year` | sim | sim | não confiável no snapshot card | médio | maturidade percebida |
| `project_types` | sim | sim | não | baixa/no `/compare` | aderência ao caso de uso |
| `services_offered` | sim | sim | não | baixa/no `/compare` | escopo técnico |
| `minimum_ticket` / `maximum_ticket` | sim | sim | não | quase nula | viabilidade financeira |
| `financing_enabled` | sim | sim | não | média | viabilidade de compra |
| `financing_partners` | sim | sim | não | baixa | credibilidade comercial |
| `whatsapp` / `phone` | sim | sim | não | muito baixa | velocidade de contato |
| `coverage_states` / `coverage_cities` | sim | não serializado hoje | não | nula | capacidade regional |
| `response_time_sla` | sim | não serializado hoje | não | nula | velocidade percebida |
| `niche_tags` | sim | não serializado hoje | não | nula | especialização real |

Leitura estratégica:

- o banco já possui boa parte dos dados mais úteis para decisão
- o gargalo está menos na existência do dado e mais no contrato, serialização e priorização visual
- o compare atual subutiliza ativos já existentes no schema

### Tier B: dados que existem, mas hoje empurram monetização mais do que decisão

| Campo | Papel atual | Risco |
| --- | --- | --- |
| `featured` | destaque visual | parece ranking pago se não houver transparência |
| `plan_status` | proxy de premium | mistura estado comercial com mérito comparativo |
| `has_paid_plan` | inferência premium | reforça recomendação implícita |
| `premium_banner_*` | monetização e CTR | pode canibalizar neutralidade do compare |

Esses campos devem continuar existindo, mas precisam ser claramente separados de:

- mérito comparativo
- score de aderência
- recomendação contextual

### Tier C: dados críticos que ainda não viraram produto de decisão

Do ponto de vista do consumidor e do funil, faltam campos comparáveis sintetizados:

- `specialty_primary`
- `best_for`
- `coverage_summary`
- `response_time_band`
- `ticket_band`
- `contact_channels`
- `social_proof_summary`
- `risk_flags`

Esses campos não precisam nascer como novos campos físicos no banco.

Eles podem nascer como:

- campos derivados no endpoint de compare
- normalizações a partir de colunas já existentes
- enriquecimentos calculados por backend

---

## 8. Dados Que Poderiam Ser Mais Relevantes

## 8.1 Para usuário final B2C

Mais relevantes:

- residencial vs comercial vs rural
- financiamento
- tempo de resposta
- reputação
- cidade/estado
- ticket mínimo

## 8.2 Para lead B2B / comercial-industrial

Mais relevantes:

- porte dos projetos
- industrial/comercial como foco
- cobertura multiestado
- certificações e cases
- capacidade de resposta
- faixas de orçamento suportadas

## 8.3 Para monetização da plataforma

Mais relevantes:

- sinais de intenção de comparação
- quote click depois da comparação
- tempo na página
- qual atributo foi expandido
- qual empresa foi escolhida após shortlist

## 8.4 Priorização por etapa do funil

### Topo de funil: reduzir incerteza e incentivar shortlist

Os dados mais úteis aqui são:

- `rating_avg`
- `rating_count`
- `verified`
- `city/state`
- `project_types`
- `services_offered`

Objetivo de growth:

- aumentar `comparison_add_rate`
- aumentar `% de sessões com shortlist >= 2`
- reduzir abandono antes de abrir `/compare`

### Meio de funil: transformar shortlist em decisão racional

Os dados mais úteis aqui são:

- `minimum_ticket` / `maximum_ticket`
- `financing_enabled`
- `financing_partners`
- `coverage_summary`
- `response_time_band`
- `best_for`

Objetivo de growth:

- aumentar `compare_to_quote_rate`
- aumentar `CTA click after compare`
- reduzir remoções sem clique final

### Fundo de funil: reduzir tempo até contato

Os dados mais úteis aqui são:

- `whatsapp`
- `phone`
- `cta_whatsapp_enabled`
- `cta_whatsapp_url`
- disponibilidade de canais
- diferenciais curtos e objetivos

Objetivo de growth:

- aumentar `lead modal open rate`
- aumentar `whatsapp/contact click rate`
- melhorar SLA de passagem de lead e qualidade percebida

### Retenção e continuidade de jornada

O compare hoje quase não trabalha retenção.

Com persistência só em browser:

- o usuário perde shortlist ao trocar dispositivo ou contexto
- não existe recuperação de intenção na volta
- não existe reativação do usuário com base em shortlist pendente

Em termos de retenção e CRM, o compare deveria alimentar:

- `saved comparison`
- `resume comparison`
- `compare reminder`
- `new evidence added to shortlisted company`
- `price/financing update for shortlisted company`

---

## 9. Analytics E Intent Signals

## 9.1 O que existe hoje

A página já envia sinais importantes:

- `comparison_add`
- `comparison_remove`
- `comparison_quote_click`
- `intent_comparison_usage`

Além disso, `BuyerIntentActivity` já atribui peso `6` para:

- `comparison_view`
- `comparison_usage`

Isso é correto. Comparação é um forte sinal de intenção.

## 9.2 O que ainda falta

Ainda faltam sinais mais granulares:

- qual grupo foi expandido
- qual atributo foi mais observado
- tempo total na comparação
- qual empresa foi removida primeiro
- qual empresa permaneceu até a decisão
- qual empresa recebeu o primeiro CTA click
- se premium banner influenciou clique

## 9.3 Eventos recomendados

- `comparison_page_viewed`
- `comparison_group_expanded`
- `comparison_attribute_inspected`
- `comparison_company_removed`
- `comparison_company_retained`
- `comparison_decision_started`
- `comparison_decision_completed`
- `comparison_premium_banner_clicked`

## 9.4 Diagnóstico detalhado de intent data

### O que o sistema mede bem hoje

- entrada no compare via `comparison_add`
- remoção explícita via `comparison_remove`
- clique de intenção comercial via `comparison_quote_click`
- sinal de pesquisa com peso alto via `comparison_usage`

Isso já é suficiente para detectar:

- usuários em shortlist ativa
- empresas entrando no conjunto de consideração
- leads com forte intenção de contato

### O que o sistema mede mal hoje

Hoje o sistema não explica `por que` uma empresa venceu nem `qual atributo` destravou a conversão.

Faltam dimensões como:

- primeira empresa adicionada
- última empresa mantida antes do clique
- ordem de remoção
- atributo observado antes do CTA
- tempo entre `comparison_add` e `quote_click`
- influência do banner premium
- diferença entre compare “racional” e compare “rápido”

Sem isso, growth consegue ver que o compare gera intenção, mas não consegue explicar:

- quais dados reduzem fricção
- quais dados deslocam a escolha
- quais empresas ganham por confiança versus velocidade versus viabilidade financeira

### Esquema recomendado para metadata de compare

Os eventos de compare deveriam carregar um envelope estável:

```json
{
  "comparison_id": "uuid-ou-session-stable-id",
  "comparison_size": 3,
  "company_ids": [12, 48, 91],
  "company_id": 48,
  "source_surface": "companies_listing | company_profile | comparison_modal | comparison_page",
  "device_context": "mobile | desktop",
  "action": "view | add | remove | expand | inspect | retain | quote_click | dismiss_premium",
  "dimension_key": "ticket_band | response_time | verified | financing | badges",
  "dimension_group": "trust | fit | commercial | speed | premium",
  "position": 2,
  "time_since_compare_started_ms": 182000
}
```

### Novos sinais prioritários para scoring

Se o objetivo é priorização comercial, os próximos sinais de maior valor são:

1. `comparison_attribute_inspected`
2. `comparison_decision_completed`
3. `comparison_company_retained`
4. `comparison_premium_influenced_click`
5. `comparison_resume`

Sugestão de leitura para intent scoring:

- `comparison_add` continua sendo um sinal quente
- `attribute_inspected` aumenta confiança do score
- `decision_completed` deveria pesar mais que `comparison_view`
- `premium_influenced_click` não deve inflar score de intenção sem flag específica de influência comercial

---

## 10. Infra / Backend Diagnosis

## 10.1 Estado atual

O compare de empresas não possui backend dedicado.

Isso implica:

- sem contrato canônico específico de comparação
- dependência de payload genérico de `Company`
- risco de campos inconsistentes entre páginas
- risco de atributos faltarem conforme origem da empresa

## 10.2 Vantagem atual

O custo de implementação foi baixo.

## 10.3 Desvantagem estrutural

Sem um endpoint dedicado, o sistema não controla:

- quais campos são obrigatórios para comparar
- quais campos têm fallback
- quais campos devem vir normalizados para UX
- qual métrica é “oficial” para decisão

## 10.4 Recomendação

Criar um endpoint dedicado no futuro:

`GET /api/v1/companies/compare?ids[]=...`

Payload deveria vir com:

- `companies`
- `comparison_dimensions`
- `normalized_scores`
- `decision_hints`
- `missing_fields`

## 10.5 Contrato canônico recomendado

### Objetivos do contrato

O endpoint de compare precisa resolver quatro problemas:

- estabilidade do schema
- igualdade entre superfícies
- legibilidade para UX
- mensuração consistente para analytics

### Estrutura sugerida

```json
{
  "comparison_id": "cmp_123",
  "companies": [
    {
      "id": 12,
      "name": "Empresa X",
      "premium_state": {
        "is_premium": true,
        "reasons": ["featured", "paid_plan"]
      },
      "trust": {
        "verified": true,
        "rating_avg": 4.8,
        "rating_count": 143,
        "badges": ["Top Integrador 2026"]
      },
      "fit": {
        "project_types": ["Residenciais", "Comerciais"],
        "services_offered": ["Projeto", "Instalação"],
        "niche_tags": ["Projetos Rurais"]
      },
      "commercial": {
        "ticket_band": "R$ 15 mil a R$ 120 mil",
        "financing_enabled": true,
        "financing_partners": ["BV", "Santander"]
      },
      "speed": {
        "response_time_band": "até 2h",
        "contact_channels": ["whatsapp", "phone"]
      },
      "coverage": {
        "summary": "SP, MG e PR",
        "states": ["SP", "MG", "PR"]
      },
      "decision_hints": {
        "best_for": ["Residencial com financiamento", "Projetos rápidos"],
        "risk_notes": [],
        "strengths": ["Alta reputação", "Cobertura regional"]
      },
      "missing_fields": ["response_time_sla"]
    }
  ],
  "comparison_dimensions": [
    "verified",
    "rating_avg",
    "rating_count",
    "project_types",
    "ticket_band",
    "response_time_band"
  ],
  "normalized_scores": {},
  "decision_hints": {}
}
```

### Regras de modelagem

- `premium_state` deve ser separado de `decision_hints`
- `missing_fields` deve existir por empresa para evitar penalização silenciosa
- campos brutos e campos derivados devem coexistir
- toda dimensão exibida na UI precisa ter chave estável para analytics
- o frontend não deve inferir contrato a partir de `Company` genérico

### Implicações de performance e operações

Do ponto de vista de dados:

- o endpoint deve aceitar até 3 ids e responder rapidamente
- vale cache curto por combinação ordenada de ids
- serializers precisam evitar N+1 em `badges`, `review_aggregates`, `financing_partners` e `categories`
- a presença de `comparison_id` permite unir jornadas e eventos sem depender só de `session_id`

---

## 11. Riscos Do Sistema Atual

### Risco 1

Comparação baseada em dados incompletos ou desiguais.

Impacto:

- algumas empresas parecem piores só porque têm menos campos preenchidos

### Risco 2

Mistura entre destaque comercial e neutralidade comparativa.

Impacto:

- confiança do usuário pode cair

### Risco 3

Persistência só em `localStorage`.

Impacto:

- shortlist não é multi-device
- usuário logado não tem continuidade entre sessões

### Risco 4

Sem endpoint canônico de comparação.

Impacto:

- frontend carrega responsabilidade excessiva de normalização

### Risco 5

Sem explicação do “melhor para”.

Impacto:

- página ajuda a ver diferenças, mas ainda ajuda pouco a decidir

### Risco 6

`Schema drift` entre origem da shortlist e tela de compare.

Impacto:

- o usuário adiciona pela listagem um objeto `card`, mas espera uma comparação completa
- atributos decisórios podem sumir sem aviso
- o time de produto pode acreditar que um campo “está no compare” quando ele só aparece em algumas superfícies

### Risco 7

Inconsistência entre mobile, desktop e modal.

Impacto:

- usuários diferentes recebem profundidades diferentes de informação
- analytics fica difícil de comparar entre devices
- crescimento de conversão pode parecer efeito de UX quando na prática é efeito de disponibilidade de dados

### Risco 8

Sinal premium não separado do mérito comparativo.

Impacto:

- CTR premium pode subir
- mas confiança líquida no compare pode cair
- isso cria risco de otimização local para monetização e perda global de conversão no médio prazo

---

## 12. O Que É Mais Relevante Para O Usuário

Se o objetivo é decisão e não só browsing, a comparação deveria priorizar:

1. confiança
- verificação
- avaliações
- badges/cases

2. aderência
- segmentos atendidos
- project types
- serviços

3. viabilidade
- ticket
- financiamento
- cobertura regional

4. velocidade
- resposta
- canais de contato

5. recomendação contextual
- melhor para residencial
- melhor para comercial
- melhor para industrial

Hoje o sistema cobre bem `1` e parcialmente `2`, mas cobre mal `3`, `4` e `5`.

## 12.1 Matriz prática de prioridade para o consumidor

| Dimensão | Relevância para decisão | Existe no banco | Exposição atual no `/compare` | Prioridade de evolução |
| --- | --- | --- | --- | --- |
| confiança | muito alta | sim | parcial | imediata |
| aderência ao projeto | muito alta | sim | baixa | imediata |
| viabilidade financeira | muito alta | sim | muito baixa | imediata |
| velocidade de contato | alta | sim | muito baixa | imediata |
| cobertura regional | alta | sim | nula | alta |
| diferenciais / especialização | alta | parcial | baixa | alta |
| premium / patrocínio | média para plataforma, baixa para decisão direta | sim | alta | reequilibrar |

Resumo objetivo:

- o compare já ajuda a formar shortlist
- ainda não ajuda o suficiente a fechar escolha
- há excesso relativo de destaque comercial frente a dados de viabilidade e aderência

---

## 13. Blueprint De Evolução

## Step 1: Inventário Canônico Do Compare

### Objetivo

Mapear todos os campos hoje usados no compare e identificar origem, qualidade e fallback.

### Context Brief

Use `app/compare/page.tsx`, `useComparison.ts`, `Company` type e os componentes de compare.

### Done quando

- existir lista clara de:
  - campos usados
  - origem
  - obrigatoriedade
  - risco de inconsistência
- existir separação entre:
  - `fields=card`
  - `company detail payload`
  - `compare payload`

## Step 2: Modelo De Comparação Orientado A Decisão

### Objetivo

Separar atributos de cadastro de atributos decisórios.

### Deliverables

- matriz `atributo -> importância`
- ranking por persona
- definição de “melhor para”
- separação formal entre:
  - confiança
  - aderência
  - viabilidade
  - velocidade
  - promoção comercial

### Done quando

- a comparação deixa de ser só tabela de perfil e vira ferramenta de escolha

## Step 3: Endpoint Dedicado De Compare

### Objetivo

Criar payload canônico de comparação.

### Deliverables

- endpoint backend dedicado
- serializer específico
- normalização de campos
- support para `missing_fields`

### Done quando

- frontend não depender mais de payload genérico de empresa para comparar

## Step 4: UX De Decisão

### Objetivo

Dar síntese e recomendação contextual.

### Deliverables

- destaque “melhor para”
- explicação dos diferenciais
- seção de decisão assistida
- scorecards resumidos

### Done quando

- o usuário consegue decidir mais rápido e com menos ambiguidade

## Step 5: Intent Analytics V2

### Objetivo

Transformar `/compare` em fonte de sinais de alta intenção.

### Deliverables

- eventos por grupo expandido
- eventos por atributo clicado
- tempo de comparação
- empresa escolhida após compare
- análise premium influence
- `comparison_id` persistente por jornada
- metadata estável por dimensão comparada
- relatório de `compare_to_quote_rate` por atributo observado

### Done quando

- product e growth conseguem responder:
  - o que mais pesa na decisão
  - quais empresas convertem após compare
  - quais atributos destravam quote
- analytics consegue separar:
  - efeito de mérito
  - efeito de patrocínio
  - efeito de disponibilidade de canal

## Step 6: Persistência E Continuidade

### Objetivo

Tornar a shortlist cross-session e possivelmente cross-device.

### Deliverables

- persistência server-side para usuários logados
- sync entre devices
- compare links compartilháveis
- recuperação de shortlist abandonada
- gatilhos de reengajamento baseados em compare pendente

### Done quando

- o compare vira ativo contínuo da jornada, não estado efêmero do browser
- growth consegue usar compare como audiência de remarketing e reativação

---

## 14. Definition Of Done

- [ ] O sistema de comparação está documentado ponta a ponta.
- [ ] Há distinção clara entre atributos cosméticos e decisórios.
- [ ] Existe definição de quais informações são mais relevantes para decisão.
- [ ] O compare deixa de depender apenas de payload genérico de `Company`.
- [ ] Analytics da comparação mede intenção e decisão, não só clique.
- [ ] O compare evolui de “tabela visual” para “motor de decisão assistida”.
