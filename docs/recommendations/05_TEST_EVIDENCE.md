# Evidências de Testes e Validação de Qualidade

**Data de Execução:** 20/10/2026  
**Ambiente:** Local / Test Runner  
**Branch:** `feature/related-companies-geo-protection`  

---

## 1. Testes Unitários de Frontend (Jest + React Testing Library)

### Comando Executado:
```bash
cd AB0-1-front && npm test -- RelatedCompanies
```

### Saída Real do Test Runner:
```text
PASS app/companies/[id]/components/RelatedCompaniesCarousel.spec.tsx
  RelatedCompaniesCarousel - Anti-Leak & Mode Matrix
    Proteção Comercial e Prevenção de Brecha (Zero Entitlement Leak)
      ✓ renderiza "Perfil Protegido Exclusivo" quando empresa PAGA tem proteção ativa (mode=protected) (180 ms)
      ✓ NUNCA exibe "Perfil Protegido Exclusivo" para empresa Free quando showAlternatives é falso (oculta silenciosamente) (12 ms)
      ✓ exibe "Perfil Protegido Exclusivo" para empresa Paga via fallback legado de showAlternatives=false (24 ms)
    Estados de Carregamento, Erro e Vazio
      ✓ renderiza skeleton de carregamento quando mode=loading (50 ms)
      ✓ renderiza estado de erro e dispara onRetry quando o botão é clicado (375 ms)
      ✓ renderiza estado vazio honesto quando mode=empty (120 ms)
    Renderização de Resultados e Acessibilidade
      ✓ renderiza os cards de concorrentes no carrossel com controles de navegação (739 ms)

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        6.052 s
Ran all test suites matching RelatedCompanies.
```
**Resultado:** **100% PASS** (7 testes aprovados, 0 falhas).

---

## 2. Verificação de Tipagem Estática (TypeScript Compiler)

### Comando Executado:
```bash
cd AB0-1-front && npm run typecheck
```

### Saída Real do Compilador:
```text
> nextjs@0.1.0 typecheck
> tsc --noEmit

[Process finished with exit code 0]
```
**Resultado:** **100% PASS** (0 erros de tipagem em todo o projeto Next.js).

---

## 3. Verificação de Espaços e Quebras de Linha no Git

### Comando Executado:
```bash
git diff --check
```

### Saída Real:
```text
[Process finished with exit code 0]
```
**Resultado:** **100% PASS** (0 erros de *whitespace* ou formatação).

---

## 4. Testes de Especificação do Backend (RSpec)

### Arquivo Adicionado:
[`AB0-1-back/spec/services/banners/banner_delivery_query_spec.rb`](file:///home/felipe/.gemini/antigravity-ide/scratch/Avalia-Solar-2026/AB0-1-back/spec/services/banners/banner_delivery_query_spec.rb)

### Casos de Teste Criados:
1. `bloqueia banner de concorrente no servidor quando block_competitors é true`
   - Valida que banners institucionais (`company_id: nil`) e banners da própria empresa são entregues, mas banners de empresas concorrentes (`company_id != self`) são excluídos no SQL.
2. `bloqueia banner de concorrente no servidor quando a empresa do perfil possui plano pago`
   - Valida que `Company#has_paid_plan? == true` ativa o filtro de exclusão no SQL automaticamente.
3. `permite anúncios de terceiros quando empresa é Free e block_competitors é false`
   - Valida que perfis gratuitos continuam monetizados com anúncios de parceiros e concorrentes aprovados.

*Nota de Execução Operacional:* O ambiente Docker em execução na máquina hospedeira opera com `RAILS_ENV=production`. Conforme as regras de segurança estritas e mandatórias do projeto, comandos de teste Rails não foram executados contra o banco de produção para prevenir qualquer mutação em dados reais. A execução em ambiente de CI/staging isolado é recomendada através de `bundle exec rspec spec/services/banners/banner_delivery_query_spec.rb`.
