# PDRM — Coletar Avaliações: Jornada de Engajamento V3
**Avalia Solar • Produto, Design, Requisitos e Mensuração • 05/11/2026**

**Status:** implementação em branch de revisão, sem deploy. **Owner:** Produto/Engenharia.
**URL existente:** `/dashboard?company_id={id}&tab=review-forms`.
**Referências visuais:** G2 Collect Reviews, `PREVIA_13_ICONES.png`, `avalia-solar-icons-sprite.svg` e catálogo de 13 ícones produzido para o Avalia Solar. **Identidade:** IBM/Carbon compacta, paleta Avalia Solar, sem ícones decorativos genéricos.

## 0. Decisão executiva
Evoluir `ReviewFormsManagement → ReviewCollectionHub → ReputationMilestones / ReviewShareCard`. Não criar um segundo backend, revogar a API existente nem adicionar um SDK embed nesta fase. Preservar `ReviewForms`, `ReviewFormEvents`, moderação, `company_badges` e as rotas atuais.

**Metas de produto da jornada inicial:** 1, 10 e **20** avaliações **aprovadas**. Esses valores são thresholds editoriais de engajamento solicitados para a V3, não critérios de ranking nem concessões de badges. A configuração anterior 1/10/30 permanece documentada para migração de UI.

## 1. Problema e proposta de valor
Uma empresa recém-cadastrada precisa saber o primeiro passo para receber avaliações legítimas e onde compartilhar seu link. A versão anterior distribuía canais em quatro cartões extensos e os marcos em três cards independentes. A V3 estabelece sequência visual simples:
`Progresso (3 marcos) → Compartilhar link → WhatsApp / E-mail / QR → Resultados por canal → Embed HTML`.

### Objetivos mensuráveis
- Aumentar a taxa de usuários do dashboard que **copiam um link válido** ou abrem um canal de compartilhamento.
- Melhorar a passagem de **formulário visualizado → iniciado → enviado → aprovado**.
- Reduzir fricção no mobile sem mascarar taxa de rejeição ou de moderação.
- Manter zero concessões automáticas de badge e zero afirmações estatísticas sem base.

**Não-objetivos:** vender leads; prometer ranking, trafego ou conversão; disparar e-mails diretamente sem integração autorizada; novo sistema de CRM; motor de gamificação paralelo; recriar o design G2 pixel a pixel.

## 2. Requisitos mínimos de produto (MVP/MVP+)

| ID | Prioridade | Requisito | Critério de aceite |
|---|---|---|---|
| RF-01 | P0 | Usar página `review-forms` existente | Sem nova rota ou perda de formulário já cadastrado |
| RF-02 | P0 | Mostrar a jornada antes do compartilhamento | Timeline visível também com zero formulários |
| RF-03 | P0 | Três marcos: 1, 10, 20 aprovadas | Contagem do Rails; status `achieved/current/locked` |
| RF-04 | P0 | Estado indisponível para falha nos dados | Mostrar “Progresso indisponível”, nunca 0 inventado |
| RF-05 | P0 | Texto de marcos sem alegações externas | Sem 65%, 100%, 100x, 85%, 2x ou “3x” na UI sem evidência |
| RF-06 | P0 | Separação de selos e metas | Marco de 20 não cria `company_badges` |
| RF-07 | P0 | Compartilhamento compacto | Link somente leitura; copiar e e-mail visíveis no mobile |
| RF-08 | P0 | Pausa revoga ações públicas de coleta | Botões de compartilhamento e snippet inativos |
| RF-09 | P0 | Nome real da empresa | Origem no contexto da empresa selecionada; não “Sua Empresa” fixo |
| RF-10 | P0 | Snippet HTML seguro | Escape contextual de `companyName`, URL gerada por helper |
| RF-11 | P0 | Acessibilidade | Botões nativos, leitura de status, foco visível, áreas ≥44px |
| RF-12 | P1 | Tracking compatível | Não enviar evento não reconhecido ao endpoint Rails |
| RF-13 | P1 | Rastreio sem atribuição falsa | Copiar link ≠ envio; abrir WhatsApp ≠ conversa entregue |
| RF-14 | P1 | Responsividade | 320/360/390/430px e desktop sem rolagem horizontal |
| RF-15 | P1 | Ícones proprietários e leves | Sprite com 13 símbolos e `viewBox` fixo; sem PNG gigante no runtime |
| RF-16 | P1 | Reduced motion e CLS | Transições só com `motion-safe`; dimensões reservadas |
| RF-17 | P1 | Testes | Jest de estados, cópia, XSS, pausa, navegação e filtros |
| RF-18 | P2 | Escala analítica | Agregar eventos por SQL quando crescimento justificar |
| RF-19 | P2 | Rollout | Usar flag preexistente `REVIEW_COLLECTION_HUB_V2` como gate/rollback do Hub |

## 3. User stories e Gherkin (Definition of Done)

**US-01 — Primeira avaliação (P0).** Como gestor sem avaliações aprovadas, quero ver a próxima meta.
- Given `approved=0`; When abro Coletar Avaliações; Then vejo `0/3`, o marco 1 como próximo e link para começar a compartilhar.
- Given `approved=null`; Then vejo “Progresso indisponível”, não um falso zero.

**US-02 — Progresso real (P0).** Como gestor com avaliações aprovadas, quero saber quais etapas concluí.
- Given `approved=9`; Then 1/3 completo, meta 10 ativa.
- Given `approved=10`; Then 2/3 completo, meta 20 ativa.
- Given `approved=20`; Then 3/3 completo, **sem badge outorgado automaticamente**.

**US-03 — Explorar marcos (P0).** Como usuário PWA, quero abrir cada marco com toque ou teclado.
- When aciono marco 2; Then detalhes/ações reais aparecem sem mudar minha contagem; o foco permanece previsível.

**US-04 — Copiar link (P0).** Como empresa, quero um CTA claro de cópia.
- Given formulário ativo; When clico Copiar link; Then o URL canônico é copiado e o feedback “Copiado!” aparece.
- Given formulário pausado; Then o CTA está desabilitado.

**US-05 — Solicitar por e-mail (P0).** Como empresa, quero abrir o drawer com o texto pronto.
- When aciono Solicitar via e-mail; Then o drawer existente abre. O sistema não declara e-mail enviado.

**US-06 — WhatsApp/QR (P0).** Como empresa, quero canais alternativos leves.
- When abro WhatsApp; Then abre `wa.me` com a mensagem preparada; o evento é “clique”, não entrega.
- When baixo QR; Then a rota do backend registra o download uma única vez.

**US-07 — Embed seguro (P0).** Como empresa, quero copiar HTML para meu site.
- Given empresa com nome `<script>`; When copio o snippet; Then o texto está escapado e não injeta HTML.
- Given formulário pausado; Then a cópia e a prévia funcional são desabilitadas.

**US-08 — Multiempresa (P0).** Como gestor de várias empresas, quero nomes corretos.
- When troco `company_id`; Then o título e os convites usam o novo nome resolvido na empresa ativa; dados antigos não são reaproveitados.

**US-09 — A11y/mobile (P1).** Como usuário em 320px ou com preferências de movimento reduzido, quero operar a jornada sem perda de informação.
- Then todo controle é alcançável por teclado e sem rolagem horizontal, e não há animação obrigatória.

**US-10 — Auditoria de reputação (P1).** Como administrador, quero distinguir marcos de badges oficiais.
- Given 20 avaliações; Then o painel mostra a meta concluída, **não** o selo verificado; somente `company_badges` cria outorga.

## 4. Comportamento e máquina de estados

| Aprovadas | Etapa 1 | Etapa 2 | Etapa 3 | Texto resumo |
|---:|---|---|---|---|
| null / erro | unavailable | unavailable | unavailable | Progresso indisponível |
| 0 | current | locked | locked | 0/3 marcos concluídos |
| 1–9 | achieved | current | locked | 1/3 marcos concluídos |
| 10–19 | achieved | achieved | current | 2/3 marcos concluídos |
| ≥20 | achieved | achieved | achieved | 3/3 marcos concluídos |

O usuário pode abrir detalhes de qualquer etapa, inclusive futura; abrir não significa concluir. O checkbox da tarefa é **somente leitura**, calculado pela contagem de avaliações aprovadas. Não existe API de “marcar como concluído”.

**Estados do formulário:** nenhum → criação; ativo → botões habilitados; inativo → visualização + aviso, sem novos links; falha → mensagem e recuperação, sem esconder dados ou prometer ações concluídas.

## 5. Copy aprovada na interface (sem estatísticas extrapoladas)
- Título: **Coletar Avaliações**; subtítulo: **Colete e gerencie avaliações de clientes**.
- Seção: **Seu caminho para mais avaliações**; apoio: **Cada marco aproxima sua empresa de um histórico público mais completo**.
- Etapa 1: **Ganhe sua Primeira Avaliação**; checklist: **Obtenha sua primeira avaliação aprovada**.
- Etapa 2: **Prepare-se para o Ranking**; checklist: **Colete 10 avaliações aprovadas**.
- Etapa 3: **Selo “Usuários nos Amam”**; checklist: **Colete 20 avaliações aprovadas**. **Nota obrigatória:** marco ilustrativo, não badge oficial.
- Share: **Compartilhe seu link de avaliação diretamente**; CTA primário: **Copiar link**; secundário: **Solicitar via e-mail**; alternativas: WhatsApp e QR Code.
- Ajuda: “Como o Avalia Solar me ajuda a coletar avaliações?” deve apontar para ajuda real quando disponível; evitar botão sem destino.

### Registro de claims fornecidos (preservados, BLOQUEADOS para publicação)
| Claim original adaptado | Situação | Evidência necessária |
|---|---|---|
| “Quase **65%** dos fornecedores ... primeira avaliação em até **7 dias**.” | Não verificado no Avalia Solar | Coorte, período, denominador, publicação |
| “Mais da metade dos compradores lê **3 ou mais** avaliações...” | Não verificado para o setor | Pesquisa e definição da amostra |
| “Tráfego orgânico **dobra** após primeira avaliação.” | Não verificado/causalidade | Experimento ou séries com controle |
| “**100%** dos fornecedores pagos ... no Ranking Avalia Solar.” | Não verificado e conflita com não vender posição | Rejeitar até validação e política oficial |
| “Empresas no Ranking recebem **100x** mais visualizações...” | Não verificado | Eventos de comparação e controle de seleção |
| “**20** avaliações ... onde **85%** dos compradores param de navegar.” | Não verificado | Comportamento de navegação da plataforma |
| “Selo começa a aparecer ... relatórios trimestrais.” | Não implementado como concessão automática | Regras de concessão e publicações reais |
| “Detentores ... aumento significativo em confiança e leads.” | Não verificado | Métricas, definição estatística e metodologia |
| Texto legado “**10+ reviews convertem 3x mais**” | Não verificado | Removido da jornada V3 |

**Governança:** números são preservados aqui para revisão editorial, **não** emitidos como fatos no frontend. Revisar com Dados/Legal/Produto antes de qualquer ativação.

## 6. Sistema de ícones
**Fonte de design:** `PREVIA_13_ICONES.png` (folha visual); fonte runtime `public/assets/icons/review-collection/avalia-solar-icons-sprite.svg`.

| Grupo | SVGs | Aplicação |
|---|---|---|
| Marco 1 | 04 balão, 02 usuários, 03 carrinho, 05 globo | Selo principal e dicas contextuais |
| Marco 2 | 06 matriz, 02 usuários, 07 tendência | Ranking e desenvolvimento |
| Marco 3 | 08 escudo, 07 tendência, 09 medalha, 10 raio | Meta final sem certificação automática |
| Ações | 11 elo, 12 copiar, 13 seta | Link, copiar e e-mail |
| Ajuda eventual | 01 estrelas IA | Somente quando há recurso de IA real, não como decoração |

**Implementação:** SVG sprite `<use href="/assets/...sprite.svg#id">`, dimensões explícitas, ícones decorativos `aria-hidden=true`; texto no botão e labels sem depender do ícone. O PNG de prévia pertence à documentação, não deve ser carregado no PWA.

## 7. Layout e responsividade
- **320–430 px:** três linhas verticais compactas; ícones em círculos de 44px; conteúdo textual ao lado; detalhe da etapa selecionada imediatamente abaixo da trilha; link + dois CTAs em coluna; outras ações abaixo.
- **600–767 px:** espaçamento 12–16px e controles de 44px com quebra natural.
- **≥768 px:** timeline horizontal de três etapas; conector decorativo; detalhes em grade de até três colunas; barra de link e ações lado a lado.
- **Tokens:** `#0A1F44` navy, `#0B5FFF` azul, `#FFC107` amarelo solar, `#FF766A` coral (somente informação contextual), `#D8E2F0` borda, branco e superfície pálida `#F1F3FD`.
- **Tipografia:** IBM Plex Sans quando já carregada; não introduzir fontes novas pelo componente.
- **Evitar:** fundos grandes saturados, hero alto, ícones genéricos, cartões duplicados, texto em 9px para ações críticas, truncamento de números.

## 8. Microanimações e acessibilidade

| Gatilho | Movimento | Duração | Restrição |
|---|---|---|---|
| Hover no marco (desktop) | `translateY(-2px)` | 200ms | Só `motion-safe` |
| Seleção de marco | cor de fundo/borda e ring azul | 150–200ms | Sem layout shift |
| Contagem aprovada atualiza | barra de largura suavizada | 500ms | Desativada com `prefers-reduced-motion` |
| Copiar link | texto temporário “Copiado!” | ~2s | Feedback textual, sem confete |
| Foco teclado | ring de 2px e offset | imediato | Contraste e `focus-visible` |
| Drawer e-mail | animação do Sheet já existente | existente | Não criar segunda transição |

**A11y:** botões reais; controles ativos com 44px; `aria-expanded` e painel de conteúdo associado; `aria-live=polite` para progresso; `role=progressbar` e `aria-valuetext`; checkbox sem mutação manual. Ícones sem significado isolado têm `aria-hidden`.

## 9. Telemetria e dicionário canônico
**Fonte de resultado:** banco Rails / `ReviewFormEvent` e avaliações vinculadas ao formulário, não `localStorage` nem cliques no frontend.

| Evento | Fonte | Semântica |
|---|---|---|
| `review_forms_page_viewed` | analytics frontend existente | Exibição da página |
| `review_collection_milestone_opened` | analytics frontend | Explorou uma explicação (não concluiu) |
| `link_copied` | endpoint company_admin | Cópia de URL |
| `whatsapp_clicked` | endpoint company_admin | Abriu WhatsApp, não comprova envio |
| `qr_downloaded` | endpoint público QR | Download do PNG, sem duplicar com evento admin |
| `form_viewed / review_started / review_submitted` | Rails público | Funil real |
| `approved` | review moderada | Aprovação, não simplesmente envio |
| `email_template_copied` | analytics cliente; **não** no enum Rails | Cópia de rascunho, não envio |

**Números para avaliar piloto:** usuários ativos na aba, taxa de `link_copied`, origem por canal, starts/views, submissions/starts, approved/submissions, zero erros 500, zero reclamações por convite parcial ou não enviado. Nunca somar cliques a avaliações.

**LGPD:** não registrar nome/e-mail do avaliador, IP bruto ou mensagens privadas em eventos do dashboard. Os registros existentes devem seguir políticas de retenção e consentimento.

## 10. Tasklist de engenharia

### P0 — entrega inicial
- [x] T-01 Inserir sprite de 13 ícones SVG personalizado no frontend.
- [x] T-02 Substituir cards de marcos por timeline mobile-first 1/10/20.
- [x] T-03 Detalhes de contexto sem alegações não verificadas.
- [x] T-04 Mover a timeline para antes do compartilhamento, inclusive sem formulários.
- [x] T-05 Card compacto: link, Copiar, E-mail, WhatsApp e QR.
- [x] T-06 Passar nome da empresa selecionada.
- [x] T-07 Remover interpolação insegura no snippet HTML e bloquear snippet pausado.
- [x] T-08 Corrigir emissão de eventos desconhecidos para Rails.
- [x] T-09 Testes unitários de metas, estados, xss e formulário pausado (escritos; execução pendente).
- [ ] T-10 Executar CI Jest, TypeScript, lint e build em ambiente compatível.
- [ ] T-11 Validar 320/360/390/430/768/1440px, Safari, Firefox e Chrome.
- [ ] T-12 Validar com dados reais os estados 0, 1, 9, 10, 19, 20, `null`.

### P1 — estabilidade
- [ ] T-13 Conferir contatos e permissões em multiempresa e aba “Coletar Avaliações”.
- [ ] T-14 Instrumentar e observar funil de 14 dias sem falsas conversões.
- [ ] T-15 Adicionar screenshots de regressão no Playwright (3 viewports).
- [ ] T-16 Validar teclado, leitor de tela e reduced motion.
- [ ] T-17 Revisar `ReviewFormEvent` contra enum, rate limit e duplicidade de eventos de QR.
- [ ] T-18 Disponibilizar feature flag controlada por empresa e rollback documentado.

### P2 — maturidade
- [ ] T-19 Agregação SQL dos resultados com EXPLAIN/índices reais quando necessário.
- [ ] T-20 Expandir copy somente mediante revisão de métricas e provas.
- [ ] T-21 Avaliar widget dinâmico independente apenas com demanda comprovada.

## 11. QA / aceite de release (todos obrigatórios antes de merge)
1. Jest: marcos de 0,1,9,10,19,20,20+ e `null`; interação em todos os itens; escape de nomes com caracteres especiais; falhas de clipboard; formulário pausado.
2. TypeScript sem erros, lint sem regressões, build Next e testes RSpec que dependem da API.
3. PWA sem scroll horizontal; o componente não usa hero pesado nem imagens PNG de 512px como ícone renderizado.
4. Conteúdos sem claims não validados; modalidade Free/Pago não altera valor de reputação nem atribui medalhas.
5. Dados reais conferidos para três empresas, inclusive multiempresa e formulário inativo.
6. PostHog: eventos de clique sem PII; canal na API consistente; `approved` não equiparado a `submitted`.
7. Publicação só após CI e monitoramento de rollback.

## 12. Riscos e decisões abertas
- **Badge final:** o título “Selo Usuários nos Amam” é uma narrativa visual solicitada. **Não** existe concessão automática deste selo nos sete badges oficiais atuais. Se o nome for lançado como prêmio, aprovar catálogo e critérios auditáveis antes.
- **Porcentagens fornecidas:** todas as métricas e números do briefing são preservados na seção 5, mas bloqueados até verificação factual.
- **Feature flag:** o hub permanece condicionado à flag existente `REVIEW_COLLECTION_HUB_V2`. Antes do rollout, conferir o estado real no PostHog. Para escalonar somente a V3 sem afetar o hub, criar uma flag própria e manter a V2 como fallback.
- **Métricas por canal:** a implementação atual associa alguns eventos por `source` e percorre reviews por formulário; executar testes em volume antes de prometer escala.
- **Deploy:** este PDRM não autoriza deploy nem aplicação de migrações.

### Referências de código
- `AB0-1-front/app/dashboard/components/ReviewFormsManagement.tsx`
- `AB0-1-front/app/dashboard/components/review-collection/{ReviewCollectionHub,ReputationMilestones,ReviewShareCard,ReviewButtonEmbed}.tsx`
- `AB0-1-front/lib/review-collection/milestones.ts`
- `AB0-1-back/app/controllers/api/v1/{public_review_forms_controller,company_admin/review_forms_controller}.rb`
- `AB0-1-back/app/models/{review_form,review_form_event,badge,company_badge}.rb`

**Estado final:** Código proposto em PR. Somente após validação de CI/QA e aprovação poderá integrar a `main`.
