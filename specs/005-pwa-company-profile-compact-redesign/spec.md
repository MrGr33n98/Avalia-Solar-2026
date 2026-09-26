# Spec: PWA Company Profile Compact Redesign

## 1. Executive Summary
Refatoração da densidade visual do Perfil Público da Empresa no PWA Mobile. O objetivo é transformar o topo do perfil em um header compacto, scan-friendly e de alta densidade sem alterar os contratos do backend ou remover dados reais.

## 2. Root Causes Tratadas
- **RC-01:** `CompanyProfileTabs.tsx` usava `h-[100px]` no mobile, ocupando altura excessiva.
- **RC-02:** Logo de `92x92px` (`-mt-12`) dimensionado como card e não header compacto.
- **RC-03:** `CompanyCTAGroup.tsx` usava `flex-wrap` desordenado gerando linhas adicionais.
- **RC-04:** Trust e metadata misturados no mesmo fluxo vertical.
- **RC-05:** `MobileBottomNav.tsx` continha FAB elevado central (`44px` `-mt-4`) criando peso visual desnecessário.

## 3. Alvos Dimensionais Mobile
- **Hero Mobile:** `128–136px` (de `145px`).
- **Logo Mobile:** `64–68px` (de `92px`).
- **Logo Overlap:** `-28px` a `-32px`.
- **Tabs Mobile Height:** `48–56px` (de `100px`).
- **Ícone das Tabs:** `17–19px` (de `24px`).
- **Gap entre Hero e Tabs:** `mt-2.5` (de `mt-5`).
- **Bottom Nav:** `52–56px` plana (sem FAB elevado).
