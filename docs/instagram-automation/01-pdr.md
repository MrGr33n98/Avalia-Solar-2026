# Product Development Requirements (PDR)
## Avalia Solar — Instagram Autonomous Content Engine

**Documento:** PDR-A+++  
**Versão:** 1.0.0 (MVP)  
**Status:** Aprovado para Implementação  

---

## 1. Problema de Negócio

A operação manual de marketing de conteúdo nas redes sociais do Avalia Solar consome esforço repetitivo de equipe em tarefas não escaláveis:
* Seleção manual de artigos e temas no banco de dados.
* Redação manual de legendas adaptadas ao Instagram.
* Diagramação manual de artes no Canva/Figma.
* Revisão e validações regulatórias fragmentadas.
* Agendamento e publicação manual no Meta Business Suite.
* Falta de rastreabilidade de ponta a ponta e métricas operacionais centralizadas no PostHog.

Isso gera inconsistência na cadência editorial, custos operacionais desnecessários e risco de erros em dados técnicos e regulatórios (ANEEL, CCEE).

---

## 2. Objetivos e Resultados-Chave (OKRs)

### 2.1 Objetivo Principal
Implantar uma máquina de publicação autônoma, segura e auditável, que transforme artigos validados do Avalia Solar em postagens de alta autoridade visual e técnica no Instagram `@avalia_solar`, com aprovação humana obrigatória no MVP.

### 2.2 Métricas de Sucesso Operacional
| Indicador | Meta MVP | Meta V2 |
|---|---|---|
| Frequência de postagens | 3 posts/semana | 5–7 posts/semana |
| Publicações sem aprovação prévia | 0 (Zero) | 0 (Zero) |
| Publicações duplicadas acidentais | 0 (Zero) | 0 (Zero) |
| Taxa de sucesso operacional | ≥ 99% | ≥ 99.5% |
| Rastreabilidade de execuções | 100% no n8n + PostHog | 100% |
| Tempo médio de geração do pacote | < 30 segundos | < 20 segundos |
| Confiabilidade técnica dos claims | 100% auditado | 100% auditado |

---

## 3. Personas e Segmentação de Conteúdo

1. **Consumidor Residencial e Comercial:**
   * Dúvidas sobre retorno de investimento (Payback), garantias de inversores e painéis, qualidade de instalação e selos de confiança.
2. **Integrador e Instalador Solar B2B:**
   * Profissionalização, credenciamento, boas práticas normativas (NBR 16690, NBR 5410) e posicionamento no ranking do Avalia Solar.
3. **Gestor de Energia e Indústria (Mercado Livre de Energia - ACL):**
   * Migração tarifária, contratos bilaterais, certificados de energia renovável (I-REC), medição e faturamento CCEE.
4. **Investidor e Empresa em Transição Energética:**
   * Armazenamento em baterias (BESS), recarga de veículos elétricos e eficiência energética.

---

## 4. Escopo do Produto

### 4.1 Escopo MVP (Fase Atual)
* **WF-IG-00 (Preflight):** Verificação de integridade e conectividade com a Meta Graph API via credencial segura.
* **WF-IG-01 (Discovery):** Consumo da API pública de artigos (`GET /api/v1/articles`), filtragem por status publicado e deduplicação determinística.
* **WF-IG-02 (AI Editorial Engine):** Geração de legendas profissionais com Hook, Contexto, Explicação, Insight, CTA e hashtags, com validação de JSON Schema.
* **WF-IG-03 (Media Generation):** Renderização server-side em 1080×1350 px (proporção 4:5 vertical) utilizando o design system do Avalia Solar.
* **WF-IG-04 (Approval):** Solicitação de aprovação humana com preview visual, botão de aprovação e rejeição via webhook seguro.
* **WF-IG-05 (Publisher):** Criação de contêiner de mídia, polling de status (`FINISHED`), publicação e confirmação com chave de idempotência e kill switch.
* **WF-IG-06 (Analytics):** Envio de telemetria operacional e métricas para o PostHog.
* **WF-IG-99 (Error Handler):** Captura de exceções com classificação de severidade e alertas.

### 4.2 Escopo V2
* Carrosséis educativos de 3 a 7 slides no formato 1080×1350 px.
* Coleta automática de métricas de engajamento da Meta (impressões, alcance, curtidas, comentários, salvamentos).
* Reaproveitamento inteligente de artigos perenes (evergreen).

### 4.3 Escopo V3
* Vídeos automatizados e Reels via Remotion.
* Distribuição multicanal (LinkedIn, Threads, Bluesky).
* Otimização algorítmica de horários de postagem com base em dados de audiência.
