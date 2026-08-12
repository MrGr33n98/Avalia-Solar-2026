# Retrieval Minimization

`Chat::RetrievalService` classifica consulta em domínios (`profile`, `coverage`, `plans`, `entitlements`, `products`, `health`) e monta contexto somente com allowlist correspondente.

- Chat Success não recebe CNPJ, telefone, WhatsApp, e-mail, plano nominal ou URLs de contato.
- Estatística global da plataforma não é enviada ao Success.
- Perguntas de cobertura, planos e produtos não carregam perfil completo.
- Falha de classificação usa apenas perfil público mínimo.
