# Avalia Solar — CTA de avaliações v7 “Open Feedback” (PWA + Web)

Data: 17/11/2026  
Escopo: `AB0-1-front`, interfaces web/PWA; não inclui `AB0-1-mobile` nativo.  
Referência visual: opção **07 — Open feedback** da folha de variantes “Avaliar” aprovada.

## Contrato visual (IBM-inspired, CSS local)
- Rótulo padrão: **Deixe sua avaliação**; espaço reduzido: **Avaliar**, mantendo `aria-label` completo.
- Ícone: `MessageCircle` (16×16px), não estrela de rating. Estrelas de nota continuam intactas.
- Fundo neutro `#F2F4F6`, borda `#E1E5EB`, texto navy `#101F3F`; hover `#E8EDF2`; focus `#0F62FE`.
- Raio máximo (pill) como no conceito 07; altura mínima tocável **44px**. Ícone sozinho **44×44px**.
- Tipografia: família herdada do produto, 12px/600/1.25; sem efeitos chamativos nem sombra.
- `ReviewAction.tsx` suporta `href`, `onClick`, `compactLabel`, `iconOnly`, `ariaLabel` e `stopPropagation`.
- `ReviewAction.module.css` isola estilos; nenhum override global de `button` ou `Navbar`.

## Superfícies integradas
- Brand Page: preview de avaliações (cabeçalho + estado vazio), aba reviews, identidade (atalho só ícone), Hero, Overview, StickyCTA, Related Cards e comparação.
- Diretório e busca: `ReviewCompanyButton`, `CompanyCard` Free, `SearchCompanyListCard`, `CompanyCardEnhanced`, `TopCompanyCard`.
- Modal de reputação: `CompanyReviewsSummarySheet` com rota e fechamento preservados.
- Painel comprador: home de reviews, lista das próprias avaliações e painel legado de reputação.
- Produtos: botões que abrem `ProductReviewModal` sem alterar a abertura do modal.
- Feed e soluções do usuário: CTA visual atualizado mantendo rotas já existentes.

## Fora do escopo
- Estrelas que representam notas, favoritar, avaliação de resposta, botões de enviar formulário e ações sem vínculo com a criação de avaliações.
- Botão verde `ReviewWhatsAppButton`: **permanece verde** por representar canal externo, não deve virar botão neutro.
- APIs, persistência, permissões, banco, schema Rails, analytics e URLs existentes não são alterados.

## Requisitos e testes de aceite
- CTAs de avaliação relevantes usam um único componente/camada CSS.
- PWA 320, 375, 390, 430px: sem controles cortados, dimensões reais >=44px, rota preservada; desktop >=768px mantém label principal quando houver espaço.
- Leitor de tela anuncia um nome completo mesmo em controles compactos ou só ícone.
- Estados de hover, active, focus-visible e reduce-motion funcionam.
- Preview vazio aciona a aba `reviews`; review link continua acessando `/companies/:slug/review`.
- Produtos continuam abrindo o modal, sem redirecionar.
- Modal de reputação mantém destino da ação e fecha quando acionado.
- Testes Jest existentes de Brand Page, CompanyCard, Search, Modal e WhatsApp mais `ReviewAction.spec.tsx`; integração na `ci-web-backend.yml`.
- Executar typecheck, lint, regressão Jest e smoke visual no Safari iOS antes de produção.

## Rollback
Reverter o PR de frontend e reconstruir; não há migrações. O componente é reversível por troca de import sem alterar contratos de dados.

## Observabilidade e status
Esta documentação registra o contrato implementado na branch de PR, **não é evidência de deploy**. Consultar conclusão de CI e release SHA no GitHub antes de afirmar que está em produção.
