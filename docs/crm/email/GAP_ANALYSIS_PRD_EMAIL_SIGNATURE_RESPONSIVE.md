# GAP Analysis + PRD — Assinatura HTML Responsiva | Avalia Solar

**Documento:** Auditoria Técnica, GAP Analysis, PRD e Arquitetura de Renderização Dual  
**Produto:** Avalia Solar — CRM / Módulo de Mensageria e Vendas  
**Versão:** 2.0 — Especificação e Proposta Técnica  
**Data:** 29/10/2026  
**Status:** Pronto para Implementação  
**Autores:** Staff Frontend & Email HTML Engineer, Product Designer, QA Engineer  

---

## 1. Contexto Executivo e Diagnóstico de Problema

A assinatura de e-mail corporativa do **Avalia Solar** é injetada automaticamente em todas as mensagens comerciais disparadas pelo CRM (via Zoho Mail conectado, AWS SES V2 ou Brevo fallback).

Foi constatado um **problema crítico de renderização no aplicativo Gmail para iOS (iPhone) e outros clientes mobile**, onde a assinatura atual (V2) degrada severamente a legibilidade e a percepção de autoridade da marca.

### Sintomas Comprovados em Dispositivos Móveis:
1. **Assinatura excessivamente alta e verticalizada**: espaçamentos e quebras forçadas aumentam a altura para além de 350px.
2. **Duas colunas comprimidas lateralmente**: a tabela principal possui largura fixa (`width="550"`), forçando a coluna esquerda (`width="120"`) a consumir ~32% da tela de 375px/390px, espremendo o conteúdo textual em míseros ~150px.
3. **Marca d'água roubando espaço útil**: uma imagem de marca d'água de `64x64px` alinhada à direita dentro da coluna de conteúdo força o texto de nome, cargo e contatos a quebrar prematuramente.
4. **Botões e CTAs com quebra indesejada**: links de agendamento e visita à plataforma quebram palavras em 2 a 3 linhas desajeitadas.
5. **WhatsApp sem destaque de conversão**: o canal de WhatsApp atual é apenas um pequeno link inline com ícone minúsculo de 14px, sem o destaque visual de botão premium solicitado (`.button2`).
6. **Perda de contraste em Dark Mode**: o logotipo azul-escuro sobre fundo claro perde legibilidade quando o cliente inverte cores de fundo sem ajustar a imagem.

### Objetivo do Projeto:
Implementar uma **arquitetura de renderização dual (Web vs. Email)**:
- **Versão Web / CRM**: componente interativo rico, com animações suaves, hover, profundidade e SVG otimizado.
- **Versão Email HTML**: estrutura híbrida baseada em tabelas fluidas (max 480px desktop, 100% fluido até 320px no mobile), CSS estritamente inline, ícone de WhatsApp em PNG hospedado via HTTPS e total resiliência a sanitizadores de e-mail e clientes restritivos (Gmail iOS/Android, Outlook Windows/Web, Apple Mail).

---

## 2. Fase 0 — Inventário Técnico READ-ONLY Obrigatório

A inspeção do repositório identificou os componentes, serviços, models e fluxos envolvidos:

| Componente / Arquivo | Camada | Responsabilidade | Problemas / Gaps Encontrados |
| :--- | :--- | :--- | :--- |
| `AB0-1-front/app/dashboard/sales/settings/email/page.tsx` | Frontend (Next.js) | Tela de configuração, upload de foto/logo e gerador da assinatura | Gera HTML com tabela rígida `width="550"`, coluna fixa de `120px` e watermark de `64px`. Não possui preview mobile real (320px/375px). |
| `AB0-1-front/app/dashboard/sales/settings/email/signature-utils.ts` | Frontend (Next.js) | Sanitização de URL, e-mail e parser E.164 do WhatsApp | Parser e sanitizadores funcionais; falta normalização específica de dimensões e templates responsivos. |
| `AB0-1-front/components/sales/create/SendEmailModal.tsx` | Frontend (Next.js) | Composer de e-mail com seleção de assinatura | Envia `include_signature` e `sales_email_signature_id` para a API. |
| `AB0-1-front/components/ui/WhatsAppCTAButton.tsx` | Frontend (UI) | Botão web de WhatsApp para landing pages | Usa SVG inline, Tailwind e eventos JS; não é exportável para HTML de e-mail. |
| `AB0-1-back/app/models/sales/email_signature.rb` | Backend (Rails) | Modelo relacional, validação, ActiveStorage e gerador fallback `build_v2_html` | Duplica o HTML rígido (`width="550"`), regex fixa para `width="83"` no avatar e watermark de 64px. |
| `AB0-1-back/app/services/sales/messaging/renderer.rb` | Backend (Rails) | Renderizador final e sanitizador fail-closed | **Remove explicitamente tags `<style>`** (`gsub(%r{<style\b[^>]*>.*?</style>}im, '')`). Qualquer CSS em `<style>` ou media query é descartado no envio! |
| `AB0-1-back/app/jobs/sales/send_email_job.rb` | Backend (Rails) | Job assíncrono de despacho multi-provedor (Zoho / SES / Brevo) | Concatena a assinatura no corpo (`body_with_signature`) e substitui URLs de anexos ActiveStorage. |
| `AB0-1-back/app/controllers/api/v1/sales/email_signatures_controller.rb` | Backend (Rails) | CRUD REST tenant-scoped e upload de assets | Salva e recupera a assinatura com autorização e escopo do tenant. |
| `AB0-1-back/spec/requests/api/v1/sales/email_signatures_spec.rb` | Backend (Testes) | Teste de requisição da API de assinaturas | Valida campos e HTML atual; deve ser atualizado para o novo padrão. |

---

## 3. Root Cause Analysis (RCA)

Investigação aprofundada dos mecanismos do cliente de e-mail e do backend do Avalia Solar:

```
[Cliente Gmail iOS] 
       ↓ (Viewport 375px)
┌────────────────────────────────────────────────────────┐
│ Tabela Externa (width="550" fixo)                     │
│ ┌───────────────┬────────────────────────────────────┐ │
│ │ Coluna Avatar │ Coluna de Conteúdo                 │ │
│ │ (width="120") │ ┌──────────────────┬─────────────┐ │ │
│ │               │ │ Texto & Contatos │ Watermark   │ │ │
│ │               │ │ (sobra ~150px)   │ (width="68")│ │ │
│ │               │ │ → Quebra forçada │             │ │ │
│ │               │ └──────────────────┴─────────────┘ │ │
│ └───────────────┴────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### Causas Raiz Confirmadas:
1. **Largura Fixa Inflexível (`width="550"` e `style="width:550px"`):**
   - No Gmail iOS e Android, tabelas com largura de atributo `width="550"` não colapsam graciosamente se houver células com larguras fixas filhas. O cliente renderiza a tabela em 550px de viewport interna ou força um layout desproporcional.
2. **Coluna de Avatar Fixa em 120px com Borda Divisória Rígida:**
   - `<td width="120" style="width:120px;padding:17px 12px 12px 13px;border-right:3px solid #ffcd2d;">` ocupa um terço da largura disponível de um smartphone moderno (375px a 414px).
3. **Marca D'água Lateral de 64px:**
   - A célula `<td width="68" valign="middle" align="right">` rouba mais 68px horizontais dentro da área de texto, estrangulando o espaço para o nome, cargo, e-mail e botões.
4. **Remoção de `<style>` no Backend Sanitizer:**
   - Em `Sales::Messaging::Renderer#sanitize_html`:
     ```ruby
     clean = html.to_s.gsub(%r{<style\b[^>]*>.*?</style>}im, '')
     ```
     Qualquer tentativa de usar `@media (max-width: 480px)` para empilhar colunas via CSS falhará silenciosamente no backend do Avalia Solar, pois a folha de estilos é propositalmente eliminada para segurança e conformidade SES.
5. **Comportamento Inverso do Dark Mode:**
   - O Gmail no iOS aplica um algoritmo de inversão tonal heurística. Fundos `#f6f9fd` tornam-se cinza-escuro (`#1f1f1f`), mas o logotipo em PNG sem proteção de contraste perde legibilidade contra o fundo escuro.

---

## 4. GAP Analysis — Estado Atual vs. Estado Desejado

| Componente | Estado Atual (Buggy V2) | Estado Desejado (V3 Responsiva) | Prioridade |
| :--- | :--- | :--- | :--- |
| **Largura Container** | `550px` fixo via HTML e CSS inline | Máx `480px` no desktop, fluida até `100%` (mínimo `320px`) sem overflow | **P0** |
| **Estrutura de Colunas** | 2 colunas rígidas (120px + restante - 68px watermark) | Estrutura híbrida baseada em tabelas compactas e fluidas; avatar alinhado e marca d'água eliminada/reposicionada | **P0** |
| **Botão WhatsApp** | Link simples inline com ícone de 14px e número | Botão dedicado estilizado inspirado no `.button2`: fundo cinza suave, borda refinada, ícone verde oficial e texto escuro | **P0** |
| **Formato do Ícone WA** | Depende de imagem ou falha se SVG inline | PNG oficial de alta resolução (2x/3x) servido por HTTPS, com fallback textual | **P0** |
| **Dark Mode** | Logotipo azul em caixa branca com risco de alto contraste; texto pode perder legibilidade | Contraste testado em temas claro/escuro com proteção de fundo segura no logotipo e cores resilientes | **P0** |
| **Hierarquia Tipográfica** | Títulos e contatos comprimidos verticalmente | Escala harmoniosa: Nome (19–20px), Cargo (12px), Contatos (13px), Entrelinha controlada | **P0** |
| **CTAs Secundários** | Quebra forçada de texto em telas menores | Botões em bloco compacto com `white-space: nowrap` protegido e dimensões proporcionais | **P0** |
| **Gerenciamento de Assets** | URLs absolutas com fallbacks espalhados | Centralização das URLs CDN oficiais via HTTPS | **P0** |
| **Preview de Assinatura** | Preview apenas em desktop no navegador | Simulador multi-dispositivo (Desktop, Mobile 320px, 375px, 390px, 430px, Dark Mode) | **P1** |
| **Compatibilidade** | Depende da tolerância do cliente | Compatível com Gmail Web, Gmail iOS/Android, Apple Mail e Outlook Windows/Mac | **P0** |

---

## 5. Design System — Assinatura Avalia Solar

### 5.1 Especificações Dimensionais

| Elemento | Desktop | Mobile (≤ 414px) | Regra de Implementação |
| :--- | :--- | :--- | :--- |
| **Largura Máxima** | `480px` | `100%` (até `320px`) | `width="100%" style="max-width:480px;"` |
| **Altura Total** | `160px – 190px` | `190px – 240px` | Altura orgânica orientada a conteúdo |
| **Avatar** | `76px × 76px` | `64px × 64px` | Circular (`border-radius:50%`), `object-fit:cover` |
| **Logotipo** | `96px × 24px` | `88px × 22px` | Proporção preservada, fundo transparente protegido |
| **Nome** | `19px` (bold, `#0b2944`) | `17px` (bold, `#0b2944`) | `font-family: Arial, Helvetica, sans-serif` |
| **Cargo / Subtítulo** | `12px` (`#5d7287`) | `12px` (`#5d7287`) | `font-weight: 500` |
| **Contatos (E-mail/Tel)**| `13px` (`#0b2944`) | `13px` (`#0b2944`) | Ícones de 14px alinhados verticalmente |
| **Botão WhatsApp** | `130px – 150px` | `120px – 140px` | Altura `38px – 42px`, cantos `8px` |
| **Padding Externo** | `14px – 16px` | `10px – 12px` | Sem margens verticais externas |
| **Footer Tagline** | `9px` (`#5d7287`) | `9px` (`#5d7287`) | `letter-spacing: 0.5px`, linha discreta |

### 5.2 Paleta de Cores e Tokens

| Token | Código HEX | Utilização |
| :--- | :--- | :--- |
| **Brand Primary (Deep Navy)** | `#0b2944` | Nome, textos de destaque, bordas e botões primários |
| **Brand Accent (Solar Yellow)**| `#ffcd2d` | Destaque do avatar e linha divisória de assinatura |
| **Brand Link (Solar Blue)** | `#0e5ac9` | Links institucionais (Website, LinkedIn) |
| **WhatsApp Green** | `#25d366` | Ícone e acento visual do botão WhatsApp |
| **WhatsApp Dark** | `#075e54` | Borda / texto de alto contraste WhatsApp |
| **Surface Light** | `#f6f9fd` | Fundo principal da assinatura |
| **Surface Alt** | `#eef4fa` | Fundo do card de avatar |
| **Surface Border** | `#dae5ef` | Linhas divisórias e contornos |
| **Button Gray Surface** | `#f1f5f9` | Fundo do botão inspirado no `.button2` |
| **Text Secondary** | `#5d7287` | Cargos, legendas e rótulos auxiliares |

---

## 6. Arquitetura Dual do Novo Botão WhatsApp (.button2)

O design solicitado pelo usuário baseia-se na classe `.button2`:
- Fundo cinza suave (`#f1f5f9` / `#ffffff`)
- Cantos arredondados (`8px` a `10px`)
- Texto escuro (`#0b2944`)
- Ícone oficial verde do WhatsApp
- Efeito de profundidade e elevação discreta

### 6.1 Estratégia de Implementação Dual

```
                     ┌───────────────────────────────┐
                     │   Configuração Centralizada   │
                     │  (Telefone, Mensagem, URL WA) │
                     └───────────────┬───────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
    ┌─────────────────────────┐             ┌─────────────────────────┐
    │     Versão Web / CRM    │             │    Versão E-mail HTML   │
    ├─────────────────────────┤             ├─────────────────────────┤
    │ • Componente React/TSX  │             │ • Tabela HTML + <a>     │
    │ • CSS Hover, Focus, Tap │             │ • Estilos estritamente  │
    │ • Animação e transição  │             │   inline compatíveis    │
    │ • SVG vetorial nativo   │             │ • Ícone PNG via HTTPS   │
    │ • Suporte a tema escuro │             │ • Sem dependência de JS │
    └─────────────────────────┘             └─────────────────────────┘
```

### 6.2 Especificação da Versão Web/CRM (`WhatsAppButton2.tsx`)
```tsx
// Exemplo conceitual do componente Web/CRM
<button className="group relative inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 border border-slate-200/90 hover:border-emerald-300 shadow-2xs hover:shadow-xs transition-all duration-200 active:scale-98">
  <WhatsAppSvgIcon className="w-4 h-4 text-emerald-600 transition-transform group-hover:scale-110" />
  <span className="text-xs font-semibold tracking-tight">WhatsApp</span>
</button>
```

### 6.3 Especificação da Versão E-mail HTML (Bulletproof Table-Button)
Como os clientes de e-mail (Outlook e Gmail) não suportam `:hover`, `:after`, `box-shadow` e removem SVG inline, o botão para e-mail utiliza a técnica **VML/Table-Button com estilo inline**:
```html
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;margin:0;display:inline-block;vertical-align:middle;">
  <tr>
    <td bgcolor="#f1f5f9" style="background-color:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:6px 12px;text-align:center;vertical-align:middle;">
      <a href="https://wa.me/5565993465055?text=..." target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-block;vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#0b2944;line-height:16px;">
        <img src="https://www.avaliasolar.com.br/images/email/whatsapp.png" width="16" height="16" alt="WhatsApp" style="display:inline-block;vertical-align:middle;width:16px;height:16px;border:0;margin-right:6px;" />
        <span style="vertical-align:middle;color:#0b2944;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;">WhatsApp</span>
      </a>
    </td>
  </tr>
</table>
```

---

## 7. Arquitetura Responsiva e Layout Híbrido sem Media Queries

Devido à eliminação mandatória de tags `<style>` pelo sanitizer do backend (`Renderer#sanitize_html`), a assinatura deve ser **inerentemente fluida sem depender de media queries**.

### 7.1 Princípios Arquiteturais da Tabela Fluida:
1. **Container Principal Fluido**:
   - `width="100%"` e `style="width:100%;max-width:480px;"`.
   - Permite encolher suavemente em viewports de 320px sem causar barra de rolagem horizontal.
2. **Estrutura de Linha Compacta (Single-Cell Header ou Proporção Adaptada)**:
   - Eliminar a coluna rígida de 120px com borda pesada.
   - Utilizar uma tabela interna onde o avatar e o logotipo possuem larguras flexíveis ou organizadas em cabeçalho compacto.
   - Eliminar a marca d'água lateral de 64px que sufoca os contatos no mobile.
3. **Proteção de Contraste para Dark Mode**:
   - Logotipo acondicionado em base neutra ou com borda de respiro sutil para manter legibilidade em fundos pretos ou cinza-chumbo invertidos pelo Gmail/Apple Mail.
4. **Espaçamentos Internos Controlados**:
   - `cellpadding="0" cellspacing="0"` com padding direto nas células `<td>`.
   - Parágrafos com `margin: 0 0 4px 0` para evitar margens fantasma inseridas pelo cliente.

---

## 8. Settings & Configuração Centralizada

Os dados da assinatura permanecem armazenados na tabela existente `sales_email_signatures`:
- Coluna `settings` (JSONB) armazena:
  - `full_name`: Nome de exibição
  - `role_title`: Cargo / Função
  - `email`: E-mail corporativo
  - `phone`: Telefone / WhatsApp
  - `avatar_url`: URL pública HTTPS
  - `logo_url`: URL pública HTTPS
  - `website_url`: Link institucional
  - `linkedin_url`: Perfil no LinkedIn
  - `calendly_url`: Link de agendamento de reuniões
  - `cta_text`: Texto do botão de agendamento
  - `whatsapp_custom_message`: Mensagem inicial pré-configurada do WhatsApp
  - `footer_tagline`: Frase institucional do rodapé

A edição é centralizada em [EmailSignaturesPage](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-front/app/dashboard/sales/settings/email/page.tsx), garantindo que alterações reflitam imediatamente no e-mail sem manipulação manual de código pelo vendedor.

---

## 9. Simulador e Preview Multi-Dispositivo

A página de configuração deve incorporar um **Preview Responsivo Interativo** com seletor de viewport e tema:

1. **Desktop View** (Largura total: 480px)
2. **Mobile View 320px** (iPhone SE 1ª geração / Telas ultracompactas)
3. **Mobile View 375px** (iPhone 8 / SE 2ª geração / iPhone mini)
4. **Mobile View 390px** (iPhone 12 / 13 / 14 / 15 / 16)
5. **Mobile View 430px** (iPhone Pro Max / Android grandes)
6. **Alternador Light Mode / Dark Mode simulado** (inversão de background e contraste)
7. **Modo Imagens Bloqueadas** (validação de textos alternativos e links)

---

## 10. User Stories e Critérios de Aceitação

| ID | User Story | Critério Essencial de Aceite | Prioridade |
| :--- | :--- | :--- | :--- |
| **US-01** | Como vendedor, quero que minha assinatura se adapte perfeitamente ao celular do lead. | Não provoca rolagem horizontal nem quebra desproporcional entre 320px e 480px no Gmail iOS. | **P0** |
| **US-02** | Como destinatário, quero um botão claro de WhatsApp para iniciar uma conversa direta. | Botão no modelo `.button2` com ícone verde, texto legível e link funcional `https://wa.me/55...`. | **P0** |
| **US-03** | Como administrador, quero alterar dados e fotos nas configurações sem mexer no HTML. | Configurações persistidas em `settings` e refletidas em tempo real. | **P0** |
| **US-04** | Como usuário em Dark Mode, quero ler a assinatura sem perda de contraste no logo. | Logotipo e textos permanecem nítidos e contrastados em clientes com tema escuro. | **P0** |
| **US-05** | Como operador, quero testar e visualizar a assinatura em múltiplos tamanhos de tela. | Simulador interativo com viewports de 320px, 375px, 390px e simulação Dark Mode. | **P1** |
| **US-06** | Como destinatário em Outlook ou Gmail, quero receber um HTML sem código quebrado. | Código 100% inline, sem scripts, sem `<style>` volátil e sem imagens quebradas. | **P0** |

---

## 11. Tasklist de Implementação Priorizada

### Fase 1 — Modelagem e Gerador de HTML Bulletproof (Backend + Frontend)
- [ ] **T-101 / P0**: Criar o gerador de HTML V3 em `signature-utils.ts` e `email_signature.rb` com tabela fluida (máx. 480px, 100% adaptativa até 320px).
- [ ] **T-102 / P0**: Implementar o botão WhatsApp V3 com estrutura table-button bulletproof, ícone PNG HTTPS e link direto `https://wa.me/55...`.
- [ ] **T-103 / P0**: Remover a marca d'água lateral de 64px que obstrui a largura útil de texto no mobile.
- [ ] **T-104 / P0**: Adicionar proteção de contraste para logotipo e avatar em Dark Mode.
- [ ] **T-105 / P0**: Atualizar as chamadas em `Sales::SendEmailJob` e `Sales::Messaging::Renderer` para compatibilidade com o novo markup.

### Fase 2 — UI/UX e Preview na Central de Configuração
- [ ] **T-106 / P1**: Implementar o componente `.button2` interativo (Web/CRM) para exibição na interface web.
- [ ] **T-107 / P1**: Integrar controles de simulação de viewport (320px, 375px, 390px, 430px, Desktop) no preview da página `/settings/email`.
- [ ] **T-108 / P1**: Adicionar chave de alternância Light / Dark Mode no preview para validação visual instantânea.
- [ ] **T-109 / P1**: Campo para mensagem inicial customizada do WhatsApp (`whatsapp_custom_message`).

### Fase 3 — Testes, Matriz de QA e Rollout
- [ ] **T-110 / P0**: Atualizar testes de request spec no Rails (`email_signatures_spec.rb`).
- [ ] **T-111 / P0**: Criar testes unitários em Jest para o novo gerador HTML em `AB0-1-front/__tests__/components/sales/email-signature.spec.ts`.
- [ ] **T-112 / P0**: Validar envio real de e-mail de teste e inspecionar payload sanitizado.
- [ ] **T-113 / P0**: Documentar limitações conhecidas de clientes e publicar na branch `main`.

---

## 12. Matriz de QA Cross-Client

| Cliente de E-mail | Dispositivo / SO | Renderizador | Sem Overflow (≥ 320px) | Botão WA Clicável | Dark Mode Legível |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Gmail App** | iOS (iPhone 12/13/14/15) | WebKit / Gmail Parser | Sim | Sim | Sim |
| **Gmail App** | Android | Blink / Gmail Parser | Sim | Sim | Sim |
| **Gmail Web** | Chrome / macOS & Windows | Blink / Web | Sim | Sim | Sim |
| **Apple Mail** | iOS / iPadOS | WebKit nativo | Sim | Sim | Sim |
| **Apple Mail** | macOS | WebKit nativo | Sim | Sim | Sim |
| **Outlook Desktop** | Windows (M365) | Word Engine (MSO) | Sim | Sim | Sim |
| **Outlook Web** | Edge / Chrome | Blink / OWA | Sim | Sim | Sim |
| **Outlook Mobile** | iOS & Android | WebKit / Blink | Sim | Sim | Sim |

---

## 13. Definition of Done (DoD)

- [ ] Causa raiz do bug de renderização no Gmail iOS documentada com evidências de código.
- [ ] Novo botão de WhatsApp implementado com estratégia dual (Web/CRM interativo + Email HTML bulletproof).
- [ ] Assinatura fluida sem quebra de layout a partir de 320px de largura.
- [ ] Nenhuma dependência de `<style>` ou CSS externo que possa ser excluído no envio.
- [ ] Logotipo visível e legível em Light Mode e Dark Mode.
- [ ] Preview responsivo na interface com alternância de tamanhos e temas.
- [ ] Testes unitários e de integração passando no frontend e backend.
- [ ] Validação do fluxo de envio real via `SendEmailModal` sem erros.
