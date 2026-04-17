# Diagnóstico de Planos, Monetização e Feature Gating

Data: 2026-03-12

## 1. Resumo executivo

A imagem de referência descreve um modelo de monetização simples e forte:

- um perfil básico gratuito com presença mínima
- um perfil pago que desbloqueia merchandising, prova social, CTAs, pricing, materiais, mídia e destaque comercial
- remoção de distrações competitivas no plano pago

O app atual já tem boa parte da infraestrutura necessária para isso, mas ainda não tem um contrato único de monetização. Hoje a lógica está fragmentada em três camadas:

1. `Plan.features_json` no backend
2. flags soltas na `Company` como `active_admin`, `social_proof_enabled`, `financing_tab_visible`, `whatsapp_enabled`
3. componentes do frontend que ainda tratam algumas flags como se fossem o próprio plano

Conclusão objetiva:

- a base para implantar esse modelo já existe
- não falta "começar do zero"
- falta consolidar governança, catálogo canônico de features e enforcement consistente entre backend, ActiveAdmin e frontend

O maior desvio atual é este:

- o sistema já aponta para `Plan.features_json` como fonte de verdade
- mas o produto público ainda usa `active_admin` como proxy de recurso pago para CTA/orçamento/WhatsApp

Isso precisa ser corrigido antes de escalar planos.

## 2. O que a imagem realmente representa

A imagem não mostra uma tabela de preço numérico. Ela mostra uma matriz binária de entitlement:

- `Nenhum plano`
- `Pago`

Em termos de estratégia, isso equivale a um freemium com um tier pago principal.

O racional comercial da imagem é:

- gratuito: presença básica e comparável ao restante do marketplace
- pago: mais espaço de narrativa, mais prova social, mais conversão e menos vazamento para concorrentes

O ponto mais importante da referência não é "cobrar por qualquer coisa". É este:

- o plano pago compra destaque comercial e redução de fuga para concorrentes

Isso aparece claramente em:

- `Alternativas`: liberado no gratuito, removido no pago
- `Banners de concorrentes`: liberado no gratuito, removido no pago

Essa é uma alavanca forte de upgrade e hoje ainda não está produtozada de forma limpa no app.

## 3. Leitura do estado atual do sistema

### 3.1 Backend de planos já existe

O ActiveAdmin de planos já permite modelar planos com `price` e `features_json` em `AB0-1-back/app/admin/plans.rb`.

Hoje isso já existe:

- cadastro de plano
- preço do plano
- `features_json` como hash de entitlements

Limitação atual:

- a edição é feita como JSON cru em textarea
- isso é funcional, mas ruim para operação, governança e consistência

### 3.2 Empresa já recebe plano e flags adicionais

No ActiveAdmin de empresas em `AB0-1-back/app/admin/companies.rb`, a empresa já tem:

- `plan_id`
- `plan_status`
- `social_proof_enabled`
- `active_admin`
- `financing_tab_visible`
- `whatsapp_enabled`

Isso prova que a plataforma já tem:

- vínculo empresa -> plano
- status de plano
- overrides por empresa

Limitação atual:

- esses controles estão misturados entre "entitlement de plano" e "flag operacional"
- isso dificulta saber o que é do plano e o que é exceção manual

### 3.3 O domínio já tem helpers de feature gating

O model `Company` em `AB0-1-back/app/models/company.rb` já possui uma base muito útil:

- `effective_plan_features`
- `resolved_plan_features`
- `feature_enabled_from_plan?`
- `feature_value_from_plan`
- `can_use_social_proof?`
- `financing_feature_allowed?`
- `media_upload_allowed?`
- `can_view_intent_scores?`
- `can_use_webhooks?`

Isso é sinal de maturidade arquitetural. O projeto já começou a caminhar na direção certa.

O problema é que nem tudo segue esse caminho.

Exemplo de dívida estrutural:

- `quote_feature_enabled?` ainda depende de `active_admin`
- `cta_whatsapp_enabled` continua acoplado a essa mesma lógica

Ou seja:

- algumas features já usam plano
- outras ainda usam uma flag herdada

### 3.4 O próprio projeto já documentou a direção correta

Existe uma ADR aceita em `AB0-1-back/docs/ADR-001-plan-feature-gating.md`.

Essa ADR já aponta para:

- `effective_plan_features`
- `resolved_plan_features`
- `feature_value_from_plan`

Diagnóstico:

- a arquitetura desejada já foi decidida
- o problema não é conceitual
- o problema é implementação incompleta e inconsistência de adoção

### 3.5 O dashboard já recebe `plan_features`

O endpoint `GET /api/v1/company_dashboard/stats` em `AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb` já devolve:

- `stats`
- `plan_features`

E o hook `useCompanyDashboardData` em `AB0-1-front/app/dashboard/hooks/useCompanyDashboardData.ts` já armazena:

- `planFeatures`

Isso é excelente porque elimina a necessidade de inventar um novo canal de distribuição de entitlement.

### 3.6 Parte do frontend já faz gating por plano

Hoje já existe gating funcional, por exemplo:

- `MediaGallery.tsx` usa `planFeatures`
- `BannersSponsorship.tsx` usa `planFeatures`
- `PerformanceMetrics.tsx` já tem overlay premium
- `LeadsOpportunities.tsx` já tem paywall premium

Ou seja:

- o padrão já existe
- falta torná-lo uniforme

### 3.7 Parte do frontend ainda usa uma semântica errada

No produto público, vários pontos ainda usam `active_admin === true` como se isso fosse o critério de "cliente pagante":

- `components/CompanyCard.tsx`
- `app/companies/[id]/components/CompanyHero.tsx`
- `app/companies/[id]/components/StickyCTA.tsx`
- `app/companies/[id]/CompanyDetailClient.tsx`

Isso é hoje o principal ponto de desalinhamento entre negócio e implementação.

## 4. Matriz: referência da imagem vs estado atual do app

Legenda:

- `Existe`: já existe e é utilizável
- `Parcial`: existe capacidade técnica, mas não está produtozado como entitlement coerente
- `Falta`: precisa ser implementado ou reorganizado de forma relevante

| Feature da imagem | Estado atual | Diagnóstico |
|---|---|---|
| Descrição do produto e informações adicionais | Existe | Produtos e dados públicos já existem no dashboard e no perfil público. |
| Área de funcionalidades do produto | Existe | `ProductsManagement` já cobre parte disso. |
| Área de prêmios e selos próprios | Parcial | Existem `awards`, `badges` e cards públicos, mas ainda não como feature premium claramente governada por plano. |
| Para quem é indicado? | Parcial | Há estrutura para atributos e discurso comercial, mas não uma feature dedicada e claramente monetizada. |
| Banner promocional do produto | Parcial | `BannersSponsorship.tsx` existe e já tem paywall, mas ainda não está ligado a um catálogo canônico de features. |
| Produto verificado | Parcial | Existem `verified`, `verified_badge` e badges, mas falta tratar como entitlement comercial explícito. |
| Selos de destaque | Parcial | Estrutura de `badges` existe, mas a lógica de plano ainda não é centralizada. |
| CTAs personalizados | Parcial | Existe configuração de CTA, mas o gating principal ainda usa `active_admin`. |
| Área de planos e preços | Parcial | Existem `Product.price`, `Pricing`, abas de dashboard e navegação, mas o produto não está modelado como "pricing block premium" canônico. |
| Oferta especial | Parcial | Há espaço para merchandising/patrocínio, mas não uma feature dedicada com governança própria. |
| Descrição patrocinada | Parcial | A aba existe, mas usa `ProductsManagement` genérico. |
| Materiais baixáveis | Parcial | Existem `gated_downloads`, `downloadables` e `GatedContentDownload`, porém a aba do dashboard está ligada a `MediaGallery`, o que é um mismatch. |
| Mídias do seu produto | Existe | `MediaGallery` já existe e já faz gating por plano. |
| Área de links de páginas da empresa | Parcial | Links/redes sociais existem, mas não como módulo premium explícito. |
| Fórum + destaque uma postagem | Parcial | Há objetos de fórum no admin, mas não há produto dashboard premium claramente montado para isso. |
| Destaque uma avaliação | Parcial | `can_use_social_proof?` existe e o dashboard já protege destaque de review, mas falta padronizar como feature premium no catálogo. |
| Dúvidas frequentes | Parcial | FAQ existe no backend, no ActiveAdmin e no público, mas ainda não está acoplado ao plano de forma explícita. |
| Alternativas | Parcial | Há dados de concorrência/competidores, mas a regra "mostrar para free e suprimir para pago" não está formalizada como entitlement de produto público. |
| Banners de concorrentes | Falta | O princípio de supressão por plano não aparece como regra consolidada no frontend público. |

## 5. O que já está mais perto do modelo da imagem

Os melhores encaixes atuais com a referência são:

### 5.1 Banners e patrocínio

`AB0-1-front/app/dashboard/components/BannersSponsorship.tsx`

Já existe:

- componente dedicado
- leitura de `planFeatures`
- estado de bloqueio
- caminho natural para venda

### 5.2 Mídia do produto

`AB0-1-front/app/dashboard/components/MediaGallery.tsx`

Já existe:

- regra de permissão por feature
- integração com dados da empresa
- uso real no dashboard

### 5.3 Analytics premium

`AB0-1-front/app/dashboard/components/PerformanceMetrics.tsx`
`AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb`

Já existe:

- no backend: `is_premium_analytics` e `restricted_metrics`
- no frontend: overlay, blur e CTA de upgrade

Isso serve como molde para outras features.

### 5.4 Social proof e review destacada

`AB0-1-back/app/models/company.rb`

Já existe:

- `can_use_social_proof?`
- proteção backend para destaque de review

Esse é um bom exemplo de feature que já está quase no formato certo.

## 6. Onde estão os gaps mais importantes

### 6.1 O produto ainda não tem um catálogo canônico de features

Hoje a feature pode estar:

- em `plans.features_json`
- em campo booleano de `companies`
- em lógica direta no frontend

Isso gera:

- inconsistência
- bugs de liberação
- dificuldade operacional
- dificuldade de vender e explicar planos

### 6.2 `active_admin` virou um falso sinônimo de "plano pago"

Esse é o desvio mais crítico.

Hoje `active_admin` ainda controla, na prática:

- quote
- WhatsApp CTA
- acesso a interações comerciais no perfil público

Isso está semanticamente errado. `active_admin` deveria significar capacidade administrativa ou legado operacional, não entitlement comercial do plano.

### 6.3 A navegação do dashboard ainda é mais estática do que orientada a entitlement

Em `AB0-1-front/config/navigation.ts` e `EnterpriseDashboard.tsx`, as abas existem de forma ampla, mas a composição ainda não nasce de um contrato central de acesso.

Problema prático:

- o menu mostra áreas que nem sempre correspondem a módulos premium bem definidos
- algumas abas apontam para componentes genéricos demais

Exemplo claro:

- `product-downloads` renderiza `MediaGallery`

Isso não representa corretamente "materiais baixáveis".

### 6.4 Blur no frontend não é segurança

Isso precisa ficar explícito.

Se o backend continuar entregando o dado real de uma feature paga, aplicar blur no frontend não protege nada. O usuário ainda pode:

- inspecionar DOM
- interceptar API
- ler payload

Portanto:

- blur é UX de upsell
- não é controle de acesso

Toda feature sensível deve ser protegida primeiro no backend.

## 7. Arquitetura recomendada

## 7.1 Fonte única de verdade

Recomendação:

- `Plan.features_json` deve ser a fonte canônica de entitlement
- `Company.plan_features` deve ser apenas override excepcional
- flags herdadas devem ser migradas para aliases temporários e depois aposentadas

### Catálogo sugerido de features

Sugestão de chaves canônicas:

```json
{
  "product_description": true,
  "product_features_block": true,
  "ideal_customer_block": false,
  "promo_banner": false,
  "verified_product": false,
  "highlight_badges": false,
  "custom_ctas": false,
  "pricing_table": false,
  "special_offer": false,
  "sponsored_description": false,
  "downloadable_materials": false,
  "media_gallery": false,
  "company_links_block": false,
  "forum_highlight": false,
  "featured_review": false,
  "faq_block": false,
  "show_alternatives": true,
  "show_competitor_banners": true,
  "advanced_analytics": false,
  "leads_marketplace": false,
  "social_proof": false,
  "financing_simulation": false,
  "webhooks": false,
  "intent_scores": false
}
```

Observação importante:

- `show_alternatives`
- `show_competitor_banners`

são chaves negativas no sentido comercial. Elas existem justamente para formalizar o diferencial do plano pago.

### Regra recomendada por plano

Plano gratuito:

- `show_alternatives = true`
- `show_competitor_banners = true`

Plano pago:

- `show_alternatives = false`
- `show_competitor_banners = false`

## 7.2 Criar um resolvedor central de acesso

Recomendação:

- criar um serviço como `CompanyFeatureAccessResolver`

Responsabilidade:

- receber `company`
- combinar plano + overrides + status do plano
- devolver um payload pronto para frontend

Formato sugerido:

```json
{
  "custom_ctas": {
    "state": "enabled"
  },
  "advanced_analytics": {
    "state": "locked",
    "reason": "upgrade_required",
    "upsell_copy": "Desbloqueie analytics avançado"
  },
  "webhooks": {
    "state": "hidden",
    "reason": "not_in_plan"
  }
}
```

Estados sugeridos:

- `enabled`
- `locked`
- `hidden`

Isso resolve um problema atual do frontend:

- hoje ele precisa adivinhar se deve mostrar, bloquear ou esconder

## 7.3 Backend deve aplicar enforcement real

Regras:

- feature sensível: backend não entrega o dado real para plano sem acesso
- feature cosmética: backend pode devolver metadata mínima para teaser/upsell

Exemplos:

- `advanced_analytics`: ok entregar resumo limitado e bloquear séries detalhadas
- `leads_marketplace`: não entregar contatos reais para plano sem acesso
- `downloadable_materials`: não permitir CRUD nem consumo administrativo sem entitlement
- `custom_ctas`: não expor CTA premium no perfil público sem feature

## 8. Como controlar isso pelo ActiveAdmin na aba de planos

## 8.1 O que existe hoje

Hoje o ActiveAdmin de planos já consegue salvar:

- nome
- descrição
- preço
- `features_json`

Isso é suficiente para a base técnica, mas insuficiente para operação de negócio.

## 8.2 O que deveria existir

Na aba de planos, em vez de um textarea JSON cru, o ideal é ter grupos de controle:

### Grupo 1: Perfil público

- descrição do produto
- funcionalidades
- para quem é indicado
- links da empresa
- FAQ

### Grupo 2: Conversão

- CTAs personalizados
- pricing table
- oferta especial
- descrição patrocinada

### Grupo 3: Prova social

- produto verificado
- selos de destaque
- área de prêmios
- destaque de avaliação

### Grupo 4: Conteúdo

- mídia
- materiais baixáveis
- banner promocional

### Grupo 5: Inteligência e dados

- analytics avançado
- leads/oportunidades
- intent scores
- webhooks

### Grupo 6: Experiência competitiva

- mostrar alternativas
- mostrar banners de concorrentes

## 8.3 UX recomendada no ActiveAdmin

Na prática, a tela de plano deveria ter:

- checkboxes para booleanos
- numeric inputs para limites
- ajuda textual curta explicando impacto comercial da feature
- preview do plano resultante
- validação para evitar combinações incoerentes

Exemplo de incoerência que o admin não deveria conseguir salvar:

- `custom_ctas = true`
- `pricing_table = false`
- `special_offer = true`

sem um racional claro, se o produto vender esses itens como pacote unificado

## 8.4 Onde manter overrides por empresa

O ActiveAdmin da empresa deve manter:

- `plan_id`
- `plan_status`
- poucos overrides justificados

Recomendação:

- override só para exceção comercial
- não usar overrides para modelar produto

Sugestão:

- exibir na empresa um bloco "Feature access preview"
- mostrar o resultado final resolvido
- destacar o que vem do plano e o que foi sobrescrito manualmente

## 9. Como liberar as features conforme o plano

## 9.1 Regra de decisão

Toda feature deve passar por esta ordem:

1. verificar `plan_status`
2. carregar `plan.features_json`
3. aplicar `company.plan_features` somente se houver override permitido
4. devolver `enabled`, `locked` ou `hidden`

## 9.2 Regras recomendadas por tipo de feature

### Enabled

Quando:

- a feature pertence ao plano ativo

Comportamento:

- tab aparece
- conteúdo interativo completo
- backend entrega payload completo

### Locked

Quando:

- faz sentido usar a própria feature como alavanca de upgrade

Comportamento:

- tab aparece
- conteúdo teaser aparece com blur leve
- CTA de upgrade
- backend entrega só teaser seguro

Exemplos bons para `locked`:

- analytics avançado
- banner promocional
- descrição patrocinada
- pricing table
- FAQ premium
- materiais baixáveis
- mídia premium

### Hidden

Quando:

- a feature é sensível
- ou não faz sentido poluir a experiência do cliente sem acesso

Comportamento:

- tab não aparece
- endpoint sensível não devolve dados reais

Exemplos bons para `hidden`:

- webhooks
- intent scores
- leads com contato completo
- ferramentas internas ou enterprise

## 10. Como o dashboard deve se comportar

## 10.1 O menu não deve ser fixo

Hoje a navegação é muito estática.

Recomendação:

- construir as tabs a partir do `feature_access`

Exemplo:

- `promo_banner` = enabled -> mostra tab normal
- `downloadable_materials` = locked -> mostra tab com cadeado e teaser
- `webhooks` = hidden -> não mostra tab

## 10.2 O dashboard deve trabalhar com três camadas

### Camada 1: navegação

- filtra tabs por `enabled/locked/hidden`

### Camada 2: conteúdo

- componente usa o mesmo contrato de acesso

### Camada 3: backend

- API confirma o mesmo entitlement

Isso evita o cenário atual em que:

- o menu mostra algo
- o componente assume outra regra
- a API usa uma terceira regra

## 10.3 Recomendação específica para blur

Hoje existem casos com blur pesado demais:

- `blur-xl grayscale pointer-events-none opacity-40`

Isso transmite "recurso quebrado" mais do que "recurso premium".

Recomendação de UX:

- usar blur leve
- evitar grayscale forte
- manter leitura parcial da estrutura
- preservar sensação de produto premium, não de bloqueio agressivo

### Estilo sugerido

Para a camada bloqueada:

- `backdrop-blur-[1.5px]`
- `bg-background/30`

Para o conteúdo:

- `blur-[1.5px]`
- `opacity-80`

Evitar como padrão:

- `blur-xl`
- `grayscale`
- `opacity-40`

## 10.4 Observação crítica

Blur só deve ser aplicado sobre:

- mock seguro
- placeholder
- dado resumido permitido

Nunca sobre payload sensível completo entregue ao browser.

## 11. Recomendação feature por feature para o dashboard

### Mostrar habilitado no plano pago

- banner promocional
- descrição patrocinada
- pricing table
- oferta especial
- materiais baixáveis
- mídias
- selos/prêmios
- destaque de avaliação
- FAQ premium
- CTAs personalizados

### Mostrar com lock teaser no plano gratuito

- banner promocional
- descrição patrocinada
- pricing table
- materiais baixáveis
- mídias premium
- analytics avançado

### Esconder de quem não paga

- webhooks
- intent engine
- leads detalhados
- features enterprise internas

## 12. Como aplicar a lógica da imagem no produto público

O dashboard é só metade do problema. A outra metade é o perfil público da empresa.

### Para o plano gratuito

Recomendação:

- mostrar descrição básica
- mostrar funcionalidades básicas
- manter alternativas
- manter banners de concorrentes
- esconder CTAs premium
- esconder pricing block premium
- esconder oferta especial

### Para o plano pago

Recomendação:

- liberar CTAs personalizados
- liberar pricing area
- liberar selo/verificação
- liberar banner promocional
- liberar prova social premium
- remover alternativas
- remover banners de concorrentes

Essa remoção é um ponto de alto valor percebido e deveria entrar de forma explícita no desenho do plano.

## 13. Roadmap recomendado

## Fase 1: Canonicalização

- definir catálogo canônico de features
- mapear aliases legados
- parar de usar `active_admin` como plano pago

## Fase 2: Backend

- criar resolvedor central de feature access
- expor `feature_access` para frontend
- reforçar enforcement real nos endpoints sensíveis

## Fase 3: ActiveAdmin

- trocar textarea JSON por formulário estruturado
- adicionar preview do plano
- adicionar preview de access resultante na empresa

## Fase 4: Dashboard

- construir tabs com base em `feature_access`
- separar `enabled`, `locked`, `hidden`
- padronizar blur leve e CTA de upsell

## Fase 5: Perfil público

- migrar CTA/orçamento/WhatsApp para feature canônica
- aplicar regras de alternativas e banners de concorrentes
- ligar pricing/sponsored/offer blocks ao plano real

## Fase 6: Observabilidade e testes

- testes de resolver por plano
- specs de endpoint com plano grátis/pago
- testes de frontend para tabs enabled/locked/hidden
- tracking de upgrade intent

## 14. Priorização objetiva

Se a meta for capturar valor rápido com baixo risco, esta é a ordem correta:

1. parar de usar `active_admin` como gate comercial
2. canonizar `features_json`
3. estruturar a aba de planos no ActiveAdmin
4. alinhar dashboard com `feature_access`
5. monetizar corretamente o perfil público

## 15. Diagnóstico final

O app já possui:

- modelo de planos
- preço por plano
- vínculo empresa-plano
- overrides por empresa
- dashboard com `plan_features`
- vários módulos premium já construídos

O que falta não é volume de código. Falta disciplina de produto e arquitetura de monetização.

Hoje o cenário real é:

- a plataforma tem recursos suficientes para vender planos
- mas ainda não tem um sistema coeso de entitlement

Minha avaliação é:

- viabilidade de implantação: alta
- esforço: moderado
- risco principal: inconsistência entre backend e frontend
- maior oportunidade comercial: transformar o perfil público pago em um espaço sem distração de concorrente e com mais conversão

Em outras palavras:

- vocês já têm 60% a 70% da infraestrutura
- o ganho agora vem de consolidar, não de reinventar

## 16. Recomendação executiva

Não recomendo começar implementando telas novas.

Recomendo primeiro formalizar:

1. catálogo de features do plano
2. resolvedor central de acesso
3. ActiveAdmin estruturado para operar esse catálogo
4. contrato único para dashboard e perfil público

Depois disso, o restante vira execução previsível.
