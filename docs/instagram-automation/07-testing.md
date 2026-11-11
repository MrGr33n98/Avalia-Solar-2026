# Estratégia de Testes e Homologação
## Avalia Solar — Instagram Autonomous Content Engine

**Documento:** Test Strategy & Quality Gates  
**Padrão:** TDD, Contract Testing e E2E Sandbox  

---

## 1. Pirâmide de Testes

```text
               / \
              /E2E\             (Simulação de ciclo ponta a ponta sem publicar)
             /-----\
            / Integ \           (Testes de contrato Rails API + Render + Meta Mock)
           /---------\
          /   Unit    \         (Testes de nós n8n, schemas JSON, deduplicação, render)
         /-------------\
```

---

## 2. Níveis de Validação

### 2.1 Testes Unitários
1. **JSON Schemas dos Workflows:** Validação estrita da estrutura dos arquivos `.json` do n8n (nós válidos, conexões mapeadas, ausência de tokens hardcoded).
2. **Endpoint de Renderização Visual:** Teste unitário em Jest no Next.js (`render-post.test.ts`) validando resposta HTTP 200, Content-Type de imagem e parâmetros de entrada.
3. **Validação Editorial:** Teste de parsing da resposta de IA com garantia de todos os campos obrigatórios (`headline`, `caption`, `hashtags`, `cta`).

### 2.2 Testes de Contrato
1. **Contrato Rails API:** Verificação contínua do endpoint `GET /api/v1/articles` contra o `ArticleSerializer`.
2. **Contrato Meta Graph API:** Mock dos endpoints `POST /media`, `GET /status`, `POST /media_publish`, `GET /permalink` simulando respostas de sucesso, `IN_PROGRESS`, e erros de rate limit (`#4`) e token inválido (`#190`).

### 2.3 Teste E2E Controlado (Homologação Sem Publicação Real)
O fluxo completo é executado em modo simulado:
1. Descoberta de artigo real.
2. Geração da legenda com IA.
3. Renderização da imagem 1080×1350 px.
4. Notificação de aprovação simulada.
5. Aprovação via Webhook.
6. Criação do contêiner em ambiente de testes ou mock da Meta.
7. Emissão de evento de telemetria no PostHog.
8. Verificação de zero publicações reais no `@avalia_solar` enquanto o kill-switch estiver ativo.
