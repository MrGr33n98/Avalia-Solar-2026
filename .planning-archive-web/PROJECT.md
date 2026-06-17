# Projeto GSD — Refatoração Premium Leve da Página de Perfil da Empresa | Avalia Solar

## What This Is

Este projeto consiste na refatoração completa e de alto nível da página pública de perfil comercial das empresas no portal **Avalia Solar**. Nosso objetivo é elevar a experiência do usuário (UX/UI) para um padrão **Premium Leve**, limpo, dinâmico e comercialmente persuasivo, ampliando a conversão e gerando novos pontos de monetização nativos sem comprometer as regras de faturamento, Stripe, tabelas de bancos de dados ou a estabilidade atual da API.

## Core Value

- **Credibilidade SaaS**: Uma página de perfil que inspira confiança imediata e facilita a comparação inteligente entre instaladores, fornecedores e integradores do setor.
- **Monetização Avançada**: Slots estratégicos e não intrusivos para anúncios e patrocinados, geridos diretamente no painel do Active Admin.
- **Diferenciação por Planos**: Exposição clara de recursos baseada nos *entitlements* da empresa (planos Free, Essential, Pro e Enterprise).

## Context

Atualmente, o portal conta com uma visualização de perfil funcional, porém estática e com pouca inteligência comercial. O ecossistema do backend Rails é maduro e já possui as regras e modelagem de `Plan`, `PlanFeatureCatalog`, `CompanyFeatureAccessResolver` e `Banner`, os quais servirão como motor para a exibição de recursos controlados.

## Key Decisions

| Decisão | Rationale | Outcome |
|----------|-----------|---------|
| Abstração em abas | Substituir a barra lateral estática por um Shell unificado compartilhando Header, Hero e Sidebar, com abas isoladas para o conteúdo. | Aprovado |
| Fallback Seguro | Componentes devem renderizar skeletons elegantes ou estados vazios inteligentes se dados ou permissões estiverem ausentes. | Aprovado |
| Event Tracking no Cliente | Ingestão robusta de 22 eventos no PostHog/GTM para mapear funil de vendas. | Aprovado |
