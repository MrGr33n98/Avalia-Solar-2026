# Política de Segurança Enterprise e Governança de Dados
## Avalia Solar — Instagram Autonomous Content Engine

**Documento:** Security & Compliance Policy  
**Classificação:** Confidential / Internal Engineering  
**Conformidade:** LGPD (Lei 13.709/2018), Meta Platform Terms, OWASP Top 10  

---

## 1. Gestão Segura de Credenciais

1. **Armazenamento no Cofre n8n:**
   * Nenhuma chave de API, Bearer Token ou segredo Meta é versionado no Git ou exportado nos arquivos JSON.
   * Os workflows utilizam nomes simbólicos de credenciais configurados no cofre nativo do n8n:
     * `meta_instagram_api` (Header Auth Bearer para a Graph API).
     * `openai_api` (API Key para o modelo de geração editorial).
     * `rails_backend_token` (Token de comunicação interna com a API Rails).
     * `posthog_api_key` (Chave de envio de telemetria analítica).
2. **Rotação e Revogação:**
   * O System-User Token da Meta tem validade de longa duração, mas deve ser auditado a cada 90 dias.
   * Em caso de comprometimento suspeito, o token deve ser imediatamente revogado no Meta Business Manager e atualizado na credencial do n8n.

---

## 2. Proteção contra Server-Side Request Forgery (SSRF)

Ao renderizar e validar URLs de imagem para envio à Meta:
* O sistema só aceita URLs de mídia com esquema `https://` pertencentes aos domínios autorizados na allowlist:
  * `*.avaliasolar.com.br`
  * `nyc3.digitaloceanspaces.com` (S3 do ActiveStorage)
* Endereços IP locais (`127.0.0.1`, `localhost`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`) são expressamente bloqueados por validação regex antes de qualquer requisição HTTP externa.

---

## 3. Autenticação e Integridade de Webhooks de Aprovação

* O endpoint de aprovação humana (WF-IG-04) não utiliza links abertos sem autenticação.
* Cada solicitação de aprovação gera um token de uso único (`one_time_token`) com expiração de 48 horas.
* A aprovação ou rejeição exige assinatura com segredo HMAC compartilhado (`APPROVAL_SECRET`), impedindo spoofing ou manipulação por terceiros.

---

## 4. Conformidade com a LGPD (Lei Geral de Proteção de Dados)

* Nomes de autores ou revisores de avaliações não devem ser citados publicamente no Instagram sem consentimento explícito.
* As postagens são geradas a partir de dados públicos de artigos do blog e catálogos institucionais de empresas registradas no CNPJ.
* Nenhum dado pessoal sensível é enviado para prompts de IA ou telemetria do PostHog.
