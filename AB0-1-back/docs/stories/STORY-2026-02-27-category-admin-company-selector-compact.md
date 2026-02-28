# STORY-2026-02-27: Compactar seleção de empresas no admin de categorias

## Contexto
O formulário de categorias no ActiveAdmin exibe a associação com empresas como uma lista longa de checkboxes. Em categorias com muitas empresas, a tela fica extensa demais e exige scroll excessivo para localizar, revisar e editar associações.

## Requisito
Substituir a lista longa por uma experiência compacta com busca local, contador de selecionadas, visualização resumida das empresas escolhidas e uma lista rolável com altura fixa.

## Acceptance Criteria
- [x] A seção de empresas na edição de categorias permite buscar por nome sem recarregar a página.
- [x] A lista de empresas fica dentro de um painel com altura fixa e scroll interno.
- [x] O formulário exibe contador de empresas selecionadas.
- [x] O formulário permite alternar entre ver todas as empresas e ver apenas as selecionadas.
- [x] As empresas selecionadas aparecem resumidas no topo da seção.
- [x] O envio do formulário continua compatível com `category[company_ids][]`.
- [x] As validações relevantes foram executadas e qualquer bloqueio remanescente foi documentado.

## Checklist de Implementação
- [x] Refatorar a seção `Associations` em `app/admin/categories.rb`.
- [x] Adicionar JavaScript do ActiveAdmin para filtro local e resumo de selecionadas.
- [x] Adicionar estilos específicos para a nova experiência compacta.
- [x] Validar sintaxe Ruby do admin resource.
- [x] Validar o JavaScript/CSS carregado no ActiveAdmin ou documentar bloqueio.

## File List
- [x] `app/admin/categories.rb`
- [x] `app/assets/javascripts/active_admin.js`
- [x] `app/assets/javascripts/admin/category_company_selector.js`
- [x] `app/assets/stylesheets/active_admin.scss`
- [x] `docs/stories/STORY-2026-02-27-category-admin-company-selector-compact.md`

## Validation
- [x] `ruby -c app/admin/categories.rb`
- [x] `node --check app/assets/javascripts/admin/category_company_selector.js`
- [ ] Validação visual no navegador do ActiveAdmin (não executada neste ambiente; precisa abrir `/admin/categories/:id/edit` para conferir o comportamento final)
