# Buyer Intent Audit — Avalia Solar 2026
**Auditoria de Telemetria de Intenção de Compra e Sinais B2B**  
**Data:** 26 de Novembro de 2026  

---

## 1. Visão Geral da Arquitetura de Buyer Intent

O Avalia Solar conta com um serviço de cálculo de score de intenção no backend:
* **Arquivo:** `AB0-1-back/app/services/buyer_intent_score_service.rb`
* **Modelo de Dados:** `analytics_events` e pontuações consolidadas por empresa e visitante anônimo.
* **Componentes de Sinal Considerados:**
  1. *Visitas repetidas ao perfil da empresa* (peso 15).
  2. *Tempo de permanência na página superior a 120s* (peso 20).
  3. *Adição ao comparador* (peso 25).
  4. *Visualização da aba de preços/produtos* (peso 15).
  5. *Clique em botão de contato (WhatsApp, Telefone, E-mail)* (peso 25).

---

## 2. Gaps Críticos de Telemetria de Buyer Intent Identificados

### 2.1 Desconexão entre Frontend e GA4
* O frontend registra os eventos de interação via `track()` em `AB0-1-front/lib/analytics/index.ts`.
* Esses dados alimentam perfeitamente o PostHog e o banco local de eventos via `sendJsonApiMutationWithOfflineQueue('/analytics/events')`.
* **No entanto, NENHUM desses sinais é enviado ao GA4.**
* O GA4 não recebe `buyer_intent_score`, nem os cliques em WhatsApp ou Comparador.
* **Impacto Comercial:** As empresas que assinam o dashboard empresarial não conseguem cruzar os dados do GA4 com os leads do painel, gerando discrepâncias entre o número de visitas reportado no GA4 e o número de sinais de intenção no dashboard.

### 2.2 Deduplicação e Concorrência
* Em sessões com múltiplos cliques rápidos no WhatsApp ou reabertura do comparador, o backend do Avalia Solar implementa `event_id` determinístico para evitar duplicação de pontuação de intenção.
* **Recomendação:** Replicar o mesmo `event_id` como parâmetro de transação/evento no GA4 para garantir 100% de paridade entre o banco de dados e os relatórios analíticos.

