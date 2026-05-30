# PLAN — Fase 3: Visão Geral Premium e Sidebar

**Wave:** 1  
**Depends On:** Fase 2  
**Files Modified:**  
- `AB0-1-front/app/companies/[id]/components/CompanyProfileShell.tsx`
**Files Created:**  
- `AB0-1-front/app/companies/[id]/components/OverviewTab.tsx`
- `AB0-1-front/app/companies/[id]/components/CompanyHighlightsGrid.tsx`
- `AB0-1-front/app/companies/[id]/components/CompanyContactCard.tsx`
- `AB0-1-front/app/companies/[id]/components/SidebarPremium.tsx`
- `AB0-1-front/app/companies/[id]/components/ReviewsPreview.tsx`
- `AB0-1-front/app/companies/[id]/components/ProjectsPreview.tsx`
- `AB0-1-front/app/companies/[id]/components/RelatedCompaniesCarousel.tsx`
- `AB0-1-front/app/companies/[id]/components/PremiumSidebarAdSlot.tsx`

---

## 🛠️ Tarefas de Engenharia (Formato GSD)

### Task 3.1 — Criar OverviewTab
<task id="3.1">
<objective>
Construir o componente agregador da aba de Visão Geral, recebendo dados do Shell.
</objective>
<read_first>
- `AB0-1-front/app/companies/[id]/components/CompanyOverview.tsx`
</read_first>
<action>
Criar o arquivo `OverviewTab.tsx` sob `components/`. Ele deve renderizar:
- Bloco "Sobre a Empresa" com a descrição da empresa, permitindo botão "Ver mais" para textos longos, e fallback elegante se nula.
- Grid de condecorações rápidas `<CompanyHighlightsGrid>`.
- Depoimentos em destaque `<ReviewsPreview>`.
- O portfólio compacto `<ProjectsPreview>`.
- O carrossel de empresas similares `<RelatedCompaniesCarousel>`.
</action>
<acceptance_criteria>
- `OverviewTab.tsx` é criado e consome o payload original via props.
- Textos extensos de descrição são encurtados com o atalho "Ver mais".
</acceptance_criteria>
</task>

### Task 3.2 — Criar CompanyHighlightsGrid
<task id="3.2">
<objective>
Implementar a grade de diferenciais dinâmicos de alta performance no topo da aba.
</objective>
<read_first>
- `AB0-1-front/app/companies/[id]/components/PremiumProfileTypes.ts`
</read_first>
<action>
Criar `CompanyHighlightsGrid.tsx` renderizando 4 cards:
- Anos de atuação: calculado subtraindo o ano atual de `founded_year` ou ano de criação. Fallback de `1 ano` se ausente.
- Soluções cadastradas: `productCount`.
- Depoimentos no portal: `reviewCount`.
- Nota estelar consolidada.
</action>
<acceptance_criteria>
- O grid renderiza de forma esteticamente agradável com Tailwind.
- O cálculo de tempo de atuação é exato e resiliente.
</acceptance_criteria>
</task>

### Task 3.3 — Criar SidebarPremium
<task id="3.3">
<objective>
Construir a barra lateral inteligente com foco em aquisição de leads e conversão corporativa.
</objective>
<read_first>
- `AB0-1-front/app/companies/[id]/components/CompanySidebar.tsx`
</read_first>
<action>
Criar o arquivo `SidebarPremium.tsx`. Ele deve aninhar:
- O card de contatos de alta performance `<CompanyContactCard>`.
- O botão Solicitar Orçamento institucional ou personalizado.
- A sanfona de FAQ se `faq_block === true` nos entitlements.
- O card de posse de perfil `ClaimProfileCard`.
- O slot lateral de anúncios `<PremiumSidebarAdSlot>`.
- Um pequeno card de confiança ("Trust/Safety Card") detalhando garantias.
</action>
<acceptance_criteria>
- A sidebar renderiza todos os itens de forma responsiva sem overflow lateral.
</acceptance_criteria>
</task>

### Task 3.4 — Criar CompanyContactCard
<task id="3.4">
<objective>
Implementar o card de contatos protegendo telefone e e-mail por login.
</objective>
<read_first>
- `AB0-1-front/app/companies/[id]/components/CompanySidebar.tsx`
</read_first>
<action>
Criar `CompanyContactCard.tsx`. Ele deve ler a autenticação (`isAuthenticated` de `useAuth()`):
- Se logado, revela e-mail, telefone e site clicáveis, registrando telemetria `trackCTAClick` ao interagir.
- Se deslogado, censura caracteres e exibe botão "Ver". O clique dispara o formulário `openSignupGate` legado com a mensagem "Crie sua conta para ver os contatos".
</action>
<acceptance_criteria>
- Visitante anônimo vê apenas caracteres censurados e botão "Ver".
- O clique em "Ver" dispara o `openSignupGate` com sucesso.
</acceptance_criteria>
</task>

### Task 3.5 — Criar ClaimProfileCard
<task id="3.5">
<objective>
Criar o card convidativo para posse de perfil se a empresa não for reivindicada.
</objective>
<read_first>
- `AB0-1-front/app/companies/[id]/components/ClaimCompanyCard.tsx`
</read_first>
<action>
Criar `ClaimProfileCard.tsx` que replica a lógica do card legado:
- Se `company.claimed` for falso, exibe um card refinado com atalho para o formulário de posse.
- Se já reivindicada, oculta ou renderiza um bloco institucional da Avalia Solar.
</action>
<acceptance_criteria>
- O card de claim só renderiza para perfis não reivindicados pelo parceiro.
</acceptance_criteria>
</task>

### Task 3.6 — Criar ReviewsPreview
<task id="3.6">
<objective>
Montar o mural compacto de 2 depoimentos de destaque.
</objective>
<read_first>
- `AB0-1-front/app/companies/[id]/components/CompanyOverview.tsx`
</read_first>
<action>
Criar `ReviewsPreview.tsx` renderizando:
- Média estelar e quantidade de depoimentos.
- Mural com 2 reviews textuais mais recentes contendo avatar, pontuação e depoimento.
- CTA "Ver todas as avaliações" (chaveia a activeTab para "reviews").
- Estado vazio premium: se nenhuma review existir, renderiza caixa convidando: "Seja o primeiro a avaliar esta empresa".
</action>
<acceptance_criteria>
- O mural renderiza com layout premium.
- O clique no CTA chaveia as abas instantaneamente sem crash.
</acceptance_criteria>
</task>

### Task 3.7 — Criar ProjectsPreview
<task id="3.7">
<objective>
Construir a vitrine compacta de portfólio de cases.
</objective>
<read_first>
- `AB0-1-front/app/companies/[id]/components/CompanyOverview.tsx`
</read_first>
<action>
Criar `ProjectsPreview.tsx` que renderiza:
- Cards compactos de até 3 projetos recentes da empresa contendo imagem, segmento e cidade/estado.
- Se não houver projetos, renderiza um estado vazio premium convidando o cliente a solicitar um projeto personalizado.
</action>
<acceptance_criteria>
- Os cards renderizam harmoniosamente no grid do Tailwind.
</acceptance_criteria>
</task>

### Task 3.8 — Criar RelatedCompaniesCarousel
<task id="3.8">
<objective>
Implementar a seção de alternativas similares no rodapé do Overview respeitando concorrência direta.
</objective>
<read_first>
- `AB0-1-front/app/companies/[id]/components/CompanyComparisonSection.tsx`
</read_first>
<action>
Criar `RelatedCompaniesCarousel.tsx`. Ele deve verificar:
- Se `show_alternatives === false` nos entitlements (planos Pro/Enterprise), a seção de concorrentes é suprimida da aba e exibe a mensagem institucional discreta: "Esta empresa protege seu perfil contra anúncios concorrentes".
- Se verdadeiro, renderiza a lista horizontal de empresas similares.
</action>
<acceptance_criteria>
- Empresas pagas com direito à exclusividade têm concorrência 100% bloqueada no Overview.
</acceptance_criteria>
</task>

### Task 3.9 — Criar PremiumSidebarAdSlot
<task id="3.9">
<objective>
Construir o slot lateral de anúncios monetizáveis com etiqueta de transparência e fallbacks.
</objective>
<read_first>
- `AB0-1-front/app/companies/[id]/components/SponsoredBanner.tsx`
</read_first>
<action>
Criar `PremiumSidebarAdSlot.tsx` que integra:
- Slot para anúncio patrocinado com o selo claro de "Patrocinado" ou "Anúncio no Avalia Solar".
- Se `show_competitor_banners === false` nos entitlements de plano PRO, o slot de concorrência direta é suprimido, exibindo anúncios institucionais da marca ou o logo da própria empresa.
</action>
<acceptance_criteria>
- O slot de ad exibe as etiquetas obrigatórias.
- Banners de concorrentes são suprimidos se o plano da empresa ativa bloquear.
</acceptance_criteria>
</task>

### Task 3.10 — Integrar Overview e Sidebar no CompanyProfileShell
<task id="3.10">
<objective>
Substituir os componentes temporários do Shell de layout base pelos novos blocos da Fase 3.
</objective>
<read_first>
- `AB0-1-front/app/companies/[id]/components/CompanyProfileShell.tsx`
</read_first>
<action>
No arquivo `CompanyProfileShell.tsx`, substituir:
- O placeholder da aba "overview" pelo novo componente `<OverviewTab />`.
- A barra lateral de placeholder pelo componente `<SidebarPremium />`.
Passar todas as propriedades e payloads necessários aos novos componentes.
</action>
<acceptance_criteria>
- A aba de Visão Geral e a Sidebar são montadas e exibidas perfeitamente com a feature flag ligada.
</acceptance_criteria>
</task>

### Task 3.11 — QA Visual e Funcional (Homologação da Fase 3)
<task id="3.11">
<objective>
Rodar testes e homologações estritas simulando os cenários B2B de conversão em mobile e desktop.
</objective>
<read_first>
- `.planning/phases/03-visao-geral-sidebar/03-CONTEXT.md`
</read_first>
<action>
Efetuar testes cobrindo:
1. Usuário deslogado (contatos censurados, openSignupGate ativo ao clicar).
2. Usuário logado (contatos completos revelados).
3. Planos Free vs Essential vs Pro (restrições visuais de FAQ, concorrentes, etc.).
4. Cenários de descrição vazia, mural sem reviews e sem projetos (resiliência de fallbacks).
5. Mobile 320px sem overflow.
</action>
<acceptance_criteria>
- Todos os testes de QA e critérios de aceitação da Fase 3 passam sem erros ou avisos.
</acceptance_criteria>
</task>
