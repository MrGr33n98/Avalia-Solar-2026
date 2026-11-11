# Contrato da API Meta Instagram (Unified Login)
## Avalia Solar — Instagram Autonomous Content Engine

**Documento:** Meta API Contract Specification  
**Plataforma:** Meta Graph API  
**Host Oficial:** `https://graph.facebook.com`  
**Versão Fixada:** `v21.0`  
**Aplicativo Meta:** `Avalia Solar Social`  
**Conta Vinculada:** `@avalia_solar`  
**Modalidade:** Instagram API with Unified Login (System-User Access Token)  

---

## 1. Permissões e Escopo de Acesso

A credencial no n8n (`meta_instagram_api`) utiliza um System-User Access Token gerado no Meta Business Manager com os seguintes escopos obrigatórios:
* `instagram_basic`: leitura do perfil e metadados da conta comercial.
* `instagram_content_publish`: criação de contêineres e publicação de imagens e vídeos no feed.
* `pages_show_list`: listagem de páginas vinculadas (quando aplicável ao Unified Login).
* `pages_read_engagement`: leitura de engajamento para telemetria analítica (WF-IG-06).

> **Segurança:** O Access Token nunca deve ser trafegado em parâmetros de URL (query string). Todas as requisições autenticadas devem enviar o cabeçalho HTTP:
> `Authorization: Bearer <META_SYSTEM_USER_TOKEN>`

---

## 2. Endpoints do Ciclo de Publicação de Imagem Única

### 2.1 Verificação de Identidade (Preflight)
* **Método:** `GET`
* **URL:** `https://graph.facebook.com/v21.0/{ig-user-id}?fields=id,username,name,profile_picture_url`
* **Resposta Esperada (200 OK):**
  ```json
  {
    "id": "17841400000000000",
    "username": "avalia_solar",
    "name": "Avalia Solar",
    "profile_picture_url": "https://scontent..."
  }
  ```
* **Critério de Validação:** Se `username` for diferente de `avalia_solar`, abortar a execução imediatamente.

---

### 2.2 Criação do Contêiner de Mídia
* **Método:** `POST`
* **URL:** `https://graph.facebook.com/v21.0/{ig-user-id}/media`
* **Payload (JSON):**
  ```json
  {
    "image_url": "https://www.avaliasolar.com.br/api/social/render-post?article_id=6&format=feed",
    "caption": "Seu projeto solar merece o fabricante certo. Confira o guia no Avalia Solar. #EnergiaSolar #AvaliaSolar"
  }
  ```
* **Requisitos da Imagem:**
  * Formato: JPEG ou PNG sem transparência.
  * Proporção permitida: entre 4:5 (vertical 1080×1350) e 1.91:1 (horizontal). Recomendado: **4:5 (1080×1350)**.
  * Acessibilidade da URL: HTTPS público direto, sem autenticação, sem redirecionamentos complexos, tamanho máximo 8MB.
* **Resposta Esperada (200 OK):**
  ```json
  {
    "id": "17900000000000000"
  }
  ```
  *(O ID retornado é o `creation_id` do contêiner).*

---

### 2.3 Consulta de Status do Contêiner (Polling)
* **Método:** `GET`
* **URL:** `https://graph.facebook.com/v21.0/{creation-id}?fields=status_code,status`
* **Respostas Possíveis:**
  * `{"status_code": "FINISHED", "status": "Ready to publish"}`: Mídia processada, prosseguir para publicação.
  * `{"status_code": "IN_PROGRESS"}`: Mídia em processamento pelo CDN da Meta. Aguardar 5s e tentar novamente (máximo 6 tentativas = 30s).
  * `{"status_code": "ERROR"}` ou `{"status_code": "EXPIRED"}`: Falha de processamento no CDN da Meta. Abortar e disparar WF-IG-99.

---

### 2.4 Publicação do Contêiner
* **Método:** `POST`
* **URL:** `https://graph.facebook.com/v21.0/{ig-user-id}/media_publish`
* **Payload (JSON):**
  ```json
  {
    "creation_id": "17900000000000000"
  }
  ```
* **Resposta Esperada (200 OK):**
  ```json
  {
    "id": "18000000000000000"
  }
  ```
  *(O ID retornado é o `media_id` público da publicação).*

---

### 2.5 Verificação e Obtenção do Permalink
* **Método:** `GET`
* **URL:** `https://graph.facebook.com/v21.0/{media-id}?fields=id,permalink,timestamp,caption`
* **Resposta Esperada (200 OK):**
  ```json
  {
    "id": "18000000000000000",
    "permalink": "https://www.instagram.com/p/ABC123xyz/",
    "timestamp": "2026-11-10T19:30:00+0000",
    "caption": "..."
  }
  ```

---

## 3. Mapeamento de Erros e Políticas de Retry

| Código Meta | Subcódigo | Descrição | Ação no n8n |
|---|---|---|---|
| `190` | `463` / `467` | Token expirado ou revogado | Falha Crítica: abortar e notificar imediatamente |
| `10` | - | Permissão negada para o recurso | Falha Crítica: verificar permissões no Meta App |
| `4` / `17` / `32` | - | Rate limit atingido | Backoff exponencial (esperar 5 min) e retry |
| `36003` | - | Formato ou dimensão de imagem inválida | Falha Alta: quarentena do post, não retentar |
| `9007` | - | URL da imagem inacessível para os bots da Meta | Falha Alta: verificar conectividade HTTPS da mídia |
| `2207001` | - | Contêiner não está pronto para publicação | Polling adicional de status (`status_code != FINISHED`) |
| `2207003` | - | Mídia já foi publicada anteriormente | Idempotência detectada: marcar como publicada |
