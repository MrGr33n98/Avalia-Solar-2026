# Resumo da Pesquisa: Ecossistema Mobile AB0-1

**Domínio:** Marketplace de Energia Solar (B2C e B2B)
**Pesquisado em:** 17/06/2026
**Confiança Geral:** ALTA

## Visão Geral Executiva

O aplicativo mobile `AB0-1-mobile` é uma plataforma robusta desenvolvida com **Expo** e **React Native**, servindo tanto como marketplace para consumidores (B2C) quanto como ferramenta de gestão para empresas integradoras de energia solar (B2B). O ecossistema é suportado por um backend Ruby on Rails, utilizando uma estratégia híbrida de comunicação via **REST (TanStack Query)**, **GraphQL (Apollo Client)** e **WebSockets (ActionCable)**.

A arquitetura é moderna, utilizando **Expo Router** para navegação baseada em arquivos e **Zustand** para gerenciamento de estado global simplificado. O projeto demonstra um foco forte em performance e experiência offline, implementando persistência de cache para o Apollo Client.

## Descobertas Principais

**Stack:** Expo 56, React Native 0.85, React 19, Apollo Client 4.2, TanStack Query 5, Zustand 5, ActionCable e PostHog.
**Arquitetura:** Navegação via Expo Router com estrutura de abas customizada; comunicação híbrida (REST para operações simples, GraphQL para dados complexos e fallback); tempo real via ActionCable.
**Pitfall Crítico:** Inconsistência na implementação do Chat. Coexistem duas versões: uma baseada em polling (`/chat`) e outra em ActionCable (`/p2p_chat`), o que gera confusão arquitetural e duplicidade de código.

## Implicações para o Roadmap

Com base na pesquisa, sugere-se a seguinte estrutura de fases para QA e desenvolvimento:

1. **Fase de Consolidação de Chat** - Unificar as implementações de chat para usar exclusivamente ActionCable, removendo a versão de polling para reduzir overhead de rede e bateria.
2. **Fase de Validação de Performance B2B** - Testar a escalabilidade do Dashboard in-app para empresas com alto volume de leads e métricas complexas.
3. **Fase de Auditoria de Versões** - Validar a compatibilidade da stack "bleeding edge" (RN 0.85, Apollo 4.2) com bibliotecas nativas de mapas e localização.

**Racional de Ordenação:**
- A correção do Chat é prioritária por ser um requisito de PRD (CHAT-01) e uma fonte óbvia de bugs e inconsistência de UI.

## Avaliação de Confiança

| Área | Confiança | Notas |
|------|-----------|-------|
| Stack | ALTA | Extraído diretamente do `package.json`. |
| Funcionalidades | ALTA | Mapeado via `src/app` e `src/features`. |
| Arquitetura | MÉDIA | Padrões identificados, mas a integração exata ActionCable/Apollo precisa de teste de carga. |
| Pitfalls | ALTA | Inconsistência de chat documentada nos requisitos e código. |

## Lacunas a Endereçar

- **Estratégia de Notificações Push:** O `package.json` tem `expo-notifications` ausente, mas `notifications.tsx` existe. Precisa verificar como as notificações são entregues (se apenas in-app ou via serviço externo).
- **Testes E2E:** Existe um arquivo `e2e.test.ts` quase vazio; a cobertura de testes de fluxo completo parece baixa.
