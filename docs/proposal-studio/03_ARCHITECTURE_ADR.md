# 03 — Architecture Decision Record (ADR)

## Contexto
O Avalia Solar opera como um marketplace de energia solar multi-tenant de alta confiabilidade. O módulo de propostas deve fornecer personalização de formulários e modelos PDF/digitais preservando a segurança, auditoria e imutabilidade de versões publicadas.

## Decisões Tomadas

### ADR-01: Persistência de Configurações Via Entidade de Termos Versionados
- **Decisão:** Utilizar a relação `MarketplaceProposalVersion.has_many :terms, class_name: 'MarketplaceProposalTerm'` para persistir as chaves do Proposal Studio (`studio_template_id`, `studio_main_color`, `studio_cover_image_url`, `studio_section_*`, `studio_form_fields`, `studio_digital_*`, `payment_conditions`, `studio_validity_date`).
- **Justificativa:** 
  1. A tabela `marketplace_proposal_terms` já existe no PostgreSQL com colunas `key`, `label`, `value`, `position`, `version_id`.
  2. O Rails controller `ProposalsController#update` já possui o método `replace_terms(version, payload[:terms])`.
  3. O método `create_next_version` no backend já copia todos os termos de uma versão anterior para a nova versão.
  4. Elimina a necessidade de migrações arriscadas ou downtime, mantendo 100% de retrocompatibilidade com a API.
  5. Assegura imutabilidade: quando a versão é publicada, seus termos são bloqueados por `immutable_after_publishing`.

### ADR-02: Desacoplamento entre Pré-visualização e Edição
- **Decisão:** Separar a rota/modal de visualização (`ProposalReadonlyPreview`) do fluxo de edição (`ProposalWizardEditor`).
- **Justificativa:** Impede que o usuário execute alterações acidentais ao apenas consultar o documento, respeita o princípio de menor privilégio para visualizadores e fornece prévia idêntica à que o comprador recebe.

### ADR-03: Suporte a PDF Próprio e PDF Gerado
- **Decisão:** Manter os dois caminhos de documento: upload de PDF proprietário do integrador (via ActiveStorage com scanner de segurança) e geração dinâmica baseada no modelo Avalia Solar.
- **Justificativa:** Atende tanto grandes integradores que já possuem software CAD/dimensionador próprio quanto empresas que desejam padronizar sua proposta comercial na plataforma.

### ADR-04: Isolamento Multi-tenant Estrito
- **Decisão:** Todas as chamadas de listagem, exibição, edição e upload exigem `before_action :authenticate_company_user_or_admin!` e `before_action :ensure_company_access!`.
- **Justificativa:** Garante que a Empresa A jamais acesse ou modifique propostas ou templates da Empresa B, mesmo manipulando IDs na URL ou payloads HTTP.
