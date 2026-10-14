# Plano de Implementação — Upgrade de Planos e Modal

## Tarefas Ordenadas

### Tarefa 1: Copiar e Organizar Assets SVG
- Copiar os 6 arquivos SVG auditados de `AB0-1-front/public/avalia-solar-upgrade-assets/assets/` para `AB0-1-front/public/upgrade-assets/`.
- Garantir permissões de leitura e verificar que todos os caminhos no frontend resolvem para `/upgrade-assets/*.svg`.

### Tarefa 2: Criar e Adaptar o Componente `SidebarUpgradeWidget.tsx`
- Localização: `AB0-1-front/app/dashboard/components/SidebarUpgradeWidget.tsx`.
- Especificações:
  - Fundo `#FFFBEB` com borda `#FBBF24` (1px) e raio 8px.
  - Título `#111827` (12–13px, font-semibold), link `#6366F1` (12px, com seta `arrow-up-right.svg`).
  - Ícone de cadeado (`lock-sparkles.svg`, 32–36px).
  - Altura mínima: 56px, gap: 10–12px, padding horizontal: 12–16px.
  - Modo Compacto (rail de 112px): botão centralizado 40–44px apenas com o ícone de cadeado e tooltip acessível `"Desbloqueie seu potencial: Conhecer planos"`.
  - Estados: hover (`#FEF3C7`), focus-visible (outline 2px), pressed, dark-mode (`#15243B` / hover `#22334D`).
  - Respeitar `prefers-reduced-motion`.

### Tarefa 3: Integrar o Widget na `EnterpriseSidebar.tsx`
- Exibir no rodapé da sidebar antes de `Alternar Empresa` e `Sair`.
- Condição de visibilidade: omitir se a empresa ativa possuir plano `enterprise`.
- Propagar `onOpenPlans` para disparar o modal global do dashboard.

### Tarefa 4: Criar o Modal de Planos `PlansPricingModal.tsx`
- Localização: `AB0-1-front/app/dashboard/components/PlansPricingModal.tsx`.
- Baseado em `Dialog` de `@/components/ui/dialog` (Radix).
- Largura máxima: `max-w-5xl`, altura máxima: `min(88dvh, 800px)`.
- Cabeçalho: "Escolha o plano ideal para sua empresa", subtítulo "Compare recursos e escolha a solução adequada para o momento da sua empresa."
- Ciclo de faturamento: Toggle Mensal/Anual (com valores de referência do catálogo: Free R$ 0, Essencial R$ 49,17/mês cobrado anualmente R$ 590, Pro R$ 125,00/mês cobrado anualmente R$ 1.500, Enterprise sob consulta).
- Destaque comercial: Card Pro com destaque visual (borda azul `#2563EB`, badge "⭐ Mais vendido").
- Checklist de benefícios 100% derivado de `PlanFeatureCatalog.rb`:
  - Free: Perfil básico no marketplace, presença orgânica em buscas, alternativas de concorrentes visíveis.
  - Essencial: Perfil destacado, sem concorrentes no perfil, botões de contato e orçamentos (custom CTAs), selo de verificação documental, links e redes sociais.
  - Pro: Tudo do Essencial + Banner promocional de topo, oferta especial ativa, tabela de preços, galeria de mídia, inbox em tempo real de oportunidades, analytics avançado e suporte prioritário.
  - Enterprise: Tudo do Pro + Cobertura nacional irrestrita, webhooks e integrações de API, atualização direta de mídias, gerente de contas dedicado e SLAs sob medida.
- CTAs:
  - Plano atual da empresa: desabilitado com texto "Plano atual".
  - Essencial / Pro: dispara checkout via `billingApi.createCheckoutSession` com feedback de loading.
  - Enterprise: abre contato comercial ou dispara `billingApi.createEnterpriseLead`.

### Tarefa 5: Controlar Estado Global em `EnterpriseDashboard.tsx` e Vincular `PlanAndSubscription.tsx`
- Adicionar estado `isUpgradeModalOpen` no `EnterpriseDashboard.tsx`.
- Passar `onOpenPlans={() => setIsUpgradeModalOpen(true)}` para `EnterpriseSidebar`.
- Passar `onOpenPlans` para a aba `PlanAndSubscription.tsx` e vincular ao botão `"Fazer Upgrade de Plano"`.
- Assegurar que nenhuma navegação de rota ou perda de estado ocorra.

### Tarefa 6: Testes, Validação e Relatório
- Executar lint e TypeScript (`npm run typecheck`).
- Testar viewports: 320, 375, 390, 768, 1024, 1440 px.
- Gerar `docs/upgrade/verification.md` com evidências.
