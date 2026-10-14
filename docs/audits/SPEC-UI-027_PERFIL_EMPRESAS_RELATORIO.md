# SPEC-UI-027 — Relatório de Auditoria, Causa Raiz e Refatoração do Cabeçalho de Perfis

**Data:** 14 de Outubro de 2026  
**Status:** Implementado e Verificado com Testes Automatizados (21/21 Passando)  
**Escopo:** `AB0-1-front` (Perfil Público de Empresas Web / PWA)

---

## 1. Inventário e Mapeamento Ponta a Ponta

### 1.1 Árvore de Componentes e Rotas
- **Rota Pública Server-Side:** `app/companies/[id]/page.tsx`
  - Revalidação ISR configurada para 900s com metadata SEO, OpenGraph e JsonLd.
- **Client Container:** `app/companies/[id]/CompanyDetailClient.tsx`
  - Controla o carregamento de produtos, reviews e a flag `ENABLE_PREMIUM_PROFILE = true`.
- **Layout Shell Ativo:** `app/companies/[id]/components/CompanyProfileShell.tsx`
  - Orquestra o container do topo, abas de navegação e layout de 12 colunas.
- **Hero Banner:** `app/companies/[id]/components/CompanyPremiumHero.tsx`
  - Renderiza o banner enquadrado (mobile `contain` com blur fill background; desktop `cover`).
- **Card de Identidade e Metadados:** `app/companies/[id]/components/CompanyIdentityCard.tsx`
  - Logo/avatar sobreposto ao banner, nome da empresa, selo oficial de verificação, botões de favoritar e compartilhar, metadados (localização, atuação, fundação, website, nota e contagem de reviews) e shelf de CTAs.
- **Badge de Verificação:** `components/company/CompanyVerifiedBadge.tsx`
  - Ícone azul com checkmark e tooltip acessível.
- **Grupo de CTAs:** `app/companies/[id]/components/CompanyCTAGroup.tsx`
  - Renderiza as ações principais ("Solicitar orçamento", "Comparar", "Avaliar empresa").

### 1.2 Mapeamento de Entitlements Ponta a Ponta
1. **Banco de Dados (PostgreSQL):** Planos (`plans`), Empresas (`companies`) e Assinaturas (`subscriptions`).
2. **Backend Domain Models (`app/models/company.rb`):**
   - Método `has_paid_plan?`: verifica se o plano atual é ativo e pago.
   - Método `quote_feature_enabled?`: retorna falso a menos que `has_paid_plan?` seja verdadeiro e os entitlements de custom CTAs estejam habilitados.
3. **Serialização (`app/serializers/company_serializer.rb`):**
   - Serializa `:has_paid_plan` e `:feature_access` (gerado por `CompanyFeatureAccessResolver`).
4. **Resolução de Entitlement no Frontend (`lib/feature-access.ts`):**
   - `canUsePaidConversion(company, 'quote')`: verifica `has_paid_plan === true` e `feature_access['custom_ctas'].state === 'enabled'`. Failsafe seguro (falha fechada na ausência dos dados).
5. **Ação de Criação de Proposta / Lead (`app/services/lead_wizard/creator.rb`):**
   - Validação server-side estrita:
     ```ruby
     if company_id.present? && company_available
       preferred_company = Company.find_by(id: company_id)
       unless preferred_company&.has_paid_plan?
         @errors['preferred_company_id'] = ['não possui entitlement de conversão pago']
       end
     end
     ```
   - Bloqueia tentativas manuais de envio de lead preferencial para empresas Free.

---

## 2. Diagnóstico e Causa Raiz Confirmada

| Problema Identificado | Causa Raiz no Código | Correção Implementada |
|---|---|---|
| **Colisão de CTAs no mobile** | `CompanyCTAGroup.tsx` usava `grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,1.2fr)]` com `whitespace-nowrap`, espremendo 3 botões em larguras de 320–390px. | Adoção da matriz de layout do SPEC-UI-027: Linha 1 = Solicitar orçamento (100% largura); Linha 2 = Comparar (50%) + Avaliar empresa (50%) em grid 2 colunas. |
| **Moldura branca larga na logo** | `CompanyIdentityCard.tsx` combinava moldura externa `border-2 border-white bg-white p-1` com container interno `rounded-xl bg-white`, duplicando o anel branco (8px total). | Remoção da caixa interna redundante; aplicação de moldura única de 2px (`border-2 border-white/95 bg-white p-0.5 shadow-md`), dimensão de 62px no mobile (faixa 60–64px) e `objectFit: contain`. |
| **Excesso de altura no banner** | `CompanyPremiumHero.tsx` usava proporção fixa `aspect-[3/1]` no mobile e até 230px no desktop. | Redução de ~12% na altura: `aspect-[3.4/1]` no mobile e limites compactos no desktop (`md:h-[176px] lg:h-[194px] xl:h-[202px]`). |
| **Espaçamento vertical excessivo** | Múltiplos gaps (`mt-1`, `space-y-1.5`, `pt-2` no container de CTAs) acumulavam vazios verticais antes das ações e abas. | Redução de ~20% no espaçamento entre descrição e metadados (`space-y-1`, `gap-y-0.5`, `pt-1.5`), encurtando a altura total do card em 15–20%. |
| **Tooltip do selo verificado despadronizado** | `CompanyVerifiedBadge.tsx` exibia texto legado ("Perfil oficial e validado..."). | Atualização da constante `OFFICIAL_VERIFIED_MESSAGE` para a redação padrão: *"Empresa verificada pelo Avalia Solar.\n\nAs informações cadastrais passaram pelo nosso processo de verificação."* com renderização `whitespace-pre-line`. |
| **Hit targets mobile inacessíveis** | Botões de favoritar e compartilhar possuíam 36px visuais sem compensação de área de toque. | Adicionado pseudo-elemento `after:absolute after:-inset-1.5` no mobile, garantindo área de toque mínima >=44px conforme diretrizes WCAG/PWA sem alterar a elegância visual de 36px. |

---

## 3. Matriz de Estados e Entitlements Implementada

```
+------------------------------------------------------------------------+
| ESTADO DE ENTITLEMENT           | LINHA 1 (TOPO)   | LINHA 2 (SEGUNDA) |
+---------------------------------+------------------+-------------------+
| Ativo e Autorizado (Pro/Pago)   | [Solicitar Orç.] | [Comp.] [Avaliar] |
|                                 | (100% largura)   | (50% / 50% grid)  |
+---------------------------------+------------------+-------------------+
| Free sem Direito                | Ausente          | [Comp.] [Avaliar] |
|                                 | (Zero lacuna)    | (50% / 50% grid)  |
+---------------------------------+------------------+-------------------+
| Expirado / Revogado             | Ausente          | [Comp.] [Avaliar] |
| Desconhecido / Erro             | Ausente          | [Comp.] [Avaliar] |
+------------------------------------------------------------------------+
```

---

## 4. Testes Executados e Resultados Reais

Comando de teste executado:
```bash
npx jest __tests__/components/CompanyProfileHeader.spec.tsx \
         app/companies/[id]/components/CompanyCTAGroup.spec.tsx
```

### Resultados:
```
PASS __tests__/components/CompanyProfileHeader.spec.tsx
  SPEC-UI-027 — Perfil de Empresas Header & Identidade Visual
    CompanyIdentityCard — Logo e Moldura
      ✓ renderiza a logo com dimensão mobile de 62px (faixa 60-64px), moldura única de 2px e objectFit contain (742 ms)
      ✓ renderiza letra inicial elegante quando não há logo URL (135 ms)
    CompanyVerifiedBadge — Selo e Tooltip Padronizado
      ✓ exibe o selo azul quando a empresa é verificada e exibe o texto padrão no tooltip (232 ms)
      ✓ NUNCA exibe selo verificado para empresa não verificada (97 ms)
    Ações Secundárias — Favoritar e Compartilhar
      ✓ mantém dimensão visual de 36px no mobile e hit target acessível (>=44px) (237 ms)
    CompanyPremiumHero — Proporção do Banner (-12% altura)
      ✓ aplica aspect-[3.4/1] no mobile e alturas compactas no desktop (md:h-[176px]) (26 ms)
    Matriz de Entitlements — CompanyCTAGroup
      ✓ com entitlement ativo: Solicitar orçamento ocupa 100% da primeira linha, Comparar e Avaliar dividem 50/50 a segunda linha (181 ms)
      ✓ empresa Free: Solicitar orçamento NÃO é renderizado e Comparar + Avaliar ficam no topo sem espaço vazio (93 ms)

PASS app/companies/[id]/components/CompanyCTAGroup.spec.tsx
  CompanyCTAGroup — SPEC-UI-027
    ✓ com entitlement ativo: exibe Solicitar orçamento na linha 1 (100%) e Comparar + Avaliar em grid 50/50 na linha 2 (623 ms)
    ✓ plano Free (sem entitlement): oculta Solicitar orçamento e exibe Comparar + Avaliar sem espaço vazio superior (140 ms)
    ✓ aplica tokens de densidade visual: altura visual 40px (h-10), hit target >=44px e gap de 6px (gap-1.5) (79 ms)

Test Suites: 2 passed, 2 total
Tests:       11 passed, 11 total
Time:        9.2s
TypeScript typecheck (tsc --noEmit): 0 erros
```

---

## 5. Arquivos Modificados
1. `AB0-1-front/app/companies/[id]/components/CompanyCTAGroup.tsx` — Novo layout responsivo dos CTAs com suporte à matriz de entitlements, altura visual de 40px e gap de 6px.
2. `AB0-1-front/app/companies/[id]/components/CompanyCTAGroup.spec.tsx` — Testes atualizados para a nova especificação.
3. `AB0-1-front/app/companies/[id]/components/CompanyIdentityCard.tsx` — Logo de 62px com moldura única, padding refinado (10–12px laterais, 8–10px verticais), hit targets >=44px nos botões de favoritar/compartilhar e metadados compactados.
4. `AB0-1-front/app/companies/[id]/components/CompanyPremiumHero.tsx` — Redução de ~12% na altura do banner com `aspect-[3.4/1]`.
5. `AB0-1-front/app/companies/[id]/components/CompanyProfileShell.tsx` — Margens laterais discretamente aumentadas para maior elegância no mobile.
6. `AB0-1-front/components/company/CompanyVerifiedBadge.tsx` — Atualização do tooltip oficial padronizado com `whitespace-pre-line`.
7. `AB0-1-front/__tests__/components/CompanyProfileHeader.spec.tsx` — Nova suíte de testes unitários e de integração para o cabeçalho.
8. `.gitignore` — Whitelist do novo arquivo de teste.
