# PLAN — Fase 2: Layout Base, Shell e Hero Premium

**Wave:** 1  
**Depends On:** Fase 1  
**Files Modified:**  
- `AB0-1-front/app/companies/[id]/CompanyDetailClient.tsx`
**Files Created:**  
- `AB0-1-front/app/companies/[id]/components/PremiumProfileTypes.ts`
- `AB0-1-front/app/companies/[id]/components/CompanyProfileShell.tsx`
- `AB0-1-front/app/companies/[id]/components/CompanyPremiumHero.tsx`
- `AB0-1-front/app/companies/[id]/components/CompanyIdentityCard.tsx`
- `AB0-1-front/app/companies/[id]/components/CompanyCTAGroup.tsx`
- `AB0-1-front/app/companies/[id]/components/CompanyProfileTabs.tsx`
- `AB0-1-front/app/companies/[id]/components/CompanyVerificationBadge.tsx`
- `AB0-1-front/app/companies/[id]/components/PremiumHighlightBadge.tsx`
- `AB0-1-front/app/companies/[id]/components/CompanyRatingBadge.tsx`

---

## 📋 Objetivos da Fase 2
Criar a fundação de layout de impacto (Shell, Hero, Identity Card, Tabs responsivas com rolagem horizontal e Sidebar placeholder) operando de forma isolada e chaveada por uma Feature Flag local. Se a Feature Flag estiver desligada, a visualização legada antiga é renderizada idêntica e sem regressões.

---

## 🛠️ Tarefas de Engenharia (Formato GSD)

### Task 2.1 — Introduzir Feature Flag Segura
<task id="2.1">
<objective>
Configurar a Feature Flag local na entrada de visualização do perfil de empresa Next.js para convivência segura de layouts.
</objective>
<read_first>
- `AB0-1-front/app/companies/[id]/CompanyDetailClient.tsx`
</read_first>
<action>
No arquivo `CompanyDetailClient.tsx`, adicionar a Feature Flag local:
```ts
const ENABLE_PREMIUM_PROFILE = process.env.NEXT_PUBLIC_ENABLE_PREMIUM_PROFILE === 'true';
```
Modificar a renderização principal (linha 370 em diante) para que, se `ENABLE_PREMIUM_PROFILE` for verdadeiro, renderize o novo shell `<CompanyProfileShell ...props />`. Caso contrário, renderizar o layout legado atual por completo.
</action>
<acceptance_criteria>
- `CompanyDetailClient.tsx` compila perfeitamente sem erros.
- A flag `ENABLE_PREMIUM_PROFILE` chaveia corretamente a interface sem crash ou loops de render.
</acceptance_criteria>
</task>

### Task 2.2 — Criar Tipos e Helpers Locais
<task id="2.2">
<objective>
Escrever o arquivo de tipos e definições TypeScript para normalizar e proteger o acesso a dados de planos e entitlements no frontend.
</objective>
<read_first>
- `AB0-1-front/lib/api.ts`
</read_first>
<action>
Criar o arquivo `PremiumProfileTypes.ts` contendo:
- Tipagens de entitlements estruturadas.
- Uma função de utilidade `isFeatureEnabled(featureAccess, featureKey)` com fallbacks robustos:
  - Se `featureAccess` estiver ausente, assume plano Free (recurso = false).
  - Se a chave estiver ausente, assume `false`.
  - Se a empresa não tiver plano, assume Free.
</action>
<acceptance_criteria>
- O arquivo `PremiumProfileTypes.ts` é criado sob `components/`.
- As tipagens de fallback passam na compilação do TypeScript.
</acceptance_criteria>
</task>

### Task 2.3 — Criar CompanyProfileShell
<task id="2.3">
<objective>
Construir o componente esqueleto do Shell responsivo com grid de 12 colunas para abrigar a aba ativa e a barra lateral.
</objective>
<read_first>
- `AB0-1-front/app/companies/[id]/components/CompanySidebar.tsx`
</read_first>
<action>
Criar o arquivo `CompanyProfileShell.tsx` contendo a estrutura responsiva:
- Grid principal: `grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8`
- Área útil da aba selecionada: `lg:col-span-8`
- Sidebar placeholder premium com bordas arredondadas e sombras suaves: `lg:col-span-4`
- Inclusão do cabeçalho unificado, breadcrumb e footer.
</action>
<acceptance_criteria>
- `CompanyProfileShell.tsx` é criado e estruturado com Tailwind CSS.
- O grid se adapta perfeitamente nos breakpoints móveis.
</acceptance_criteria>
</task>

### Task 2.4 — Criar CompanyPremiumHero
<task id="2.4">
<objective>
Implementar o Hero Premium responsivo de grande impacto visual com suporte a imagens de capa reais ou fallbacks gradientes.
</objective>
<read_first>
- `AB0-1-front/app/companies/[id]/components/CompanyHero.tsx`
</read_first>
<action>
Criar o arquivo `CompanyPremiumHero.tsx`. Ele deve renderizar:
- Imagem de capa fornecida pelo S3 da empresa.
- Fallback para gradiente azul-escuro sofisticado da marca Avalia Solar se a imagem estiver ausente ou corrompida.
- Sombras suaves e cantos arredondados (`rounded-3xl` / `rounded-[28px]`).
- Overlay linear suave e discreto para assegurar legibilidade em cores claras de cobertura.
- Badges de Destaque Premium para empresas Pro/Enterprise com a feature ativa.
</action>
<acceptance_criteria>
- O Hero Premium exibe a capa com cantos arredondados e gradiente de fallback refinado se não houver imagem.
- Não ocorre estouro visual de texto nos cabeçalhos em mobile.
</acceptance_criteria>
</task>

### Task 2.5 — Criar CompanyIdentityCard e CTAGroup
<task id="2.5">
<objective>
Criar o card centralizador de dados institucionais da empresa e o agrupador de botões de orçamentos com fallbacks.
</objective>
<read_first>
- `AB0-1-front/app/companies/[id]/components/CompanyHero.tsx`
</read_first>
<action>
Criar `CompanyIdentityCard.tsx` e `CompanyCTAGroup.tsx` que integram:
- Logo da empresa ou fallback circular elegante com a inicial da marca se nula.
- Badges de verificação `CompanyVerificationBadge` (verde) e reputação `CompanyRatingBadge` (estrelas baseadas em reviews).
- CTAs principais: Solicitar Orçamento (chama lead engine do legado), Comparar Empresa e Compartilhar.
- Se `custom_ctas` estiver inativo nos entitlements, renderizar os CTAs padrão de segurança da plataforma.
</action>
<acceptance_criteria>
- Os botões executam perfeitamente os cliques e modais já implementados de forma idêntica.
- Fallbacks circulares de logo funcionam sem imagem quebrada.
</acceptance_criteria>
</task>

### Task 2.6 — Criar CompanyProfileTabs
<task id="2.6">
<objective>
Construir o cabeçalho de navegação de 6 abas com rolagem horizontal suave em telas pequenas de smartphones.
</objective>
<read_first>
- `AB0-1-front/app/companies/[id]/CompanyDetailClient.tsx`
</read_first>
<action>
Criar `CompanyProfileTabs.tsx` integrando as abas: Visão Geral, Produtos e Serviços, Avaliações, Projetos, Estatísticas e Contato.
- Utilizar os componentes do shadcn/ui envolvidos em `<ScrollArea orientation="horizontal">` para rolagem lateral fluida em mobile.
- Renderizar placeholders elegantes nas abas ainda não construídas para o fluxo de UAT.
</action>
<acceptance_criteria>
- A navegação responde perfeitamente nos breakpoints móveis abaixo de 480px.
- Nenhuma aba legada perde compatibilidade ou crasha na transição.
</acceptance_criteria>
</task>

### Task 2.7 — Testes Manuais e QA Visual (Homologação da Fase 2)
<task id="2.7">
<objective>
Rodar auditoria e testes visuais completos simulando cenários e planos B2B.
</objective>
<read_first>
- `.planning/phases/02-layout-base-shell-hero/02-CONTEXT.md`
</read_first>
<action>
Efetuar testes cobrindo:
1. Feature Flag ativada vs desativada (garantia de regressão zero).
2. Empresa do plano **Free** (não mostra selo verificado, sem simulador, mostra concorrentes).
3. Empresa do plano **Essential** (mostra selo verificado, botões de contato, mas galeria oculta).
4. Empresa do plano **Pro** (hero expandido com capa premium, bloqueio de concorrentes).
5. Cenários sem imagem de cobertura (gradiente de fallback ativo) e sem logo.
6. Acessibilidade e overflow horizontal em mobile.
</action>
<acceptance_criteria>
- Todos os cenários passam e estão 100% livres de console errors ou quebras de design system.
</acceptance_criteria>
</task>

---

## 🛡️ Critérios de Rollback
Caso qualquer anomalia crítica ou loop infinito seja disparado em ambiente de staging ou integração devido ao Next.js App Router, o rollback imediato será acionado:
1. Desligar a Feature Flag local na variável de ambiente:
   `NEXT_PUBLIC_ENABLE_PREMIUM_PROFILE=false`
   Isso restabelece instantaneamente o fluxo de renderização da página antiga e estável, sem necessidade de reverter commits ou gerar downtime na plataforma.
