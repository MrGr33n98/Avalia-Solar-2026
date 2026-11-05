# Avalia Solar — Programa de Badges 2026 (lançamento)

## Escopo
A aba `/dashboard?tab=avalia-badges` usa um catálogo fixo de sete badges G2-inspired em SVG, sem os quatro modelos demonstrativos anteriores. A aba de widget de confiança continua separada.

**Selos (7):** Pioneira 2026; Líder de Categoria; Líder de Crescimento; Referência Regional; Melhor Suporte; Especialista Comercial; Especialista Residencial.

**Arquivos:** `AB0-1-front/public/assets/badges/2026/*.svg`; correspondentes PNGs para entrega institucional no pacote de design.

## Modelo de progressão
1. **Descoberta** — todos os sete selos aparecem no catálogo como arte de prévia (não concedida).
2. **Atividade** — a empresa acompanha o marco inicial de cinco avaliações, apenas quando o total está presente nos dados reais do dashboard. Este marco não gera selos automaticamente.
3. **Elegibilidade** — cumprir a missão descrita e os pré-requisitos de evidência; os selos de liderança dependem de uma temporada e metodologia pública.
4. **Apuração** — a equipe verifica dados e contexto, inclusive prevenção de avaliações fraudulentas.
5. **Concessão** — registro exclusivo em `badges` + `company_badges` via ActiveAdmin; selo aparece como conquistado no dashboard.
6. **Distribuição** — somente selos concedidos liberam arquivo SVG, embed HTML e link de verificação específica da empresa.
7. **Revogação** — a consulta pública com `?company_id=` verifica associação ativa diretamente no backend e evita cache no resultado de concessão.

## Inicialização das definições no Rails

```bash
cd AB0-1-back
bundle exec rake badges:seed_launch_2026
```

O comando é idempotente, não concede nenhum selo, não altera concessões existentes e preserva selos do catálogo já cadastrados. As imagens vetoriais estão no frontend; imagens PNG podem ser anexadas via ActiveAdmin para aplicações externas.

## Critérios e proteção de reputação
- **Pioneira 2026** — campanha inaugural em SC; lote/prazo publicados; perfil reivindicado e validado, concessão manual.
- **Líder de Categoria** — ranking por categoria com amostra mínima, avaliações autênticas e período encerrado; não conceder por plano.
- **Líder de Crescimento** — evolução consistente entre períodos comparáveis com amostra suficiente; não conceder por visitas isoladas.
- **Referência Regional** — região e comparáveis elegíveis; localização confirmada; avaliação de clientes.
- **Melhor Suporte** — evidência de atendimento/pós-venda em avaliações com dimensão específica, não apenas tempo de resposta.
- **Especialista Comercial / Residencial** — especialidade validada por portfólio e categorias; não representa liderança nem qualidade superior por si só.

A política de conceder selos precisa ser oficializada antes da primeira outorga; nenhum limiar numérico isolado gera badges de liderança.

## Planos e segurança
Reconhecimento por mérito é independente de Free, Essencial, Pro ou Enterprise. Downloads só são liberados no dashboard quando o backend retorna concessão oficial com `year=2026` e `public_slug`. Não gerar localmente uma concessão a partir de `reviews_count`, `verified`, `plan_tier` ou `has_paid_plan`.

A rota pública `/badges/[slug]?company_id=NNN` solicita ao Rails a prova da associação, apresentando explicitamente a situação confirmada ou não confirmada.

## Testes sugeridos
```bash
cd AB0-1-front
npm test -- --runInBand lib/badges/avalia-badges-2026.spec.ts app/dashboard/components/badges/AvaliaBadgesWorkspace.spec.tsx
npm run typecheck
npm run build
```

Verificar manualmente viewport PWA em 320, 360, 390 e 430px; Free e pago; empresa sem badges, com badge e com erro na API; mudança de empresa no dashboard; revogação no ActiveAdmin; link e embed; renderização da página pública; nenhuma concessão automática.

## Limites desta implementação
- O catálogo, filtros e progresso são funcionais no frontend; o cadastro das definições precisa executar a tarefa Rails após deploy.
- Rankings e premiações competitivas ainda exigem metodologia/serviço de apuração formal.
- O pacote PNG é material de distribuição, não prova de que uma empresa recebeu o selo.
