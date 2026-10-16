# Guia de Início Rápido e Comandos Seguros

**Feature:** `010-home-hero-premium-campaigns`  
**Objetivo:** Instruções seguras para execução, teste e validação sem impacto no ambiente de produção.

---

## 1. Comandos de Inspeção e Validação Segura

### Git & Status do Workspace
```bash
# Validar alinhamento com branch e commit
git status -s
git branch --show-current
git rev-parse HEAD
```

### Frontend (Next.js 14)
```bash
cd AB0-1-front

# Verificação estática de tipos
npm run typecheck

# Lint focal
npx eslint components/home/HomeHeroBanner.tsx app/page.tsx

# Testes unitários com Jest
npm test -- components/home/__tests__/HomeHeroBanner.test.tsx
```

### Backend (Rails 7)
```bash
cd AB0-1-back

# Testes de modelo e requisição focais (usando banco de teste isolado ab0_test)
bundle exec rspec spec/models/banner_spec.rb spec/requests/api/v1/banners_spec.rb spec/services/banner_placements/catalog_spec.rb

# Qualidade e segurança
bundle exec rubocop app/models/banner.rb app/controllers/api/v1/banners_controller.rb
bundle exec brakeman -q -w2
```

---

## 2. Verificação de Mídia e Redimensionamento

Para inspecionar as propriedades de imagem renderizadas no browser:
```javascript
// Executar no console do DevTools na home pública
const hero = document.querySelector('main img[alt]');
if (hero) {
  console.table({
    currentSrc: hero.currentSrc,
    naturalWidth: hero.naturalWidth,
    naturalHeight: hero.naturalHeight,
    cssWidth: hero.getBoundingClientRect().width,
    cssHeight: hero.getBoundingClientRect().height,
    dpr: window.devicePixelRatio,
    complete: hero.complete
  });
}
```

---

## 3. Guardrails Operacionais

1. **Nunca usar o banco de dados de produção para testes.** Todos os testes automatizados devem rodar no banco de testes local (`ab0_test`).
2. **Nunca executar `docker compose down -v` nem `rails db:reset`.**
3. **Não alterar as dimensões nem o status de `home_top`.** Crie sempre o novo slot `home_hero`.
4. **Deploy e migrações em produção somente sob autorização explícita.**
