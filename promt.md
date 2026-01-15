Aqui vai um **PROMPT pronto (copiar/colar)** para você usar com um dev/IA (tipo “search_codebase / implementar”) e transformar a **aba Galeria** exatamente no padrão da imagem **+** implementar o fluxo completo (backend + admin + frontend) com aprovação via `PendingChange`.

---

## Prompt (copie e cole)

Você é um engenheiro full-stack sênior especializado em **Ruby on Rails (API + ActiveStorage + ActiveAdmin)** e **Next.js (App Router) + React + Tailwind + shadcn/ui**.
Quero implementar a **aba “Galeria”** no perfil público de empresa (Company Detail), com layout e UX igual ao screenshot fornecido, e finalizar o fluxo de mídia no dashboard.

### Contexto do meu codebase

* Backend Rails: `AB0-1-back`
* Frontend Next: `AB0-1-front`
* Existe upload de mídia no dashboard mas está incompleto.
* Arquivos já encontrados:

  * Front: `app/dashboard/components/MediaGallery.tsx` (grid simples, upload só imagens)
  * Back: `app/models/company.rb` (usa `has_many_attached :media_assets`)
  * Back: `app/models/pending_change.rb` (tem fluxo de aprovação `apply_media_changes`)
  * Back: `app/controllers/api/v1/company_dashboard_controller.rb` (tem `upload_media` para imagens)
  * Back: `app/admin/companies.rb` (sem UI de galeria / aprovação)
  * Back: `config/routes.rb` (rota `post 'upload_media'` existe)

### Objetivo (o que implementar)

#### 1) Página pública da empresa – Aba “Galeria” (UI/UX)

* Na página `/empresas/:slug` (company detail), a navegação por abas já existe: **Visão Geral / Produtos / Avaliações / Financiamento / Galeria / Estatísticas**
* Implementar a aba **Galeria** com:

  * Layout em **2 colunas**:

    * **Coluna principal** (esquerda): grid de mídia (fotos e vídeos)
    * **Coluna lateral** (direita): card “Informações de Contato” (telefone, localização, email etc.) como no screenshot
  * **Estados**:

    * se não houver mídia publicada: mostrar empty state “Galeria de fotos em desenvolvimento.” com ícone e visual clean
    * loading skeleton
    * error state amigável
  * **Grid**:

    * thumbnails responsivos
    * clique abre modal/lightbox (foto em zoom; vídeo embed)
  * **Vídeos**: suportar **YouTube** via URL (thumbnail + abrir embed)
* Importante: **não quebrar layout atual** do header/banner/CTA “Solicitar Orçamento”.

#### 2) Dashboard da empresa – gerenciamento de Galeria (Fotos + Vídeos)

* Refatorar `MediaGallery.tsx` para ficar premium e consistente com shadcn/ui:

  * `Tabs`: **Fotos** | **Vídeos**
  * Fotos:

    * upload múltiplo (jpg/png/webp)
    * preview local
    * progress / feedback
    * badge “Pendente” para itens aguardando aprovação (se aplicável)
  * Vídeos:

    * botão “Adicionar vídeo”
    * modal com input de URL (YouTube)
    * validação client-side (url válida + extrair ID)
    * preview de thumbnail antes de salvar
* Toda alteração deve seguir o fluxo de **aprovação** com `PendingChange`.

#### 3) Backend Rails – completar suporte a Vídeos e Aprovação

Hoje só existe `media_assets` (imagens). Precisamos adicionar vídeos mantendo o padrão `PendingChange`.

Implementar:

* **Opção recomendada**: criar model `CompanyVideo`

  * campos: `company_id`, `url`, `provider` (youtube), `video_id`, `title` (opcional), `thumbnail_url`, `position` (opcional), `status` (published/pending)
* Atualizar `Company`:

  * `has_many :company_videos, dependent: :destroy`
  * manter `has_many_attached :media_assets`
* Atualizar `PendingChange`:

  * suportar mudanças de vídeo (`change_type: "video"` ou payload distinguível)
  * implementar `apply_video_changes` (similar ao `apply_media_changes`)
* Atualizar controller `CompanyDashboardController`:

  * manter `upload_media` (imagens)
  * criar endpoint `add_video` (POST) para receber URL e criar `PendingChange` (pendente)
  * criar endpoint `remove_video` (DELETE) com `PendingChange` (pendente)
* Validação:

  * aceitar só youtube (por enquanto)
  * extrair `video_id` e gerar `thumbnail_url` padrão do youtube
  * retornar erros claros (422) para URL inválida

#### 4) ActiveAdmin – tela de aprovação e gestão

* Criar `app/admin/pending_changes.rb` (ou equivalente) para o admin aprovar/rejeitar:

  * listar pendências por empresa
  * preview da mudança (imagem thumb / vídeo thumb)
  * ações: **Aprovar** (aplica) / **Rejeitar** (descarta)
* Atualizar `app/admin/companies.rb`:

  * adicionar seção “Galeria” mostrando:

    * imagens publicadas (`media_assets`) com preview
    * vídeos publicados (`company_videos`) com thumbnail e link/embed
  * (opcional) permitir admin adicionar/remover diretamente

### Regras obrigatórias

* Não remover `has_many_attached :media_assets` nem quebrar upload existente.
* Reutilizar `PendingChange` como gatekeeper (nada entra no público sem aprovação).
* No público, **mostrar apenas conteúdo aprovado/publicado**.
* Código limpo, com validações e mensagens de erro boas.
* Use shadcn/ui no frontend onde for aplicável (Tabs, Dialog, Button, Skeleton, Card).
* Implementar de forma incremental com PRs/commits lógicos:

  1. backend vídeos + migrações
  2. admin pendências
  3. dashboard MediaGallery (tabs)
  4. company detail tab “Galeria” + modal viewer

### Entregáveis

1. Lista de arquivos que serão alterados/criados (com caminhos)
2. Migrações Rails completas
3. Models/Controllers/Routes (Rails)
4. ActiveAdmin resources
5. Frontend components (Next.js):

   * `MediaGallery.tsx` refatorado
   * `CompanyDetail` tab Galeria (novo componente)
   * modal/lightbox
6. Pequeno checklist de testes manuais (upload imagem, adicionar vídeo, aprovar, visualizar no público)

Comece implementando pelo backend (CompanyVideo + endpoints + PendingChange) e depois siga para o admin e frontend.

---

### Se quiser, eu adapto o prompt para o seu padrão real de rotas/componentes

Se você me disser **qual arquivo renderiza as tabs do CompanyDetail** (ex: `app/companies/[slug]/page.tsx` ou `CompanyDetailTabs.tsx`) e como você busca o `company` (API/SSR), eu te devolvo uma versão **100% acoplada** ao seu projeto, com nomes de endpoints e props certinhos.

---

## Arquitetura MCP implementada

### Princípios
- Componentes pequenos, autocontidos, com contratos claros (props/DTOs).
- Separação por domínio (Galeria, Empresa, Banners) e papéis (View/Hook/Service).
- Estado global via Context7, com stores de domínio.

### Estrutura (Resumo)
- Frontend:
  - `AB0-1-front/app/context7/provider.tsx` – Provider e hooks (`useGalleryContext7`).
  - `AB0-1-front/app/dashboard/components/MediaGallery.tsx` – Composição MCP (Header, Grid, Dialog).
- Backend:
  - `AB0-1-back/app/models/company_video.rb` – Vídeos aprovados/publicados.
  - `AB0-1-back/app/services/videos/youtube_extractor.rb` – Validação/extração YouTube.
  - `AB0-1-back/app/controllers/api/v1/company_dashboard_controller.rb` – `media`, `videos`, `add_video`, `remove_video`.
  - `AB0-1-back/app/admin/pending_changes.rb` e `AB0-1-back/app/admin/companies.rb` – Aprovação e visualização.

### Fluxo de contexto (context7)
```
[MediaGallery] --dispatch--> [Context7Provider.gallery]
      |                               |
  fetch /media, /videos          outros componentes consomem
      v                               v
[CompanyDashboardController] --- JSON ---> Front
```

## Exemplos shadcn-ui
- Tabs:
```tsx
<Tabs value="photos">
  <TabsList>
    <TabsTrigger value="photos">Fotos</TabsTrigger>
    <TabsTrigger value="videos">Vídeos</TabsTrigger>
  </TabsList>
  <TabsContent value="photos">...</TabsContent>
</Tabs>
```
- Dialog:
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Adicionar Vídeo</DialogTitle>
    </DialogHeader>
    <Input placeholder="URL do YouTube" />
    <DialogFooter>
      <Button>Enviar</Button>
    </DialogFooter>
  </DialogContent>
<Dialog>
```

## Fluxo de aprovação (PendingChange)
```
Upload/URL -> PendingChange(pending)
Admin aprova -> apply_changes! (anexa imagem / cria CompanyVideo)
Público/Front -> só conteúdo published
```
