# MCP (Micro Component Pattern) – Arquitetura

- Fronte: micro componentes por domínio (Galeria, Empresa).
- Verso: services/policies desacoplados por caso de uso.
- Contratos explícitos e testes unitários por componente/serviço.

```
Frontend (MCP)
  MediaGallery
    ├─ GalleryHeader
    ├─ GalleryGrid
    ├─ UploadDialog
    └─ VideoDialog
Context7
  └─ gallery store (photos, videos, loading)

Backend (MCP)
  Services: Videos::YouTubeExtractor
  Models: CompanyVideo
  Controller: CompanyDashboardController (media/videos/add/remove)
  Approval: PendingChange (apply_*_changes)
```

## Fluxo de dados
1. Usuário dispara ação (upload/URL).
2. API cria `PendingChange` com `status=pending`.
3. Admin aprova no ActiveAdmin → `apply_changes!`.
4. Front lê somente conteúdo publicado.

