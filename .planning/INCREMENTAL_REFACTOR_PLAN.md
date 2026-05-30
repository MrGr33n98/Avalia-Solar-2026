# INCREMENTAL REFACTOR PLAN — Estratégia de Transição Suave

Para evitar interrupções no portal de produção do Avalia Solar, a refatoração visual da página de perfil comercial adotará uma **estratégia de transição suave por abas**.

---

## 1. Princípios Chaves da Transição

- **Preservação de Lógica Legada:** O arquivo `CompanyDetailClient.tsx` legado continuará existindo como ponto de entrada principal da rota pública.
- **Componentes Isolados:** Cada uma das novas abas refatoradas será desenvolvida em arquivos separados sob o diretório `components/` na rota `app/companies/[id]/`. Elas receberão dados puros via props, permitindo testes isolados.
- **Feature Flag Local:** Utilizaremos uma flag condicional simples no topo do `CompanyDetailClient.tsx` para alternar a exibição da página inteira. Isso permite homologar a nova experiência Premium Leve localmente sem impactar a produção:
  ```typescript
  const ENABLE_PREMIUM_PROFILE = process.env.NEXT_PUBLIC_ENABLE_PREMIUM_PROFILE === 'true';
  ```

---

## 2. Roteiro de Implantação por Waves

A migração seguirá 3 ondas (Waves) de entrega de código:

### 🌊 Wave 1: Fundação & Visão Geral (Fases 2 e 3)
- Criação dos novos componentes do Shell (`CompanyProfileShell`, `CompanyPremiumHero` e `CompanyProfileTabs`).
- Implementação da nova aba `OverviewTab` e Sidebar premium.
- Validação visual do Hero responsivo com fotos de cobertura reais do S3.

### 🌊 Wave 2: Conteúdo Comercial & Monetização (Fases 4, 5 e 6)
- Lançamento do novo motor de reviews na aba `ReviewsTab`.
- Criação do catálogo dinâmico de produtos com filtros horizontais e layout alternável.
- Integração dos slots de banners responsivos (`AdSlot`).

### 🌊 Wave 3: Prova Social, Estatísticas & Tracking (Fases 7, 8, 9 e 10)
- Inclusão da galeria de projetos concluídos e linha do tempo do processo.
- Integração da aba Estatísticas com teaser de upgrade de plano.
- Acionamento das chamadas de telemetria dos 22 eventos e auditoria final de SEO e acessibilidade.
