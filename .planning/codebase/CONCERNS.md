# Preocupações e Áreas Frágeis - Avalia Solar

Este documento destaca os pontos de atenção críticos da base de código do **Avalia Solar**, incluindo débitos técnicos históricos, vulnerabilidades potenciais, desafios de caching no Next.js, N+1 queries monitoradas e recomendações de manutenção preventiva.

---

## 💻 Preocupações no Frontend (`AB0-1-front`)

### 1. Complexidade de Caching e Invalidação no Next.js 14
*   **Contexto:** O App Router do Next.js armazena cache de forma extremamente agressiva por padrão. Isso pode fazer com que alterações de status feitas pelas empresas (como ativar/desativar banners, alterar CTAs) demorem a refletir no portal público Next.js se as chaves de revalidação ou tags não forem acionadas cirurgicamente.
*   **Ponto Frágil:** O processo de build executa rotas de aquecimento (`npm run postbuild` que chama `script/warm-home-cache.mjs`). Se a API Rails estiver fora do ar ou lenta durante o build, o site pode apresentar estados de fallback obsoletos.
*   **Recomendação:** Monitorar de perto os logs de revalidação via Sentry e garantir que qualquer mutação no Rails envie uma invalidação por webhook instantânea para o Next.js revalidar as tags de cache relevantes.

### 2. Sincronização offline e Banco Dexie (IndexedDB)
*   **Contexto:** O uso de `dexie` para guardar estados locais offline adiciona complexidade na reconciliação de dados quando o cliente restabelece conexão (ex: sincronização de propostas de projetos e leads).
*   **Área Frágil:** Condições de corrida na gravação local se o usuário abrir várias abas no navegador ao mesmo tempo.

---

## ⚙️ Preocupações no Backend (`AB0-1-back`)

### 1. Gargalos em Consultas de Banco de Dados (N+1 Queries)
*   **Contexto:** Em listagens complexas (como categorias com múltiplas empresas parceiras, banners ativos e avaliações de setor), é fácil cair em ineficiências de consulta N+1.
*   **Mitigação Ativa:** A gem `bullet` está instalada e ativa no ambiente de desenvolvimento (`group :development` do [Gemfile:L112](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/Gemfile#L112)) para disparar alertas sempre que faltar um `includes`, `preload` ou `eager_load` nas associações ActiveRecord do Rails.
*   **Recomendação:** Garantir que todas as consultas em controladores de API que retornam listas (ex: `Api::V1::CompaniesController#index`) incluam carregamento antecipado de associações associadas, mantendo o tempo de resposta da API abaixo de 100ms.

### 2. Segurança e Vazamento de Chaves (Scan Ativo)
*   **Ferramentas:** O backend possui a gem `brakeman` ([Gemfile:L108](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/Gemfile#L108)) para análise estática de segurança do código Rails, buscando brechas de CSRF, SQL Injection, Mass Assignment e vazamento acidental de chaves.
*   **Ponto Frágil:** Arquivos `.env` locais ou arquivos do Active Storage contendo chaves privadas (S3, DigitalOcean, Sentry, Stripe).
*   **Ação:** Nunca commitar arquivos `.env` ou `.env.secrets`. Usar o arquivo `.env.example` como gabarito.

### 3. Namespace do Redis e Conexão de Background Jobs
*   **Histórico:** A remoção de `redis-namespace` e bloqueios de versão em `connection_pool` ([Gemfile:L41-L46](file:///c:/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/Gemfile#L41-L46)) ocorreram devido a incompatibilidades críticas do Redis com o Sidekiq 7+.
*   **Área Frágil:** Em ambientes locais no Windows, o cliente Redis em C (`hiredis`) costuma quebrar.
*   **Ajuste:** Mantido o fallback automático em Ruby puro no Windows para garantir estabilidade completa de desenvolvimento.

---

## 🔄 Riscos de Integração e Comunicação Híbrida

### 1. Divergência de Tipos e Esquemas (TypeScript vs Rails)
*   **Contexto:** Como o frontend é escrito em TypeScript com esquemas Zod e o backend Rails se baseia na flexibilidade dinâmica de tabelas PostgreSQL, alterações em schemas do banco de dados Rails (como a remoção ou renomeação de campos na tabela de leads) podem quebrar silenciosamente validações do Zod no Next.js.
*   **Mitigação:** Manter a suíte de testes de integração do Rspec sincronizada com os testes E2E do Playwright no frontend. Qualquer quebra em endpoints REST deve se manifestar instantaneamente nas validações automáticas do CI/CD.
