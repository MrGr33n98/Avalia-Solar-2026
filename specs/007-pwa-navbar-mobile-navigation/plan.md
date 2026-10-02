# Plano — Navbar e navegação mobile PWA

## Diagnóstico

A navbar compartilhada continha controles mobile adicionais e o componente de categorias não tinha uma visão principal de navegação. O drawer também repetia autenticação e não separava claramente menu principal de categorias.

## Solução

1. Manter desktop inalterado por classes `dashboard`.
2. Fazer a região PWA renderizar:
   - loading: placeholder de 44px;
   - visitante: hamburger;
   - autenticado: avatar compacto.
3. Reutilizar `MobileCategoriesDrawer` como drawer principal e submenu.
4. Usar `useAuth` para identidade e logout reais.
5. Preservar `useCategoriesTree` para categorias e contagens.
6. Usar links comprovados do App Router.
7. Reaproveitar Sheet Radix para foco, Escape e overlay.
8. Cobrir o contrato visitante/autenticado no teste do Navbar.

## Arquivos

- `AB0-1-front/components/Navbar.tsx`
- `AB0-1-front/components/navigation/MobileCategoriesDrawer.tsx`
- `AB0-1-front/components/navigation/UserAvatarDropdown.tsx`
- `AB0-1-front/__tests__/components/Navbar.test.tsx`
