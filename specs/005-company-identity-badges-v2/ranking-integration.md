# Integração com ranking

`priority_score` participa de ordenação/colocação em `Company` (`company.rb:386-400`). Isso não o torna rank público, prêmio ou vencedor. Ranking oficial tem ADRs próprios (`docs/adr/0007-identidade-rankingscope.md`, `0008-quality-gates-ranking.md`); não alterar metodologia nesta spec.

Identidade/distribuição não devem inferir colocação. Consumidor precisa receber contrato próprio de ranking; inventário desse contrato ainda pendente.
