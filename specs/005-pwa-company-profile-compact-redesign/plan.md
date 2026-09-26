# Plan: PWA Company Profile Compact Redesign

## Architecture & Component Breakdown

1. **`CompanyProfileTabs.tsx`**:
   - Alterar altura das abas de `h-[100px]` para `h-[52px]`.
   - Reduzir tamanho dos ícones de `h-6 w-6` para `h-[18px] w-[18px]`.
   - Reduzir margem superior de `mt-5` para `mt-2.5`.
   - Preservar a abertura do Sheet de categorias no clique da aba "Produtos".

2. **`CompanyIdentityCard.tsx`**:
   - Reduzir dimensões da logo no mobile para `h-[68px] w-[68px]` com overlap `-mt-8`.
   - Organizar hierarquia: Nome + Selo Verificado + Categoria Chip ➔ Descrição ➔ Metadata ➔ Trust Row.
   - Preservar contadores de visualizações e badges reais.

3. **`CompanyCTAGroup.tsx`**:
   - Layout compacto de 2 camadas sem quebra desordenada de linhas.
   - Primary CTA `Solicitar contato` + Secondary `Comparar`.
   - Quick actions (`Favoritar`, `Compartilhar`, `Avaliar/WhatsApp`) com tamanho visual `36x36px` e hit-area acessível.

4. **`CompanyPremiumHero.tsx`**:
   - Reduzir altura mobile para `h-[132px]`.

5. **`CompanyProfileShell.tsx`**:
   - Ajustar espaçamentos verticais de `py-6` para `py-4`.

6. **`MobileBottomNav.tsx` & `mobileNavTokens.ts`**:
   - Remover FAB central elevado no botão de Busca, tornando a barra 100% plana com `52-56px` de altura.
