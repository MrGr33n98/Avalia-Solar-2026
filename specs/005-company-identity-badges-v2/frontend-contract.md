# Contrato frontend

- Categoria usa exclusivamente `identity.primary_category`; `null` omite link/badge.
- Link usa slug canônico: `/categories/{slug}`.
- Verificação usa `identity.verification.status`; estado comercial usa `commercial`.
- Destaque/patrocínio vêm de `distribution`; reconhecimento vem de `recognition.badges`.
- `priority_score` não define texto, selo ou rank na UI.
- Web/mobile renderizam ausência sem fallback de array.
- `CompanyIdentityCard` mantém foco visível, teclado e categoria clicável.
- Inventário completo de consumidores ainda pendente.
