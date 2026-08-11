# PDR — Avalia Solar

## Plataforma de descoberta, reputação, leads e crescimento para o mercado solar

**Versão:** 1.0
**Status:** Proposto
**Prioridade:** P0/P1
**Objetivo:** consolidar o Avalia Solar como um marketplace orientado por confiança, descoberta e geração de oportunidades comerciais.

---

# 1. Visão do produto

O Avalia Solar deve conectar:

**Consumidor → descoberta → comparação → interação → lead → empresa → venda → avaliação → reputação → visibilidade → novos leads.**

O produto não deve ser apenas um diretório de empresas.

O ativo central é o **ciclo de confiança e aquisição**:

```text
TRÁFEGO
  ↓
DESCOBERTA
  ↓
EMPRESAS / PRODUTOS / CONTEÚDO
  ↓
COMPARAÇÃO
  ↓
CONTATO / WHATSAPP / ORÇAMENTO / MOBIVOLT
  ↓
LEAD
  ↓
QUALIFICAÇÃO
  ↓
EMPRESA
  ↓
ATENDIMENTO
  ↓
CONVERSÃO
  ↓
AVALIAÇÃO
  ↓
REPUTAÇÃO
  ↓
TRUST + RANKING
  ↓
MAIOR VISIBILIDADE
  ↓
MAIS LEADS
  ↺
```

---

# 2. Problema que estamos resolvendo

### Para o consumidor

O mercado solar possui:

* muitas empresas;
* dificuldade para comparar fornecedores;
* assimetria de informação;
* dificuldade de avaliar confiabilidade;
* preços e propostas pouco padronizados;
* risco na escolha do instalador;
* informações dispersas;
* dificuldade de encontrar empresas locais qualificadas.

### Para a empresa

A empresa solar possui outro conjunto de problemas:

* aquisição de clientes cara;
* dependência de anúncios;
* leads pouco qualificados;
* dificuldade de construir reputação;
* baixa diferenciação;
* dificuldade de provar confiança;
* pouca inteligência sobre concorrência;
* dificuldade de transformar avaliações em vendas.

---

# 3. Proposta de valor

## Consumidor

> Encontrar, avaliar e comparar empresas e soluções solares com mais segurança.

O Avalia Solar offers:

* busca;
* empresas;
* categorias;
* produtos;
* avaliações;
* comparação;
* reputação;
* Trust Score;
* conteúdo;
* contato;
* solicitação de orçamento;
* MobiVolt AI.

## Empresa

> Transformar reputação e presença digital em oportunidades comerciais.

A empresa recebe:

* perfil empresarial;
* avaliações;
* reputação;
* exposição;
* ranking;
* leads;
* contatos;
* WhatsApp;
* analytics;
* inteligência comercial;
* publicidade;
* materiais;
* ferramentas de conversão.

---

# 4. North Star Metric

A principal métrica não deveria ser simplesmente:

**usuários cadastrados** ou **pageviews**.

Minha recomendação:

### `Oportunidades qualificadas geradas por mês`

```text
Qualified Opportunities / Month
```

Uma oportunidade qualificada pode ser:

* solicitação de orçamento válida;
* lead qualificado pelo MobiVolt;
* contato comercial identificado;
* WhatsApp com intenção comercial;
* formulário comercial válido.

Essa métrica conecta diretamente:

**tráfego + produto + empresas + monetização.**

---

# 5. Funil principal

```text
Visitantes
    ↓
Buscas
    ↓
Visualizações de empresas
    ↓
Comparações
    ↓
Interações comerciais
    ↓
Leads
    ↓
Leads qualificados
    ↓
Empresas contatadas
    ↓
Oportunidades
    ↓
Conversões
```

Devemos medir conversão entre cada estágio.

---

# 6. Requisitos mínimos — MVP operacional

## R1 — Descoberta

O usuário deve conseguir:

* pesquisar empresas;
* pesquisar por localização;
* navegar por categoria;
* visualizar resultados;
* abrir perfil empresarial;
* visualizar produtos/serviços.

### Aceite

* [ ] Busca retorna empresas válidas.
* [ ] Empresa possui página pública.
* [ ] Categoria possui página navegável.
* [ ] URLs públicas funcionam.
* [ ] Não existem páginas críticas retornando 500.
* [ ] Mobile funciona sem scroll horizontal.

---

# 7. R2 — Perfil da empresa

Cada empresa deve possuir uma identidade comercial completa.

### Informações mínimas

* nome;
* logo;
* localização;
* descrição;
* categorias;
* serviços;
* avaliações;
* rating;
* Trust;
* selo de verificação;
* telefone/WhatsApp quando permitido;
* CTA de orçamento;
* produtos/ofertas quando existentes.

### Aceite

* [ ] Empresa sem reviews aparece como **sem avaliações**.
* [ ] Nenhuma reputação fictícia.
* [ ] Rating público deriva somente do contrato de reputação.
* [ ] CTA gera evento mensurável.
* [ ] Contato respeita autenticação/gating definido.

A proteção da reputação é especialmente importante porque `Review`, `SectorRating` e `ReviewForm` já estão classificados no domínio de Reputação e o Review alimenta frontend, Trust Score e Ranking. 

---

# 8. R3 — Reputação orgânica

### Regra central

```text
Review aprovada
       ↓
ReviewAggregate
       ↓
Company.rating_avg
Company.rating_count
       ↓
representação pública
```

### Não podem artificialmente alterar rating

* pending;
* rejected;
* in_analysis;
* flagged;
* contested;
* featured;
* plano pago;
* CampaignReview;
* Badge;
* verified;
* SectorRating.

### Aceite

* [x] Matriz A–J protegida.
* [x] Apenas approved entra.
* [x] Aggregate/cache coerentes.
* [x] Sem placeholder público.
* [x] Trust separado.
* [x] Ranking separado.

---

# 9. R4 — Comparação

O usuário deve conseguir comparar empresas antes da decisão.

### Mínimo

* reputação;
* quantidade de avaliações;
* categorias;
* localização/cobertura;
* produtos/serviços;
* diferenciais;
* Trust;
* verificação.

### Aceite

* [ ] Comparação entre empresas funcional.
* [ ] Nenhum dado inexistente é inventado.
* [ ] Critérios possuem significado claro.
* [ ] CTA comercial permanece disponível.

---

# 10. R5 — Geração de leads

Todos os principais CTAs devem convergir para uma infraestrutura mensurável.

### Fontes

```text
Perfil
Busca
Comparação
Conteúdo
Material
WhatsApp
Formulário
MobiVolt AI
Campanha
```

### Lead mínimo

```text
lead_id
source
company_id
category
location
timestamp
status
utm_source
utm_medium
utm_campaign
```

Quando disponível:

```text
score
intent
temperature
product_interest
budget
next_action
```

### Aceite

* [ ] Lead possui origem.
* [ ] Lead possui timestamp.
* [ ] Empresa receptora identificável.
* [ ] Eventos duplicados são tratados.
* [ ] Lead pode ser acompanhado até o status comercial.

---

# 11. R6 — MobiVolt AI

A auditoria confirma que o domínio já possui `ChatSession`, `ChatLead`, `ChatInsight` e `KnowledgeArticle`, formando um fluxo de conversa → extração → lead → inteligência. 

### Função

Não ser apenas chatbot.

Deve atuar como:

**assistente de decisão + qualificador de demanda.**

```text
Pergunta
 ↓
Conversa
 ↓
Intenção
 ↓
Necessidade
 ↓
Localização
 ↓
Qualificação
 ↓
Lead
 ↓
Empresa
```

### Aceite

* [ ] Sessão persistida.
* [ ] Mensagens persistidas.
* [ ] Lead vinculado à origem.
* [ ] Score rastreável.
* [ ] Empresa pode assumir atendimento.
* [ ] Histórico permanece disponível.

---

# 12. R7 — Catálogo & Produtos

Contrato:

### Product.price

**Preço de referência.**

### ProductOffer.price

**Preço comercial da empresa.**

### Pricing

Legado/indeterminado — não deve ser promovido a fonte canônica.

### Aceite

* [ ] Não existe fallback silencioso entre preços.
* [ ] UI distingue referência de oferta.
* [ ] Product 360 apresenta contexto.
* [ ] Empresa pode estar vinculada ao produto.
* [ ] Ofertas permanecem vinculadas à empresa.

---

# 13. R8 — Monetização B2B

A empresa poderá evoluir por:

```text
FREE
 ↓
ESSENCIAL
 ↓
PRO
 ↓
ENTERPRISE
```

Receitas adicionais:

* add-ons;
* banners;
* campanhas;
* publicidade;
* destaque;
* produtos comerciais;
* leads premium futuramente.

### Regra crítica

**Pagar nunca pode comprar reputação orgânica.**

Pode comprar:

* exposição;
* ferramentas;
* analytics;
* automação;
* publicidade;
* funcionalidades.

Não pode comprar:

* estrelas;
* reviews orgânicos;
* rating;
* reputação falsa.

---

# 14. R9 — Publicidade & Campanhas

Separar claramente:

```text
ORGÂNICO                PATROCINADO

Review                   CampaignReview
Rating                   Banner
Trust                    Campaign
Ranking orgânico         Sponsored placement
```

O usuário deve conseguir identificar conteúdo patrocinado.

---

# 15. R10 — Administração

O ActiveAdmin deve funcionar como **console operacional**, e não como uma lista de tabelas.

A auditoria técnica (disponível no relatório persistido [auditoria_pente_fino_activeadmin.md](file:///home/felipe/.gemini/antigravity-ide/brain/b1995928-94e6-4f4c-be6d-66a75ec931fb/auditoria_pente_fino_activeadmin.md)) propõe justamente reduzir a navegação dispersa de mais de 35 entradas para 11 hubs de domínio. 

Estrutura alvo:

```text
Dashboard
Empresas
SaaS Leads
Publicidade & Campanhas
Catálogo & Produtos
Reputação
Conteúdo
IA & Atendimento
Planos & Billing
Usuários & Acesso
Sistema
```

---

# 16. Quick Wins

## QW1 — Limpar definitivamente o ActiveAdmin

Eliminar menus técnicos redundantes após confirmar seus Hubs.

**Impacto:** alto
**Esforço:** baixo

---

## QW2 — Hub Conteúdo

É o próximo Hub com forte justificativa arquitetural.

A auditoria recomenda centralizar:

* artigos;
* páginas SEO;
* FAQs;
* fórum;
* ativos digitais;
* moderação;
* materiais empresariais. 

---

## QW3 — Hub IA & Atendimento

Unificar:

* Chat IA;
* MobiVolt;
* sessões;
* leads;
* insights;
* conhecimento.

---

## QW4 — Instrumentar o funil inteiro

Criar eventos consistentes:

```text
search_performed
company_viewed
product_viewed
comparison_started
whatsapp_clicked
quote_requested
chat_started
lead_created
lead_qualified
company_contacted
review_submitted
review_approved
```

---

## QW5 — Dashboard executivo

Mostrar apenas números que ajudam a decidir:

**Aquisição**

* visitantes;
* tráfego orgânico;
* buscas.

**Marketplace**

* empresas ativas;
* empresas verificadas;
* produtos;
* reviews.

**Conversão**

* leads;
* leads qualificados;
* CPL;
* taxa de conversão.

**Receita**

* MRR;
* ARR;
* ARPA;
* churn;
* expansão.

---

# 17. User Stories — Consumidor

### US-01 — Encontrar empresa

> Como consumidor, quero encontrar empresas solares da minha região para descobrir fornecedores disponíveis.

**Aceite**

* [ ] busca por localização;
* [ ] resultados relevantes;
* [ ] perfil acessível;
* [ ] nenhuma empresa inexistente/fictícia.

### US-02 — Comparar

> Como consumidor, quero comparar empresas para tomar uma decisão mais segura.

**Aceite**

* [ ] selecionar empresas;
* [ ] comparar critérios consistentes;
* [ ] acessar os perfis;
* [ ] iniciar contato.

### US-03 — Avaliar

> Como cliente, quero avaliar minha experiência para ajudar outros consumidores.

**Aceite**

* [ ] submissão persistida;
* [ ] passa por moderação;
* [ ] somente approved influencia reputação.

---

# 18. User Stories — Empresa

### US-04 — Receber oportunidades

> Como empresa solar, quero receber leads qualificados para gerar novas vendas.

**Aceite**

* [ ] empresa correta recebe lead;
* [ ] origem identificada;
* [ ] dados comerciais disponíveis;
* [ ] status pode ser acompanhado.

### US-05 — Construir reputação

> Como empresa, quero acumular avaliações legítimas para demonstrar confiança aos consumidores.

**Aceite**

* [ ] avaliações aprovadas atualizam reputação;
* [ ] plano não altera rating;
* [ ] publicidade não altera rating.

### US-06 — Medir resultados

> Como empresa, quero entender quantas pessoas visualizaram meu perfil e viraram oportunidades.

**Aceite**

* [ ] impressões;
* [ ] visualizações;
* [ ] cliques;
* [ ] leads;
* [ ] conversões disponíveis quando mensuráveis.

---

# 19. User Stories — Administrador

### US-07 — Operação por domínio

> Como administrador, quero acessar cada área por um Hub para operar a plataforma sem navegar por dezenas de tabelas técnicas.

### US-08 — Moderar reputação

> Como administrador, quero visualizar a fila de avaliações que exigem análise.

### US-09 — Investigar empresa

> Como administrador, quero abrir uma Empresa 360 e compreender rapidamente sua situação operacional.

### US-10 — Auditoria

> Como administrador, quero rastrear alterações críticas para investigar incidentes sem acessar diretamente o banco.

---

# 20. Critérios de aceite globais

Antes de considerar essa fundação pronta:

### Produto

* [ ] busca funcional;
* [ ] perfis funcionais;
* [ ] comparação funcional;
* [ ] reputação consistente;
* [ ] geração de lead funcional;
* [ ] MobiVolt rastreável;
* [ ] planos funcionais.

### Integridade

* [ ] nenhum rating fictício;
* [ ] nenhuma compra altera rating;
* [ ] campanhas separadas de orgânico;
* [ ] preço de referência separado de oferta.

### Admin

* [ ] todos os Hubs retornam 200;
* [ ] sem arrays/hashes vazando no Arbre;
* [ ] sem páginas 500;
* [ ] URLs antigas preservadas;
* [ ] policies preservadas.

### Engenharia

* [ ] `ruby -c` PASS;
* [ ] `rails zeitwerk:check` PASS;
* [ ] request specs PASS;
* [ ] invariantes de reputação PASS;
* [ ] `git diff --check` PASS;
* [ ] smoke tests PASS.

---

# 21. Task List priorizada

| #  | Task                                | Prioridade | Impacto       |
| -- | ----------------------------------- | ---------- | ------------- |
| 1  | Validar runtime dos Hubs existentes | **P0**     | Crítico       |
| 2  | Eliminar qualquer ActiveAdmin 500   | **P0**     | Crítico       |
| 3  | Garantir integridade Reputação A–J  | **P0**     | Crítico       |
| 4  | Validar sitemap/SEO                 | **P0/P1**  | Muito alto    |
| 5  | Criar Hub Conteúdo                  | **P1**     | Alto          |
| 6  | Criar Hub IA & Atendimento          | **P1**     | Alto          |
| 7  | Criar Hub Usuários & Acesso         | **P1**     | Médio/alto    |
| 8  | Criar Hub Sistema                   | **P1**     | Médio         |
| 9  | Cleanup final do menu               | **P1**     | Alto          |
| 10 | Instrumentar funil PostHog          | **P1**     | Muito alto    |
| 11 | Dashboard executivo de KPIs         | **P1**     | Muito alto    |
| 12 | Analytics B2B por empresa           | **P1**     | Receita       |
| 13 | Atribuição lead → empresa → origem  | **P1**     | Receita       |
| 14 | Otimizar onboarding empresarial     | **P2**     | Receita       |
| 15 | Automação de coleta de reviews      | **P2**     | Growth        |
| 16 | Inteligência competitiva            | **P2**     | Diferenciação |

---

# 22. Roadmap recomendado

### Fase 1 — Fundação

```text
Runtime
Reputação
SEO
Hubs
Menus
Observabilidade
```

### Fase 2 — Aquisição

```text
SEO
Conteúdo
Categorias
Busca
Landing pages
Local rankings
```

### Fase 3 — Conversão

```text
Comparação
WhatsApp
Orçamento
MobiVolt
Lead scoring
Distribuição
```

### Fase 4 — Monetização

```text
Planos
Add-ons
Publicidade
Campanhas
Analytics B2B
Upsell
```

### Fase 5 — Flywheel

```text
Venda
→ Review
→ Reputação
→ Ranking
→ Visibilidade
→ Lead
→ Venda
```

---

# 23. Definition of Done

Uma feature só é **DONE** quando:

```text
Código implementado
        +
Regra de domínio preservada
        +
Teste automatizado
        +
Smoke test
        +
Observabilidade
        +
Evento analytics quando aplicável
        +
Empty state
        +
Erro tratado
        +
Responsividade
        +
Permissão/Pundit
        +
Sem regressão
```

**“A página abriu” não é Definition of Done.**

---

# 24. Resultado esperado do produto

O objetivo final é criar três motores conectados:

### MOTOR 1 — AQUISIÇÃO

**SEO + conteúdo + busca + marketplace**

↓

### MOTOR 2 — CONVERSÃO

**comparação + orçamento + WhatsApp + MobiVolt + leads**

↓

### MOTOR 3 — CONFIANÇA

**reviews + reputação + Trust + ranking**

↓

E o resultado comercial:

# **mais confiança → mais conversão → mais empresas pagando → mais receita recorrente.**
