# APK Android Avalia Solar - Blueprint de Arquitetura, UI/UX e Entrega

**Status:** rascunho operacional  
**Atualizado em:** 2026-06-14  
**Objetivo:** definir o que falta para criarmos o app Android consumindo o backend Rails atual, mantendo coerencia com a arquitetura, visual e regras de negocio da plataforma web.

---

## 1. Situacao Atual

O arquivo estava vazio. A base do projeto, porem, ja possui documentos e codigo suficientes para orientar o APK:

- O frontend atual vive em `AB0-1-front`, usando `Next.js 14`, `React 18`, `TypeScript`, `Tailwind`, `React Query`, `Zustand`, `Dexie` e uma fundacao offline/PWA.
- O backend atual vive em `AB0-1-back`, com API Rails em `/api/v1`, Active Admin e PostgreSQL como fonte unica da verdade.
- Existe uma decisao mobile oficial em `docs/architecture/MADR-001-mobile-platform.md`: estrategia **PWA-first**.
- Existe uma discovery especifica para Android em `docs/discovery-app-android.md`, recomendando **Expo + React Native** para um app Android nativo/hibrido consumindo os mesmos endpoints.

### Decisao para o APK

Para gerar um APK Android real, o caminho recomendado e:

**React Native + Expo + TypeScript**, consumindo diretamente a API Rails `/api/v1`.

O app Android deve ser um cliente mobile dedicado, nao uma copia do Next.js. A dashboard B2B pode entrar como WebView no MVP se quisermos acelerar, mas os fluxos publicos e de lead devem ser nativos.

---

## 2. O Que Falta Ainda

### Produto e escopo

- [ ] Confirmar nome do app na Play Store: `Avalia Solar`, `AvaliaSolar` ou outro.
- [ ] Definir publico principal do MVP:
  - consumidor buscando empresas solares;
  - empresa parceira gerenciando perfil/leads;
  - ambos, com navegacao por perfil.
- [ ] Definir se o MVP tera login obrigatorio ou navegacao publica com login apenas para acoes sensiveis.
- [ ] Definir quais recursos entram no primeiro APK:
  - busca/listagem de empresas;
  - detalhes da empresa;
  - solicitar orcamento/lead;
  - login/cadastro;
  - reviews;
  - dashboard da empresa;
  - notificacoes push.
- [ ] Criar backlog de telas com prioridade P0/P1/P2.

### Repositorio e build Android

- [ ] Criar app em `AB0-1-app` com Expo:
  - `expo-router` para navegacao;
  - `nativewind` para tokens estilo Tailwind;
  - `@tanstack/react-query` para server state;
  - `zustand` para estado local;
  - `expo-secure-store` para JWT;
  - `expo-notifications` para push;
  - `expo-image-picker` para uploads;
  - `sentry-expo` ou Sentry React Native.
- [ ] Configurar `app.json/app.config.ts`:
  - `android.package`;
  - icone;
  - splash screen;
  - adaptive icon;
  - deep links;
  - permissao de camera/galeria se uploads entrarem no MVP.
- [ ] Configurar EAS Build:
  - `preview` para APK interno;
  - `production` para AAB da Play Store.
- [ ] Criar variaveis de ambiente:
  - `EXPO_PUBLIC_API_BASE_URL=https://api.avaliasolar.com.br/api/v1`
  - `EXPO_PUBLIC_SITE_URL=https://avaliasolar.com.br`
  - `EXPO_PUBLIC_POSTHOG_KEY`
  - `EXPO_PUBLIC_SENTRY_DSN`

### Backend/API

- [ ] Validar que todos os endpoints protegidos aceitam `Authorization: Bearer <token>`, nao apenas cookie HTTP-only.
- [ ] Confirmar formato de resposta de `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, refresh token e logout.
- [ ] Padronizar erros da API para o app:
  - `message`;
  - `errors`;
  - `code`;
  - `request_id`.
- [ ] Adicionar campo de origem em leads/reviews/eventos quando fizer sentido:
  - `origin: mobile_app`;
  - `platform: android`;
  - `app_version`;
  - `device_id` anonimizado.
- [ ] Validar uploads `multipart/form-data` para:
  - logo;
  - banner;
  - midias;
  - anexos futuros.
- [ ] Configurar App Links/Deep Links para:
  - confirmacao de e-mail;
  - reset de senha;
  - detalhes de empresa;
  - campanhas/UTM.
- [ ] Confirmar CORS para Expo Web/dev se usarmos simulador web. React Native nativo nao depende de CORS, mas WebView/dev pode depender.

### Design e UI/UX

- [ ] Criar design system mobile a partir dos tokens atuais do front.
- [ ] Definir navegacao principal:
  - tabs inferiores para publico;
  - stack para fluxos;
  - drawer ou area separada para empresa/logado.
- [ ] Criar wireframes P0:
  - Home;
  - Busca/Empresas;
  - Filtros;
  - Perfil da empresa;
  - Solicitar orcamento;
  - Login/Cadastro;
  - Minhas solicitacoes;
  - Dashboard empresa ou WebView dashboard.
- [ ] Criar estados obrigatorios:
  - loading skeleton;
  - vazio;
  - erro;
  - offline;
  - sem permissao;
  - sucesso apos envio.
- [ ] Validar acessibilidade:
  - toque minimo de 44x44dp;
  - contraste WCAG AA;
  - labels para leitores de tela;
  - textos sem truncar em telas pequenas.

### Dados, cache e offline

- [ ] Cachear GETs publicos:
  - empresas;
  - categorias;
  - estados/cidades;
  - banners;
  - artigos;
  - produtos.
- [ ] Definir TTL por dominio:
  - categorias/estados: longo;
  - empresas/busca: medio;
  - dashboard: curto;
  - perfil logado: curto e sempre revalidado.
- [ ] Criar fila offline para eventos seguros:
  - analytics;
  - consentimento;
  - clique em CTA;
  - banner events.
- [ ] Nao enfileirar no MVP:
  - login;
  - pagamentos;
  - alteracoes sensiveis de dashboard;
  - upload de midia.

### Analytics e monetizacao

- [ ] PostHog/GA4 com eventos mobile:
  - `app_opened`;
  - `company_search_started`;
  - `company_card_tapped`;
  - `company_profile_viewed`;
  - `whatsapp_tapped`;
  - `lead_started`;
  - `lead_submitted`;
  - `review_started`;
  - `review_submitted`;
  - `login_completed`;
  - `offline_queue_flushed`.
- [ ] Preservar UTM/attribution em leads e eventos.
- [ ] Separar funis `web`, `pwa` e `android_app`.
- [ ] Preparar push notifications:
  - lead recebido para empresa;
  - review novo;
  - status de solicitacao;
  - campanhas futuras.

### QA, seguranca e publicacao

- [ ] Testes unitarios de cliente API, auth store e formatadores.
- [ ] Testes E2E com Maestro ou Detox para fluxos P0.
- [ ] Teste manual em:
  - Galaxy S23/S24;
  - Pixel 7/8;
  - aparelho Android de entrada;
  - tablet Android.
- [ ] Checklist LGPD:
  - consentimento;
  - politica de privacidade;
  - exclusao/portabilidade futura;
  - dados sensiveis fora de logs.
- [ ] Checklist Play Store:
  - icone 512x512;
  - feature graphic;
  - screenshots;
  - politica de privacidade publica;
  - data safety form;
  - package name;
  - assinatura do app;
  - track interno antes de producao.

---

## 3. Arquitetura Recomendada

```txt
AB0-1-app/
  app/
    (public)/
      index.tsx
      companies/
      categories/
      company/[id].tsx
    (auth)/
      login.tsx
      register.tsx
      forgot-password.tsx
    (company)/
      dashboard.tsx
      leads.tsx
      reviews.tsx
      profile.tsx
  src/
    api/
      client.ts
      auth.ts
      companies.ts
      categories.ts
      leads.ts
      reviews.ts
      dashboard.ts
    components/
      ui/
      company/
      lead/
      dashboard/
    design/
      colors.ts
      spacing.ts
      typography.ts
      shadows.ts
    hooks/
    store/
    lib/
    analytics/
    offline/
```

### Camadas

- **Presentation:** telas Expo Router e componentes React Native.
- **Design System:** tokens proprios em `src/design`, inspirados no Tailwind atual.
- **Data Access:** clientes API tipados por dominio, equivalentes a `AB0-1-front/lib/api.ts` e `AB0-1-front/lib/api-client.ts`.
- **Server State:** React Query para cache, loading, retry e invalidacao.
- **Client State:** Zustand para sessao, filtros, preferencias e estado UI.
- **Secure Storage:** `expo-secure-store` para access/refresh token.
- **Offline:** AsyncStorage/SQLite para cache leve e fila de eventos seguros.
- **Analytics:** PostHog/GA4 com origem `android_app`.

---

## 4. Integracao com Backend

### Base URL

Usar a API Rails diretamente:

```ts
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
// producao: https://api.avaliasolar.com.br/api/v1
```

### Headers padrao

```ts
{
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Authorization": "Bearer <access_token>",
  "X-Client": "android",
  "X-App-Version": "<version>"
}
```

### Endpoints principais ja existentes

| Area | Endpoint |
|---|---|
| Login | `POST /api/v1/auth/login` |
| Cadastro | `POST /api/v1/auth/register` |
| Empresas | `GET /api/v1/companies` |
| Empresa por slug | `GET /api/v1/companies/by_slug/:slug` |
| Categorias | `GET /api/v1/categories` |
| Arvore de categorias | `GET /api/v1/categories/tree` |
| Estados/cidades | `GET /api/v1/companies/states`, `GET /api/v1/companies/cities` |
| Leads | `POST /api/v1/leads` |
| Lead wizard | `GET /api/v1/lead_wizards/resolve` |
| Reviews | `GET/POST /api/v1/reviews` |
| Dashboard geral | `GET /api/v1/dashboard/stats` |
| Dashboard empresa | `GET /api/v1/company_dashboard/*` |
| Analytics | `POST /api/v1/analytics/track`, `POST /api/v1/events/track` |
| Banners | `GET /api/v1/banners`, `POST /api/v1/banner_events` |
| Produtos | `GET /api/v1/products`, `GET /api/v1/products/filters` |

### Cliente HTTP mobile

Recomendacao:

- `axios` ou `fetch` encapsulado;
- interceptor de request para token;
- interceptor de response para `401`, refresh e logout;
- retry apenas para GETs idempotentes;
- timeout curto em mobile;
- logs sem PII.

---

## 5. Fluxos P0 do APK

### 5.1 Home

Objetivo: entrada rapida para busca e empresas em destaque.

Conteudo:

- barra de busca;
- categorias principais;
- empresas verificadas/destaque;
- CTA "Solicitar orcamento";
- banner global quando existir;
- prova social curta.

UX:

- carregar shell imediatamente;
- skeletons em cards;
- chips horizontais para categorias;
- CTA principal fixo apenas quando nao atrapalhar a navegacao.

### 5.2 Busca e listagem de empresas

Objetivo: ajudar o usuario a encontrar empresa solar confiavel.

Conteudo:

- busca por texto;
- filtros por estado/cidade;
- filtro por categoria, verificadas, avaliacao e destaque;
- cards com logo, nota, cidade, badges, CTA.

UX:

- filtros em bottom sheet;
- ordenacao em menu compacto;
- botao de limpar filtros sempre visivel no sheet;
- paginacao/infinite scroll com cuidado para nao duplicar eventos.

### 5.3 Perfil da empresa

Objetivo: converter visita em contato ou lead.

Conteudo:

- logo/banner;
- selo/verificacao;
- rating e reviews;
- descricao;
- servicos;
- area de cobertura;
- CTAs: WhatsApp, orcamento, site;
- financiamento quando habilitado;
- reviews e perguntas frequentes.

UX:

- CTA principal sticky no rodape com safe area;
- tabs internas: Visao geral, Avaliacoes, Servicos, Financiamento;
- evitar paginas longas sem anchors.

### 5.4 Solicitar orcamento/Lead

Objetivo: capturar lead qualificado com minimo atrito.

Campos MVP:

- nome;
- telefone/WhatsApp;
- e-mail;
- cidade/estado;
- tipo de projeto;
- empresa preferida quando vier de perfil;
- consentimento LGPD.

UX:

- formulario em etapas curtas;
- validacao inline;
- salvar progresso local;
- sucesso claro com proximos passos;
- enviar UTM/attribution/origin.

### 5.5 Auth

Objetivo: login/cadastro seguro sem bloquear a exploracao publica.

Telas:

- login;
- cadastro pessoa;
- cadastro empresa, se entrar no MVP;
- esqueci senha;
- confirmacao de e-mail via deep link ou web fallback.

UX:

- permitir continuar como visitante;
- pedir login no momento de valor;
- mensagens de erro humanas e especificas.

### 5.6 Dashboard empresa

Opcoes para MVP:

1. **WebView autenticada** para `/dashboard` ou `/company-dashboard`, mais rapida.
2. **Dashboard nativa resumida**, melhor UX mobile:
   - leads recentes;
   - reviews;
   - status do perfil;
   - metricas principais;
   - atalhos para editar perfil.

Recomendacao: MVP com dashboard nativa resumida + link WebView para relatorios avancados.

---

## 6. UI/UX e Design System Mobile

### Direcao visual

O app deve parecer confiavel, limpo e orientado a decisao. A marca atua como uma camada de confianca para energia solar, entao o visual precisa evitar exagero visual e privilegiar:

- clareza;
- comparacao facil;
- provas de confianca;
- CTAs diretos;
- leitura rapida em campo.

### Paleta principal

Baseada nos tokens existentes em `AB0-1-front/tailwind.config.ts` e `AB0-1-front/app/globals.css`.

| Token | Hex | Uso |
|---|---:|---|
| Brand Blue | `#0056D2` | botoes primarios, links, highlights |
| Primary Blue | `#2563EB` | estado interativo padrao, foco |
| Cyan | `#00AFEF` | informacao, detalhes leves |
| Green | `#34C759` | sucesso, verificado, WhatsApp quando apropriado |
| Emerald | `#0A7A56` | sucesso com contraste AA |
| Amber | `#B8740A` | destaque solar, badges, alertas nao criticos |
| Purple | `#6C5CE7` | planos, recursos premium, upsell |
| Slate 950 | `#0F172A` | texto principal/dark surfaces |
| Slate 500 | `#64748B` | texto secundario |
| Slate 100 | `#F1F5F9` | fundos leves |
| White | `#FFFFFF` | surfaces |
| Danger | `#B91C1C` | erros e acoes destrutivas |

### Tema claro

- Fundo app: `#F5F7FA` ou `#F8FAFC`.
- Surface/card: `#FFFFFF`.
- Texto primario: `#0F172A`.
- Texto secundario: `#475569`.
- Borda: `#E2E8F0`.
- CTA primario: `#0056D2`.
- CTA secundario: fundo branco + borda `#CBD5E1`.

### Tema escuro

- Fundo app: `#020617`.
- Surface/card: `#0F172A`.
- Surface elevada: `#1E293B`.
- Texto primario: `#F8FAFC`.
- Texto secundario: `#CBD5E1`.
- Borda: `#334155`.
- CTA primario: `#3374DB`.

### Tipografia

- Fonte: system font nativa (`Inter` opcional se quisermos paridade visual).
- Titulo tela: 24-28sp, peso 700.
- Titulo secao: 18-20sp, peso 700.
- Corpo: 15-16sp, peso 400.
- Label/metadata: 12-13sp, peso 500.
- Botoes: 15-16sp, peso 700.

Regras:

- nao reduzir texto abaixo de 12sp;
- permitir `fontScale` do Android;
- evitar caixas com altura fixa quando houver texto variavel.

### Espacamento e layout

- Grid base: 4dp.
- Padding de tela: 16dp.
- Espaco entre secoes: 24dp.
- Espaco entre cards: 12dp.
- Altura minima de toque: 44dp, preferencialmente 48dp.
- Bottom navigation: 56-64dp + safe area.
- CTA sticky: 56dp + safe area.

### Bordas e sombras

- Radius padrao: 8dp.
- Cards: 8dp a 12dp no maximo.
- Inputs: 10dp.
- Chips: 999dp apenas para filtros/tags.
- Usar sombras leves; no Android, preferir `elevation` baixa.

### Componentes obrigatorios

- `AppButton`: primary, secondary, ghost, danger, WhatsApp.
- `AppInput`: texto, telefone, e-mail, senha, busca.
- `FilterChip`.
- `CompanyCard`.
- `CompanyBadge`.
- `RatingStars`.
- `BottomSheet`.
- `EmptyState`.
- `ErrorState`.
- `OfflineBanner`.
- `Skeleton`.
- `Toast`.
- `TabBar`.
- `MetricCard`.

### Icones

Usar `lucide-react-native`, mantendo consistencia com o front que ja usa `lucide-react`.

Icones sugeridos:

- busca: `Search`;
- home: `Home`;
- empresas: `Building2`;
- categorias: `Grid2X2`;
- perfil: `User`;
- estrela: `Star`;
- verificacao: `ShieldCheck`;
- mapa/local: `MapPin`;
- telefone: `Phone`;
- WhatsApp: usar asset proprio ou icone aprovado;
- filtros: `SlidersHorizontal`;
- voltar: `ChevronLeft`.

---

## 7. Navegacao Recomendada

### Tabs publicas

1. **Inicio**
2. **Buscar**
3. **Categorias**
4. **Orcamento**
5. **Conta**

### Stack principal

- `CompanyDetails`
- `CategoryDetails`
- `LeadWizard`
- `ReviewForm`
- `Login`
- `Register`
- `ForgotPassword`
- `CompanyDashboard`

### Regras de UX

- A navegacao publica nao deve exigir login.
- Login entra quando o usuario quer salvar, avaliar, acompanhar solicitacao ou acessar dashboard.
- Filtros devem abrir em bottom sheet, nao em pagina cheia, salvo em telas muito complexas.
- CTAs de contato devem ser persistentes em perfis de empresa.

---

## 8. Estados, Erros e Offline

### Loading

- Skeleton nos cards.
- Spinner apenas para acoes curtas.
- Nunca deixar tela branca apos abrir o app.

### Erro

Mensagens sugeridas:

- Sem rede: "Voce esta offline. Mostramos os dados salvos quando possivel."
- API indisponivel: "Nao conseguimos carregar agora. Tente novamente em instantes."
- Token expirado: "Sua sessao expirou. Entre novamente para continuar."
- Validacao: mostrar mensagem perto do campo.

### Offline

MVP offline deve permitir:

- abrir home cacheada;
- ver ultimas empresas/categorias cacheadas;
- manter filtros locais;
- registrar eventos em fila;
- avisar quando dados podem estar desatualizados.

Nao prometer offline total para dashboard, login, upload ou pagamento.

---

## 9. Seguranca e LGPD

- JWT em `expo-secure-store`.
- Nunca salvar senha.
- Reduzir logs com e-mail, telefone, CPF/CNPJ ou token.
- Consentimento claro antes de enviar lead.
- Link de politica de privacidade dentro do app.
- Remover tokens no logout.
- Usar HTTPS obrigatorio.
- Proteger telas autenticadas no router.
- Sanitizar deep links.
- Evitar expor chaves privadas no bundle.

---

## 10. Telas Que Eu Ainda Criaria

Pelas telas ja geradas no Stitch, o app cobre uma boa base: splash, onboarding, selecao de perfil, categorias, busca, termos, central de ajuda, detalhe de solicitacao, configuracoes, localizacao, notificacoes e dados pessoais. Para fechar um MVP Android realmente completo, eu criaria as telas abaixo.

### 10.1 Publico e descoberta

1. **Home personalizada**
   - Atalhos para buscar empresas, solicitar orcamento, ver categorias e continuar uma solicitacao.
   - Bloco "empresas verificadas perto de voce".
   - Cards de confianca: avaliacoes reais, empresas verificadas, LGPD.

2. **Resultado de busca com lista de empresas**
   - Lista real com cards de empresas, rating, cidade, badges, CTA WhatsApp/orcamento.
   - Chips de filtros ativos.
   - Ordenacao por recomendadas, nota, avaliacoes, proximidade e recentes.

3. **Filtros avancados em bottom sheet**
   - Estado/cidade.
   - Categoria/vertical.
   - Empresas verificadas.
   - Nota minima.
   - Tipo de projeto: residencial, comercial, rural, condominio, manutencao, financiamento.
   - Limpar/aplicar filtros.

4. **Detalhe da empresa**
   - Hero com logo/banner, nota, selo verificado e localizacao.
   - CTAs fixos: WhatsApp, Solicitar orcamento, Site.
   - Abas: Visao geral, Avaliacoes, Servicos, Financiamento, Galeria.
   - Bloco de confianca: tempo de resposta, badges, cobertura, categorias.

5. **Comparativo de empresas**
   - Comparar 2 a 3 empresas.
   - Tabela mobile em cards: nota, reviews, cobertura, servicos, financiamento, selos.
   - CTA "Pedir proposta para todas".

6. **Favoritos / empresas salvas**
   - Lista de empresas salvas.
   - Empty state convidando o usuario a buscar empresas.
   - Acao rapida para remover/salvar.

7. **Mapa de empresas**
   - Opcional para V1.5.
   - Mapa com pins e lista inferior.
   - Filtro por raio/regiao.

### 10.2 Captacao de lead e orcamento

8. **Wizard de orcamento - passo 1: objetivo**
   - Instalar energia solar.
   - Comparar proposta.
   - Financiar projeto.
   - Manutencao/suporte.
   - Mobilidade eletrica/carregador.

9. **Wizard de orcamento - passo 2: local e perfil**
   - CEP/cidade/estado.
   - Residencial, comercial, rural, condominio ou industria.
   - Conta de luz aproximada ou faixa de consumo.

10. **Wizard de orcamento - passo 3: contato**
   - Nome, WhatsApp, e-mail.
   - Consentimento LGPD.
   - Preferencia de contato.

11. **Wizard de orcamento - sucesso**
   - Numero da solicitacao.
   - Proximos passos.
   - Empresas indicadas.
   - CTA para acompanhar solicitacao.

12. **Minhas solicitacoes**
   - Lista com status: enviada, visualizada, empresa respondeu, aguardando retorno, concluida.
   - Filtros por abertas/concluidas.

13. **Detalhe da solicitacao**
   - Timeline do orcamento.
   - Empresa associada.
   - Dados enviados.
   - Botao de falar com empresa.
   - Cancelar solicitacao.

### 10.3 Autenticacao e conta

14. **Login**
   - E-mail/senha.
   - Entrar com Google, se aprovado.
   - Recuperar senha.
   - Continuar como visitante.

15. **Cadastro pessoa**
   - Nome, e-mail, telefone, senha.
   - Aceite de termos e LGPD.
   - Origem `android_app`.

16. **Cadastro empresa**
   - Nome fantasia, CNPJ, telefone, cidade/estado.
   - Categoria principal.
   - CTA para reivindicar perfil existente.

17. **Confirmacao de e-mail**
   - Codigo ou deep link.
   - Reenviar codigo.
   - Estado de sucesso/erro.

18. **Esqueci senha / redefinir senha**
   - Solicitar reset.
   - Tela de nova senha via deep link.
   - Confirmacao de alteracao.

19. **Perfil do usuario**
   - Dados pessoais.
   - Preferencias de notificacao.
   - Minhas solicitacoes, favoritos, reviews.

20. **Editar meus dados**
   - Nome, telefone, e-mail, cidade/estado.
   - Validacao de campos.
   - Excluir conta/solicitar remocao de dados.

### 10.4 Reviews e reputacao

21. **Avaliar empresa - entrada**
   - Selecionar empresa.
   - Explicar criterios de avaliacao.
   - Avisar que avaliacoes passam por moderacao.

22. **Avaliar empresa - notas**
   - Nota geral.
   - Criterios: atendimento, qualidade, prazo, custo-beneficio, suporte.
   - Comentario.

23. **Avaliar empresa - sucesso**
   - Confirmacao de envio.
   - Status de moderacao.
   - CTA para ver perfil da empresa.

24. **Minhas avaliacoes**
   - Avaliacoes enviadas.
   - Status: publicada, em analise, recusada.
   - Editar quando permitido.

### 10.5 Area da empresa

25. **Dashboard empresa resumida**
   - Leads recebidos.
   - Avaliacoes recentes.
   - Visualizacoes do perfil.
   - Score de confianca/trust health.
   - Pendencias para melhorar o perfil.

26. **Leads da empresa**
   - Lista de leads.
   - Status de atendimento.
   - Filtros por novo/respondido/concluido.
   - CTA WhatsApp/telefone.

27. **Detalhe do lead**
   - Dados do cliente.
   - Objetivo/projeto.
   - Localizacao.
   - Timeline.
   - Marcar como respondido/concluido.

28. **Editar perfil da empresa**
   - Logo/banner.
   - Descricao.
   - Categorias.
   - Servicos.
   - Area de cobertura.
   - CTAs e WhatsApp.

29. **Midias da empresa**
   - Galeria de fotos.
   - Upload de imagem.
   - Remover/reordenar.

30. **Plano e assinatura**
   - Plano atual.
   - Recursos bloqueados/liberados.
   - CTA upgrade.
   - Link para billing web quando necessario.

31. **Solicitar verificacao / selo**
   - Checklist de documentos.
   - Status da verificacao.
   - Beneficios do selo.

### 10.6 Sistema, suporte e estados

32. **Offline**
   - Aviso de conexao.
   - Dados salvos recentemente.
   - Botao tentar novamente.

33. **Erro generico**
   - Mensagem amigavel.
   - Tentar novamente.
   - Voltar para inicio.

34. **Manutencao**
   - API indisponivel.
   - Status e canal de suporte.

35. **Permissoes**
   - Localizacao.
   - Notificacoes.
   - Camera/galeria para uploads.

36. **Politica de privacidade / LGPD**
   - Texto navegavel.
   - Consentimentos.
   - Gestao de dados.

37. **Central de suporte com ticket/chat**
   - Buscar ajuda.
   - Abrir chamado.
   - Historico de atendimento.

38. **Debug/diagnostico interno**
   - Ambiente.
   - Versao do app.
   - Status da API.
   - Usuario logado.
   - Somente em builds internos.

---

## 11. Prompt Mestre Para Criar as Telas Faltantes

Use este prompt no Stitch/Gemini para continuar os wireframes mantendo a mesma identidade visual:

```text
Continue o projeto "Avalia Solar App Wireframe" criando TODAS as telas faltantes para um app Android em React Native/Expo.

Contexto do produto:
Avalia Solar e uma plataforma brasileira de confianca para energia solar, mobilidade eletrica e solucoes sustentaveis. O app consome o backend Rails atual em /api/v1 e deve atender consumidores que procuram empresas confiaveis e empresas parceiras que gerenciam leads, perfil e reputacao.

Estilo visual:
- Mobile-first Android, 390x844.
- Visual limpo, premium, confiavel e editorial, sem parecer landing page.
- Fundo claro #F8FAFC ou #F5F7FA, cards brancos, bordas #E2E8F0.
- Azul principal #0056D2 / #2563EB.
- Verde sucesso #34C759 / #0A7A56.
- Amber solar #B8740A para destaques.
- Roxo #6C5CE7 somente para premium/planos.
- Texto principal #0F172A, texto secundario #475569.
- Radius padrao 8 a 12dp, chips arredondados somente para filtros/tags.
- Touch targets de 44/48dp.
- Usar icones estilo lucide.
- Manter bottom navigation consistente: Inicio, Buscar, Orcamento, Favoritos, Perfil.
- Criar estados loading, vazio, erro e offline quando fizer sentido.
- Nao usar blocos de texto explicando como usar o app; a interface deve ser autoexplicativa.

Telas ja existentes no canvas:
- Splash screen.
- Onboarding de confianca.
- Onboarding de comparacao.
- Selecao de perfil inicial.
- Categorias/verticais.
- Busca geral.
- Termos e politicas.
- Central de ajuda.
- Detalhe da solicitacao.
- Configuracoes.
- Selecionar localizacao.
- Busca sem resultado.
- Notificacoes.
- Meus dados.

Crie agora as telas faltantes abaixo, mantendo o mesmo sistema visual e a mesma navegacao:

1. Home personalizada
- Saudacao curta.
- Barra de busca.
- CTA "Solicitar orcamento".
- Empresas verificadas perto de voce.
- Categorias principais.
- Card para continuar solicitacao em andamento.

2. Resultado de busca com empresas
- Lista de empresas com logo, nome, cidade/estado, nota, numero de avaliacoes, selos e CTAs.
- Chips de filtros ativos.
- Ordenacao.
- Botao de filtros.

3. Bottom sheet de filtros
- Estado/cidade.
- Categoria/vertical.
- Verificadas.
- Nota minima.
- Tipo de projeto.
- Botoes Limpar e Aplicar.

4. Perfil da empresa
- Hero com logo/banner.
- Nota, reviews, selo verificado.
- CTAs sticky: WhatsApp, Orcamento, Site.
- Abas: Visao geral, Avaliacoes, Servicos, Financiamento, Galeria.

5. Comparativo de empresas
- Comparar ate 3 empresas.
- Cards com nota, cobertura, servicos, badges, financiamento.
- CTA "Pedir proposta para todas".

6. Favoritos
- Lista de empresas salvas.
- Empty state quando nao houver favoritos.

7. Wizard de orcamento - Objetivo
- Opcoes: instalar energia solar, comparar proposta, financiar, manutencao, carregador/mobilidade eletrica.

8. Wizard de orcamento - Local e perfil
- CEP/cidade/estado.
- Residencial, comercial, rural, condominio, industria.
- Faixa de conta de luz/consumo.

9. Wizard de orcamento - Contato
- Nome, WhatsApp, e-mail.
- Consentimento LGPD.
- Preferencia de contato.

10. Wizard de orcamento - Sucesso
- Numero da solicitacao.
- Proximos passos.
- Empresas indicadas.
- CTA "Acompanhar solicitacao".

11. Minhas solicitacoes
- Lista por status: enviada, visualizada, respondida, aguardando, concluida.
- Filtros abertas/concluidas.

12. Login
- E-mail/senha.
- Entrar com Google.
- Recuperar senha.
- Continuar como visitante.

13. Cadastro pessoa
- Nome, e-mail, telefone, senha, aceite LGPD.

14. Cadastro empresa
- Nome fantasia, CNPJ, telefone, cidade/estado, categoria principal.
- Link "reivindicar perfil existente".

15. Confirmacao de e-mail
- Codigo/deep link, reenviar codigo, sucesso/erro.

16. Esqueci senha e redefinir senha
- Duas telas: solicitar reset e criar nova senha.

17. Avaliar empresa - entrada
- Selecionar empresa ou continuar da empresa atual.
- Explicar criterios e moderacao de forma curta.

18. Avaliar empresa - notas
- Nota geral, criterios, comentario.

19. Avaliar empresa - sucesso
- Status de moderacao e CTA para perfil.

20. Minhas avaliacoes
- Lista com status publicada, em analise, recusada.

21. Dashboard empresa resumida
- Leads novos, avaliacoes, visualizacoes, trust score, pendencias do perfil.

22. Leads da empresa
- Lista com status novo/respondido/concluido.
- CTAs WhatsApp/telefone.

23. Detalhe do lead
- Dados do cliente, objetivo, local, timeline e marcar como respondido.

24. Editar perfil da empresa
- Logo/banner, descricao, categorias, servicos, cobertura, WhatsApp/CTAs.

25. Midias da empresa
- Galeria, upload, remover/reordenar.

26. Plano e assinatura
- Plano atual, recursos, CTA upgrade, link para billing web.

27. Solicitar verificacao/selo
- Checklist, status e beneficios.

28. Offline
- Dados salvos, tentar novamente, aviso de dados desatualizados.

29. Erro generico
- Mensagem amigavel, tentar novamente, voltar ao inicio.

30. Manutencao
- API indisponivel, status e suporte.

31. Permissoes
- Localizacao, notificacoes, camera/galeria.

32. Politica de privacidade/LGPD
- Consentimentos e gestao de dados.

33. Central de suporte com ticket
- Buscar ajuda, abrir chamado, historico.

34. Debug interno
- Somente build interno: versao, ambiente, status API, usuario logado.

Entregue cada tela como frame separado, com nome claro, mantendo a escala e componentes consistentes. Priorize fluxos completos e estados reais, nao apenas telas bonitas.
```

---

## 12. Alteracoes Necessarias Para Implementar Essas Telas

### Frontend mobile `AB0-1-app`

- Criar rotas Expo Router para todas as telas listadas.
- Criar layout raiz com providers:
  - React Query;
  - Zustand;
  - Theme/design tokens;
  - Auth provider;
  - Analytics provider;
  - Error boundary;
  - Offline controller.
- Criar componentes reutilizaveis:
  - `AppButton`;
  - `AppInput`;
  - `CompanyCard`;
  - `RatingStars`;
  - `TrustBadge`;
  - `FilterChip`;
  - `BottomSheet`;
  - `StatusPill`;
  - `MetricCard`;
  - `Timeline`;
  - `EmptyState`;
  - `ErrorState`;
  - `OfflineBanner`.
- Implementar clientes API:
  - `authApi`;
  - `companiesApi`;
  - `categoriesApi`;
  - `leadsApi`;
  - `reviewsApi`;
  - `companyDashboardApi`;
  - `notificationsApi`;
  - `supportApi`;
  - `analyticsApi`.
- Implementar storage seguro:
  - access token;
  - refresh token se existir;
  - usuario;
  - preferencia de notificacao;
  - filtros recentes.
- Implementar cache:
  - empresas/categorias/localizacao;
  - favoritos;
  - solicitacoes recentes;
  - fila de eventos offline.

### Backend Rails

- Garantir `Authorization: Bearer <token>` em todas as rotas protegidas.
- Padronizar JSON de erro para mobile.
- Adicionar origem em leads, reviews e eventos:
  - `origin=android_app`;
  - `platform=android`;
  - `app_version`;
  - `device_id` anonimizado.
- Criar/validar endpoints mobile para:
  - favoritos;
  - minhas solicitacoes;
  - status/timeline do lead;
  - minhas avaliacoes;
  - notificacoes;
  - ticket de suporte;
  - upload de midia em React Native.
- Ajustar deep links:
  - confirmacao de e-mail;
  - reset de senha;
  - perfil de empresa;
  - solicitacao;
  - campanha UTM.
- Preparar push notifications:
  - token do dispositivo;
  - opt-in/opt-out;
  - notificacoes de lead/review/status.

### Analytics e QA

- Criar dicionario de eventos mobile.
- Separar funis `web`, `pwa`, `android_app`.
- Testar fluxos P0 com Maestro/Detox.
- Criar matriz de dispositivos Android.
- Criar checklist Play Store.

---

## 13. Roadmap Sugerido

### Sprint 0 - Decisao e setup

- Confirmar escopo do MVP.
- Criar `AB0-1-app`.
- Configurar Expo, TypeScript, EAS, lint, testes base.
- Criar design tokens.
- Criar cliente API base.

### Sprint 1 - Auth e shell

- Splash, icone e navegacao.
- Login/cadastro.
- SecureStore.
- Home skeleton.
- React Query provider.
- Error/offline boundary.

### Sprint 2 - Core publico

- Home real.
- Empresas.
- Categorias.
- Busca/filtros.
- Perfil da empresa.
- Analytics basico.

### Sprint 3 - Leads e conversao

- Lead wizard.
- WhatsApp tracking.
- UTM/attribution.
- Consentimento LGPD.
- Estados de sucesso/erro.

### Sprint 4 - Reviews e conta

- Reviews.
- Perfil do usuario.
- Minhas solicitacoes.
- Deep links de auth.

### Sprint 5 - Empresa e publicacao

- Dashboard empresa resumida ou WebView.
- Push notification inicial.
- QA em dispositivos reais.
- Play Store internal track.
- Build APK/AAB.

---

## 14. Criterios de Aceite do APK MVP

- [ ] App instala via APK interno.
- [ ] App abre sem tela branca em rede lenta.
- [ ] Login/cadastro funcionam com JWT salvo em SecureStore.
- [ ] Listagem de empresas consome `/api/v1/companies`.
- [ ] Perfil de empresa abre e mostra CTAs.
- [ ] Lead e enviado para o mesmo backend/admin da web.
- [ ] Eventos mobile aparecem no analytics com `platform=android`.
- [ ] App lida com offline basico.
- [ ] App respeita safe area e touch targets.
- [ ] Build `preview` no EAS gera APK.
- [ ] Build `production` gera AAB para Play Store.

---

## 15. Pendencias Criticas Antes de Codar

1. Confirmar decisao de produto: APK nativo via Expo ou apenas PWA instalavel.
2. Confirmar escopo P0 do MVP.
3. Validar contrato de auth com token no header.
4. Definir package name Android.
5. Separar design final das telas P0.
6. Criar assets de icone/splash/adaptive icon.
7. Definir politica de privacidade para Play Store.
8. Confirmar se dashboard empresa sera nativa ou WebView no MVP.
9. Definir eventos analytics mobile.
10. Configurar EAS e credenciais de assinatura.

---

## 16. Referencias Internas

- `docs/architecture/MADR-001-mobile-platform.md`
- `docs/discovery-app-android.md`
- `docs/architecture/service-worker-strategy.md`
- `AB0-1-front/lib/api.ts`
- `AB0-1-front/lib/api-client.ts`
- `AB0-1-front/app/api/v1/[...path]/route.ts`
- `AB0-1-front/tailwind.config.ts`
- `AB0-1-front/app/globals.css`
- `AB0-1-back/config/routes.rb`
