# Central de Avaliações — UX IBM e fluxo de revisão do autor

**Escopo:** web/PWA em '/review-dashboard' e '/review-dashboard/reviews'. 
**Referência:** padrões visuais IBM/Carbon (não é uma instalação do Carbon React).

## Experiência PWA

- Cabeçalho enxuto, com título e duas ações reais: avaliar empresa e acessar suas avaliações.
- Quatro indicadores compactos, no mesmo grid de quatro colunas em todos os tamanhos. Número ao lado de marcador geométrico e rótulo; sem cartões enormes ou ícones decorativos.
- Listagem com logotipos reais do perfil da empresa; avatar circular com iniciais como fallback.
- Minha lista: busca por empresa/título, filtros por status, ordenação, detalhes, moderação, resposta da empresa.
- Compartilhamento só de avaliações aprovadas com slug da empresa.
- Botões com altura mínima de 44px no mobile e estados de foco visíveis.
- Interface em português, usando cores com significado operacional (publicado, em análise, rejeitado).
- Não alterar a navegação global da plataforma nem restaurar Creator/Feed.

## Contrato REST

'GET /api/v1/reviews/mine' retorna apenas avaliações do usuário atual, incluindo 'moderation_notes' e 'moderated_at', campos **privados**. A central exige REST nessa tela, evitando a ausência dos campos privados no payload GraphQL legado.

'GET /api/v1/reviews/:id' permite acesso público apenas a avaliações aprovadas. Autores autenticados podem acessar as próprias avaliações ainda não publicadas.

'PUT /api/v1/reviews/:id' aceita edição pelo autor somente nos status 'pending', 'in_analysis' e 'rejected', exclusivamente dos campos de conteúdo: rating, headline, comment, buyer_tip, pros e cons. Não aceita alteração de company_id, user_id, status nem campos internos da moderação.

Ao salvar, reverte a avaliação para 'pending', limpa o motivo de rejeição anterior e registra um 'ReviewAuditEvent' ('review_resubmitted' ou 'review_updated_by_author'), em transação com o conteúdo modificado.

Alterações de avaliações aprovadas são **bloqueadas**: não podem modificar uma publicação sem uma versão editorial separada e nova moderação.

## Lacunas intencionais

- Rascunhos persistidos no backend: o enum Review atual não possui 'draft'. Não exibir filtro de rascunhos inexistente.
- Edição versionada de aprovadas: requer nova entidade ReviewRevision, API de revisão e aplicação de versões após decisão administrativa.
- Histórico completo em tela: o audit existe no Rails, mas ainda não foi exposta uma API de timeline para o autor.
- Notificações de moderação: dependerá de verificação dos eventos do modelo de notificações e canais opt-in; não prometer push automático nesta entrega.
- Privacidade/anônimato: não implementar toggle sem uma revisão conjunta da política de consentimento LGPD e da publicação da identidade.
- Empresas assinantes não possuem ações adicionais sobre moderação.

## Validar antes de produção

1. 'cd AB0-1-front && npm run typecheck && npm test -- --runInBand ReviewMetricStrip.test.tsx'
2. 'cd AB0-1-back && bundle exec rspec spec/requests/api/v1/reviews_reviewer_workflow_spec.rb'
3. E2E com iPhone viewport 390px: verificar os quatro indicadores na mesma linha, contraste, logotipos, lista e navegação sem scroll horizontal.
4. Testar os fluxos: publicada, pendente, em análise, rejeitada corrigida, erro 422, 403 e sessão expirada.
5. Checar RSpec, Next build e migrations via CI antes de merge na branch main.
