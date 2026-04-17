# Auditoria A++++ - URL `https://app.avaliasolar.com.br/entrar`

**Data da auditoria:** 2026-04-12  
**Escopo:** URL pública de entrada/login, publicação do frontend, contrato com backend de autenticação, evidências do que já foi implementado no repositório e gaps atuais de produção.  
**Auditor:** Codex

## 1. Resumo executivo

### Veredito

A URL auditada **não está saudável em produção**.

O cenário atual separa-se em duas camadas:

1. **Camada de publicação/infraestrutura web:** crítica.
2. **Camada de autenticação da aplicação:** funcional e relativamente madura no código, mas com inconsistências entre rota pública, metadados, testes e documentação.

### Nota executiva

| Dimensão | Nota | Status |
|---|---:|---|
| Disponibilidade da URL auditada `/entrar` | 2/10 | Crítico |
| Publicação do host `app.avaliasolar.com.br` | 3/10 | Crítico |
| Implementação de autenticação no código | 7.5/10 | Boa, com gaps |
| Coerência entre produção e código | 5/10 | Atenção |
| Observabilidade/release hygiene | 4/10 | Atenção |
| Qualidade de evidência e documentação histórica | 8/10 | Boa |

### Diagnóstico em uma frase

**O sistema de auth existe e está implementado, mas a URL auditada falha por problemas de certificado TLS e roteamento público, além de haver drift entre o que o código entrega, o que a produção expõe e o que parte da documentação/testes ainda descreve.**

## 2. Evidências ao vivo da produção

### 2.1 DNS

O host `app.avaliasolar.com.br` resolve para:

- `64.225.59.107`

### 2.2 TLS/SSL

Ao inspecionar o certificado servido para `app.avaliasolar.com.br`, o servidor apresentou:

- **Subject/CN:** `www.avaliasolar.com.br`
- **SAN:** `DNS:www.avaliasolar.com.br`
- **Validade:** `2026-03-20` até `2026-06-18`

### Conclusão

O host `app.avaliasolar.com.br` está servindo **o certificado errado**.  
Isso explica o erro de validação TLS e derruba confiança, acesso normal por browser/curl e experiência do usuário.

### 2.3 Comportamento da URL auditada `/entrar`

Resposta observada:

- **URL:** `https://app.avaliasolar.com.br/entrar`
- **Status:** `HTTP/2 404`
- **Servidor:** `openresty`
- **App:** `Next.js`

Achados relevantes:

- a rota `/entrar` **não existe** na aplicação publicada;
- a resposta retorna uma página 404, porém com herança forte de metadados da home;
- o usuário que entrar por esse endereço encontra erro imediatamente.

### 2.4 Comportamento da rota real `/login`

Resposta observada:

- **URL:** `https://app.avaliasolar.com.br/login`
- **Status:** `HTTP/2 200`
- **x-nextjs-cache:** `HIT`
- **x-release:** `unknown`

Achados relevantes:

- a rota funcional publicada hoje é `/login`, não `/entrar`;
- a página está servida, mas o HTML inicial herda metadados genéricos da home;
- há indícios de **bailout para client-side rendering**, com o login dependendo de hidratação no cliente.

### 2.5 Metadados e cabeçalhos

No HTML/cabeçalhos de `/login` e `/entrar`, observei:

- `canonical` apontando para `https://www.avaliasolar.com.br`
- `og:url` também apontando para `https://www.avaliasolar.com.br`
- `title` genérico da home em vez de um título específico de login
- `x-release: unknown`
- `connect-src` da CSP contendo `http://localhost:3001`

### Conclusão

Há **vazamento de configuração de ambiente** e **metadados incorretos** para a rota de autenticação publicada.

### 2.6 Backend de auth

Evidências vivas:

- `https://api.avaliasolar.com.br/health` respondeu `HTTP/2 200`
- `POST /api/v1/auth/login` com payload vazio respondeu corretamente:
  - `HTTP/2 422`
  - `{"code":"MISSING_CREDENTIALS","message":"Email e senha são obrigatórios."}`

### Conclusão

A API de autenticação está **no ar** e responde de forma coerente para validação básica.

## 3. O que já está feito no código

### 3.1 Frontend de login existe e está implementado

Há uma rota real de login em [app/login/page.tsx](/mnt/c/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/app/login/page.tsx:1), que:

- usa `usePageTracking`;
- renderiza `AuthModal` com `initialTab="login"`.

O modal real está em [AuthModal.tsx](/mnt/c/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/app/(auth)/components/AuthModal.tsx:18) e entrega:

- aba `Entrar`;
- aba `Criar conta`;
- alternância entre cadastro de usuário e empresa;
- fechamento com animação e navegação;
- layout modal responsivo.

O conteúdo do login está em [LoginTab.tsx](/mnt/c/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/app/(auth)/components/LoginTab.tsx:13) com:

- login por email/senha;
- login social com Google, Facebook e LinkedIn;
- tratamento de sessão expirada/unauthorized por query param;
- resend de confirmação de email;
- redirect sanitizado via `return_to`/`redirect`;
- loading/error states.

### 3.2 Backend de auth está mais avançado do que parte da documentação sugere

O controller [auth_controller.rb](/mnt/c/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/app/controllers/api/v1/auth_controller.rb:12) já implementa:

- `login`
- `register`
- `signup`
- `logout`
- `logout_all`
- `refresh`
- `me`
- `forgot_password`
- `reset_password`
- `resend_confirmation`
- `confirm_email`

Além disso, o backend hoje **já possui refresh token**, inclusive com rotação:

- `refresh` em [auth_controller.rb](/mnt/c/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/app/controllers/api/v1/auth_controller.rb:247)
- emissão de access + refresh token em [auth_controller.rb](/mnt/c/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/app/controllers/api/v1/auth_controller.rb:538)

### 3.3 Rate limiting já foi implementado

Há proteção de brute force e abuso em [rack_attack.rb](/mnt/c/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/config/initializers/rack_attack.rb:53):

- login por IP
- login por email
- forgot password por IP/email
- resend confirmation por IP/email

### 3.4 Auth orchestration no frontend já existe

O contexto [AuthContext.tsx](/mnt/c/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/contexts/AuthContext.tsx:35) já faz:

- `checkAuth`
- `login`
- `logout`
- social login
- `refreshAuth`
- roteamento por role

### 3.5 Documentação histórica já foi produzida

O repositório já contém material relevante:

- [auth_diagnostico.md](/mnt/c/Users/Bobi/Desktop/AB0-1-main/docs/auth_diagnostico.md:1)
- [WCAG_ACCESSIBILITY_REPORT.md](/mnt/c/Users/Bobi/Desktop/AB0-1-main/docs/WCAG_ACCESSIBILITY_REPORT.md:1)
- [AUDITORIA_TRACKING_TAGS_COMPLETA.md](/mnt/c/Users/Bobi/Desktop/AB0-1-main/docs/AUDITORIA_TRACKING_TAGS_COMPLETA.md:1)
- [RELATORIO_AUDITORIA_TECNICA_2026-02-24.md](/mnt/c/Users/Bobi/Desktop/AB0-1-main/docs/RELATORIO_AUDITORIA_TECNICA_2026-02-24.md:1)

## 4. Principais achados

## 4.1 P0 - Certificado TLS incorreto no host `app.avaliasolar.com.br`

**Impacto**

- quebra acesso confiável ao frontend;
- navegador pode mostrar aviso de segurança;
- automações, crawlers, uptime checks e clientes HTTP falham;
- percepção de produto instável/inseguro.

**Leitura executiva**

O subdomínio de aplicação está servindo o certificado do domínio `www`, não o certificado do próprio host `app`.

## 4.2 P0 - A URL auditada `/entrar` está quebrada em produção

**Impacto**

- qualquer campanha, link externo, bookmark, QR code ou fluxo em português que use `/entrar` cai em 404;
- perda direta de conversão e confiança;
- suporte recebe tickets desnecessários.

**Causa provável**

No código local existe [app/login/page.tsx](/mnt/c/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/app/login/page.tsx:1), mas **não existe rota `app/entrar`**.

## 4.3 P1 - Drift entre contrato público e implementação real

**Evidência**

- backend retorna `redirect_to` de company user para `/company-dashboard?...` em [auth_controller.rb](/mnt/c/Users/Bobi/Desktop/AB0-1-main/AB0-1-back/app/controllers/api/v1/auth_controller.rb:83)
- frontend, ao rotear após login, empurra para `/dashboard?company_id=...` em [AuthContext.tsx](/mnt/c/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/contexts/AuthContext.tsx:127)
- `LoginTab` ainda tenta aplicar `safeReturnTo || '/dashboard'` em [LoginTab.tsx](/mnt/c/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/app/(auth)/components/LoginTab.tsx:50)

**Impacto**

- comportamento de navegação pós-login pode divergir por papel/contexto;
- maior risco de loops, páginas erradas ou debugging difícil.

## 4.4 P1 - Testes da página de login parecem desatualizados

O arquivo [login.test.tsx](/mnt/c/Users/Bobi/Desktop/AB0-1-main/AB0-1-front/__tests__/pages/login.test.tsx:1) ainda assume:

- uma UI em formato de card;
- `useAuth` vindo de `@/hooks/useAuth`;
- textos e links que não representam o modal atual.

Enquanto isso, a página real usa:

- `AuthModal`
- `useAuth` de `@/contexts/AuthContext`
- tabs e fluxo visual diferentes.

**Conclusão**

Há alto risco de os testes estarem cobrindo uma versão antiga da tela, ou simplesmente não refletirem o comportamento atual.

## 4.5 P1 - Documentação histórica parcialmente defasada

Exemplo importante:

- [auth_diagnostico.md](/mnt/c/Users/Bobi/Desktop/AB0-1-main/docs/auth_diagnostico.md:1) aponta ausência de refresh token como ponto crítico;
- o código atual já implementa refresh token e rotação em backend.

**Conclusão**

O problema não é falta de documentação, e sim **drift documental**.

## 4.6 P1 - Metadados e SEO técnico da rota de login estão errados

Mesmo sendo uma página `noindex` por natureza, a publicação atual mostra:

- título genérico da home;
- canonical da home;
- Open Graph da home;
- ausência de identidade específica da rota.

**Impacto**

- debugging mais difícil;
- preview/link sharing confusos;
- sinal de que a camada de metadata por rota não está bem consolidada.

## 4.7 P2 - Produção expõe traços de ambiente incorretos

Achados:

- `x-release: unknown`
- CSP com `http://localhost:3001`

**Impacto**

- baixa rastreabilidade de deploy;
- hardening incompleto;
- mais dificuldade para observabilidade e troubleshooting.

## 4.8 P2 - Login depende fortemente de client-side render

O HTML da rota `/login` mostra bailout para renderização no cliente.  
Para uma tela de autenticação, isso não é necessariamente um bug, mas aumenta dependência de:

- hidratação JS;
- bundles;
- estabilidade do client runtime;
- percepção de loading antes da UI aparecer.

## 5. Estado atual por camada

### Frontend publicado

**Status:** parcialmente funcional

- `/login` responde 200
- `/entrar` responde 404
- host tem problema de TLS
- metadata da rota não está bem configurada

### Backend auth

**Status:** funcional

- health OK
- validação de login OK
- refresh token implementado
- forgot/reset/confirm/resend presentes
- rate limiting presente

### Qualidade de integração

**Status:** média

- existe fluxo fim a fim de auth;
- porém há inconsistência entre URL pública, contrato de redirect, metadata e testes.

## 6. Riscos de negócio

### Conversão

Alto risco de perda de entrada no funil se campanhas, links ou comunicação usarem `/entrar`.

### Confiança

Erro de certificado em host de login é um red flag imediato para usuários e parceiros.

### Operação

`x-release: unknown` e documentação/testes desatualizados reduzem velocidade de diagnóstico.

## 7. Prioridade de correção

### Sprint 0 - imediato

1. Corrigir certificado TLS de `app.avaliasolar.com.br`
2. Criar alias/redirect permanente `/entrar -> /login`
3. Confirmar se o host correto público deve ser `app.avaliasolar.com.br` ou `www.avaliasolar.com.br`

### Sprint 1

1. Corrigir metadata da rota `/login`
2. Remover `localhost` da CSP de produção
3. Propagar `release/version` real no header `x-release`

### Sprint 2

1. Alinhar contrato de redirect backend/frontend
2. Atualizar testes da página de login para o modal real
3. Atualizar docs de auth para o estado atual

## 8. Recomendações objetivas

### Recomendação 1

Tratar este problema primeiro como **incidente de publicação**, não como problema de formulário/login em si.

### Recomendação 2

Padronizar a nomenclatura pública:

- se a marca quer PT-BR: manter `/entrar` como URL oficial;
- se a rota técnica é `/login`, publicar redirect e nunca deixar 404.

### Recomendação 3

Criar uma checklist de release para auth contendo:

- DNS
- TLS
- rota pública
- rota técnica
- metadata
- CSP
- smoke test em `/login`
- smoke test em `/entrar`

## 9. Limitações desta auditoria

- Não executei o teste Jest localmente porque o ambiente atual falhou ao inicializar Node em WSL (`WSL 1 is not supported. Please upgrade to WSL 2 or above.`).
- Não validei interação visual em browser real com clique/hidratação; a auditoria live foi feita por inspeção HTTP/HTML/TLS.

## 10. Conclusão final

**Temos bastante coisa já feita e boa no stack de autenticação.**  
O problema central hoje não é ausência de auth, e sim **publicação incorreta da entrada pública da aplicação**.

Em termos práticos:

- **backend auth:** pronto e maduro o suficiente para operar;
- **frontend login:** implementado e com recursos reais;
- **URL auditada `/entrar`:** quebrada;
- **host `app`:** com certificado incorreto;
- **qualidade operacional:** precisa de alinhamento entre deploy, routing, metadata, testes e docs.

Se esse fosse um board report:

> **A plataforma de autenticação existe, mas a porta de entrada pública está mal publicada.**

